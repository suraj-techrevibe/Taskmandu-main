import type { NextFunction, Request, Response } from 'express';
import type { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { User } from '../features/auth/auth.model';
import { Role } from '../features/role/role.model';
import type { Role as RoleName } from '../types';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

interface AuthenticatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  employeeId?: string | null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    const token = header.split(' ')[1];
    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    const [user, role] = await Promise.all([
      User.findById(payload.sub).select('_id name email role isActive employeeId').lean() as Promise<AuthenticatedUser | null>,
      Role.findOne({ name: payload.role }).select('permissions').lean(),
    ]);

    if (!user) {
      throw ApiError.unauthorized('Account no longer exists');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId ?? null,
      permissions: role?.permissions ?? [],
    };

    next();
  } catch (error) {
    next(error);
  }
}
