import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const userPermissions = user.permissions ?? [];
    const hasAccess = permissions.some((permission) => userPermissions.includes(permission));

    if (!hasAccess) {
      next(ApiError.forbidden(`You do not have permission to access this resource (requires: ${permissions.join(', ')})`));
      return;
    }

    next();
  };
}
