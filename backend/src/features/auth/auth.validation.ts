import { z } from 'zod';

const commonHeadersSchema = z.object({
  authorization: z.string().optional(),
  'user-agent': z.string().optional(),
});

const refreshTokenHeadersSchema = commonHeadersSchema.extend({
  cookie: z.string().optional(),
});

export const registerSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('A valid email is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('A valid email is required'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: refreshTokenHeadersSchema,
};

export const logoutSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: z.object({
    cookie: z.string().optional(),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .max(72)
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('A valid email is required'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }).min(1, 'Reset token is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .max(72)
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getUsersSchema = {
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const updateUserSchema = {
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .optional(),
      email: z.string().trim().email('A valid email is required').optional(),
      phone: z
        .string()
        .trim()
        .max(30, 'Phone cannot exceed 30 characters')
        .nullable()
        .optional(),
      role: z.string().trim().min(1).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
      message: 'Provide at least one field to update (name, email, phone, role or isActive)',
    }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
  headers: commonHeadersSchema,
};

export const deleteUserSchema = {
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
  headers: commonHeadersSchema,
};

export const updateProfileSchema = {
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .optional(),
      email: z.string().trim().email('A valid email is required').optional(),
      phone: z
        .string()
        .trim()
        .max(30, 'Phone cannot exceed 30 characters')
        .nullable()
        .optional(),
    })
    .refine((data) => data.name !== undefined || data.email !== undefined || data.phone !== undefined, {
      message: 'Provide at least one field to update (name, email or phone)',
    }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};
