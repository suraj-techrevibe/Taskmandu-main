import { z } from 'zod';

const roleNameSchema = z
  .string()
  .trim()
  .min(2, 'Role name must be at least 2 characters')
  .max(60, 'Role name must be at most 60 characters');

export const createRoleSchema = {
  body: z.object({
    name: roleNameSchema,
    description: z.string().trim().max(200).optional().default(''),
    permissions: z.array(z.string()).default([]),
  }),
};

export const updateRoleSchema = {
  body: z.object({
    name: roleNameSchema.optional(),
    description: z.string().trim().max(200).optional(),
    permissions: z.array(z.string()).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
};

export const idParamSchema = {
  params: z.object({ id: z.string().min(1) }),
};
