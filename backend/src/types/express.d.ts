import type { Role } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
        employeeId?: string | null;
        permissions: string[];
      };
    }
  }
}

export {};
