import { z } from 'zod';

const nameSchema = z
  .string({ required_error: 'Department name is required' })
  .trim()
  .min(2, 'Department name must be at least 2 characters')
  .max(100, 'Department name cannot exceed 100 characters');

const idSchema = z.string().min(1, 'Department id is required');

export const getDepartmentsSchema = {
  body: z.object({}),
  query: z.object({
    search: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  }),
  params: z.object({}),
  headers: z.object({}),
};

export const createDepartmentSchema = {
  body: z.object({
    name: nameSchema,
    description: z.string().trim().max(300).optional().default(''),
    headEmployeeId: z.string().nullable().optional().default(null),
    isActive: z.boolean().optional().default(true),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: z.object({}),
};

export const updateDepartmentSchema = {
  body: z.object({
    name: nameSchema.optional(),
    description: z.string().trim().max(300).optional(),
    headEmployeeId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  query: z.object({}),
  params: z.object({ id: idSchema }),
  headers: z.object({}),
};

export const deleteDepartmentSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({ id: idSchema }),
  headers: z.object({}),
};
