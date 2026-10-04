import crypto from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import logger from '../../config/logger';
import { sendInvitationEmail } from '../../services/email.service';
import { User } from '../auth/auth.model';
import { Role } from '../role/role.model';
import { Employee } from '../employee/employee.model';
import { Invitation, type InvitationStatus } from './invitation.model';

const INVITATION_EXPIRES_MS = env.INVITATION_EXPIRES_HOURS * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildInviteLink(token: string): string {
  return `${env.FRONTEND_URL}/invite/${token}`;
}

export async function createInvitation(data: {
  employeeId: string;
  role: string;
  invitedBy: string;
  invitedByName: string;
}): Promise<{ invitation: ReturnType<typeof Invitation.prototype.toJSON>; inviteLink: string; emailDelivered: boolean }> {
  const employee = await Employee.findById(data.employeeId);
  if (!employee) {
    throw ApiError.badRequest('Invitations can only be sent to existing employees');
  }

  const name = `${employee.firstName} ${employee.lastName}`;
  const email = employee.email.toLowerCase();

  const [existingUser, existingRole, pendingInvite] = await Promise.all([
    User.findOne({ email }),
    Role.findOne({ name: data.role }),
    Invitation.findOne({ email, status: 'Pending' }),
  ]);

  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }
  if (!existingRole) {
    throw ApiError.badRequest(`Role '${data.role}' does not exist`);
  }
  if (pendingInvite) {
    throw ApiError.conflict('A pending invitation already exists for this email');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const invitation = await Invitation.create({
    name,
    email,
    role: data.role,
    employeeId: employee._id.toString(),
    tokenHash: hashToken(token),
    status: 'Pending',
    expiresAt: new Date(Date.now() + INVITATION_EXPIRES_MS),
    invitedBy: data.invitedBy,
    invitedByName: data.invitedByName,
  });

  const inviteLink = buildInviteLink(token);
  await sendInvitationEmail({
    to: email,
    name,
    roleName: data.role,
    inviteLink,
    invitedByName: data.invitedByName,
  });

  logger.info(`📨 Invitation created for ${email} (${data.role}) by ${data.invitedByName}`);

  return {
    invitation: invitation.toJSON() as ReturnType<typeof Invitation.prototype.toJSON>,
    inviteLink: env.isProduction ? '' : inviteLink,
    emailDelivered: Boolean(env.SMTP_HOST),
  };
}

export async function listInvitations(): Promise<ReturnType<typeof Invitation.prototype.toJSON>[]> {
  const invitations = await Invitation.find().sort({ createdAt: -1 }).lean();
  return invitations.map((invitation) => {
    const status = resolveStatus(invitation.status, invitation.expiresAt);
    return { ...invitation, status } as ReturnType<typeof Invitation.prototype.toJSON>;
  });
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }
  if (invitation.status !== 'Pending') {
    throw ApiError.badRequest(`Only pending invitations can be cancelled (current status: ${invitation.status})`);
  }
  invitation.status = 'Cancelled';
  await invitation.save();
}

function resolveStatus(status: InvitationStatus, expiresAt: Date): InvitationStatus {
  if (status === 'Pending' && expiresAt.getTime() < Date.now()) {
    return 'Expired';
  }
  return status;
}

export async function getInvitationByToken(
  token: string,
): Promise<{ id: string; name: string; email: string; role: string; status: InvitationStatus; expiresAt: Date; invitedByName: string }> {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw ApiError.notFound('Invitation not found or already used');
  }

  const status = resolveStatus(invitation.status, invitation.expiresAt);
  if (status === 'Expired' && invitation.status !== 'Expired') {
    invitation.status = 'Expired';
    await invitation.save();
  }

  return {
    id: invitation._id.toString(),
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    status,
    expiresAt: invitation.expiresAt,
    invitedByName: invitation.invitedByName,
  };
}

export async function acceptInvitation(
  token: string,
  password: string,
): Promise<{ email: string; role: string }> {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw ApiError.notFound('Invitation not found or already used');
  }

  const status = resolveStatus(invitation.status, invitation.expiresAt);
  if (status !== 'Pending') {
    throw ApiError.badRequest(`This invitation is no longer pending (status: ${status})`);
  }

  const role = await Role.findOne({ name: invitation.role });
  if (!role) {
    throw ApiError.badRequest(`The role '${invitation.role}' no longer exists. Contact your administrator.`);
  }

  const existingUser = await User.findOne({ email: invitation.email });
  if (existingUser) {
    invitation.status = 'Accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();
    throw ApiError.conflict('An account with this email already exists. Please sign in instead.');
  }

  await User.create({
    name: invitation.name,
    email: invitation.email,
    password,
    role: invitation.role,
    employeeId: invitation.employeeId,
    isActive: true,
  });

  if (invitation.employeeId) {
    await Employee.updateOne(
      { _id: invitation.employeeId },
      { status: 'Active' },
    );
  }

  invitation.status = 'Accepted';
  invitation.acceptedAt = new Date();
  await invitation.save();

  logger.info(`✅ Invitation accepted: ${invitation.email} joined as ${invitation.role}`);

  return { email: invitation.email, role: invitation.role };
}

export async function rejectInvitation(token: string): Promise<void> {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation) {
    throw ApiError.notFound('Invitation not found or already used');
  }
  if (invitation.status !== 'Pending') {
    throw ApiError.badRequest(`This invitation is no longer pending (status: ${invitation.status})`);
  }
  invitation.status = 'Rejected';
  invitation.rejectedAt = new Date();
  await invitation.save();
  logger.info(`🚫 Invitation rejected: ${invitation.email}`);
}
