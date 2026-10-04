import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { isEmailEnabled, sendPasswordResetEmail } from '../../services/email.service';
import { ApiError } from '../../utils/ApiError';
import { avatarUploadDir } from '../../middlewares/upload';
import { Role } from '../role/role.model';
import { User, type User as UserDoc } from './auth.model';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

type UserWithSecrets = HydratedDocument<UserDoc> & {
  password: string;
  refreshToken: string | null;
  comparePassword: (candidate: string) => Promise<boolean>;
};

type AuthUserJson = ReturnType<typeof User.prototype.toJSON> & { permissions: string[] };

async function findUserWithSecrets(
  criteria: Record<string, unknown>,
): Promise<UserWithSecrets | null> {
  return (await User.findOne(criteria).select('+password +refreshToken')) as UserWithSecrets | null;
}

async function attachPermissions(
  user: { role: string; toJSON(): Record<string, unknown> },
): Promise<AuthUserJson> {
  const role = await Role.findOne({ name: user.role }).select('permissions').lean();
  return {
    ...(user.toJSON() as ReturnType<typeof User.prototype.toJSON>),
    permissions: role?.permissions ?? [],
  };
}

function signToken(payload: TokenPayload, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

function verifyToken(token: string, secret: string): TokenPayload {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

export function generateTokenPair(user: {
  _id: string;
  email: string;
  name: string;
  role: string;
}): TokenPair {
  const payload: TokenPayload = {
    sub: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = signToken(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = signToken(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  // e.g. "15m" -> 900
  const expiresIn = parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN);

  return { accessToken, refreshToken, expiresIn };
}

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUserJson; tokens: TokenPair }> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const employeeRole = await Role.findOne({ name: 'Employee' }).select('permissions').lean();
  if (!employeeRole) {
    throw ApiError.internal('Default "Employee" role is not configured');
  }

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: 'Employee',
    employeeId: null,
  });

  const tokens = generateTokenPair({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as string,
  });

  user.refreshToken = tokens.refreshToken;
  await user.save({ validateModifiedOnly: true });

  return {
    user: { ...(user.toJSON() as ReturnType<typeof User.prototype.toJSON>), permissions: employeeRole.permissions },
    tokens,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUserJson; tokens: TokenPair }> {
  const user = await findUserWithSecrets({ email: email.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  if (user.isDeleted) {
    throw ApiError.forbidden('This account has been removed. Contact your administrator.');
  }

  const tokens = generateTokenPair({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as string,
  });

  user.refreshToken = tokens.refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });

  return { user: await attachPermissions(user), tokens };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ user: AuthUserJson; tokens: TokenPair }> {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET);

  const user = await findUserWithSecrets({ _id: payload.sub });
  if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized('Refresh token is invalid or has been revoked');
  }

  const tokens = generateTokenPair({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as string,
  });

  user.refreshToken = tokens.refreshToken;
  await user.save({ validateModifiedOnly: true });

  return { user: await attachPermissions(user), tokens };
}

export async function logoutUser(userId: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $unset: { refreshToken: 1 } });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await findUserWithSecrets({ _id: userId });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  // Revoke other sessions by not rotating a new refresh token.
  // The client must re-login after a password change.
}

export async function getUserProfile(userId: string): Promise<AuthUserJson | null> {
  const user = await User.findById(userId);
  if (!user) return null;
  return attachPermissions(user);
}

export async function updateMyProfile(
  userId: string,
  data: { name?: string; email?: string; phone?: string | null },
): Promise<AuthUserJson> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (data.email !== undefined) {
    const normalized = data.email.toLowerCase().trim();
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized, _id: { $ne: userId } });
      if (existing) {
        throw ApiError.conflict('An account with this email already exists');
      }
    }
    user.email = normalized;
  }
  if (data.name !== undefined) {
    user.name = data.name.trim();
  }
  if (data.phone !== undefined) {
    user.phone = data.phone;
  }

  await user.save({ validateModifiedOnly: true });
  return attachPermissions(user);
}

export async function updateMyAvatar(
  userId: string,
  avatarPath: string,
): Promise<AuthUserJson> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const previous = user.avatar;
  user.avatar = avatarPath;
  await user.save({ validateModifiedOnly: true });

  if (previous) {
    const filename = path.basename(previous);
    const dir = avatarUploadDir();
    const absolute = path.join(dir, filename);
    if (absolute.startsWith(dir)) {
      fs.rm(absolute, { force: true }, () => {
        /* best-effort cleanup */
      });
    }
  }

  return attachPermissions(user);
}

const RESET_TOKEN_TTL_MINUTES = 30;

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a password reset token for the account matching `email` and delivers
 * the reset link by email when SMTP is configured. When email delivery is not
 * configured, the raw token is returned so the client can proceed (dev mode).
 */
export async function requestPasswordReset(email: string): Promise<{ resetToken: string | null }> {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
  if (!user) {
    return { resetToken: null };
  }

  const resetToken = randomBytes(32).toString('hex');
  user.passwordResetToken = hashResetToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  const resetLink = `${env.FRONTEND_URL}/reset-password/${resetToken}`;
  if (isEmailEnabled()) {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetLink });
    return { resetToken: null };
  }

  logger.info(`🔗 [DEV] Password reset link: ${resetLink}`);
  return { resetToken };
}

export async function resetUserPassword(resetToken: string, newPassword: string): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: hashResetToken(resetToken),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) {
    throw ApiError.badRequest(
      'Reset token is invalid or has expired. Please request a new one.',
    );
  }

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
  await user.save();
}

export async function listUsers(): Promise<AuthUserJson[]> {
  const users = await User.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 }).lean();
  const roleNames = [...new Set(users.map((u) => u.role))];
  const roles = await Role.find({ name: { $in: roleNames } }).select('name permissions').lean();
  const permissionsByRole = new Map(roles.map((r) => [r.name, r.permissions]));
  return users.map((user) => ({ ...user, id: user._id.toString(), permissions: permissionsByRole.get(user.role) ?? [] }) as AuthUserJson);
}

export async function softDeleteUser(userId: string, actorId: string): Promise<void> {
  if (userId === actorId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  user.isDeleted = true;
  user.isActive = false;
  user.refreshToken = null;
  await user.save({ validateModifiedOnly: true });
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; phone?: string | null; role?: string; isActive?: boolean },
): Promise<AuthUserJson> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (user.isDeleted) {
    throw ApiError.notFound('User not found');
  }

  if (data.name !== undefined) {
    user.name = data.name.trim();
  }
  if (data.phone !== undefined) {
    user.phone = data.phone ? data.phone.trim() : null;
  }
  if (data.email !== undefined) {
    const normalized = data.email.trim().toLowerCase();
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized, isDeleted: { $ne: true } });
      if (existing && existing._id.toString() !== userId) {
        throw ApiError.conflict('Email is already in use by another account');
      }
      user.email = normalized;
    }
  }
  if (data.role !== undefined) {
    const role = await Role.findOne({ name: data.role });
    if (!role) {
      throw ApiError.badRequest(`Role '${data.role}' does not exist`);
    }
    user.role = data.role;
  }
  if (data.isActive !== undefined) {
    if (userId === user._id.toString()) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }
    user.isActive = data.isActive;
  }

  await user.save({ validateModifiedOnly: true });
  return attachPermissions(user);
}
