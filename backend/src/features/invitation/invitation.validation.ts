import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const createInvitationSchema = {
  body: z.object({
    employeeId: z.string().trim().min(1, 'Employee is required'),
    role: z.string().trim().min(1, 'Role is required'),
  }),
};

export const invitationTokenParamSchema = {
  params: z.object({ token: z.string().trim().min(1) }),
};

export const acceptInvitationSchema = {
  params: z.object({ token: z.string().trim().min(1) }),
  body: z.object({
    password: passwordSchema,
  }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
