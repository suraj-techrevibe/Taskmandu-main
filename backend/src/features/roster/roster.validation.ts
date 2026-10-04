import { z } from 'zod';
import { SHIFT_TYPES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid roster id format'),
});

const rosterBaseSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1, 'At least one employee must be assigned'),
  department: z.string().trim().min(1, 'Department is required').max(100),
  shiftType: z.enum(SHIFT_TYPES, { errorMap: () => ({ message: 'Invalid shift type' }) }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format'),
  location: z.string().trim().max(200).optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  recurring: z.boolean().optional().default(false),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From must be in YYYY-MM-DD format').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To must be in YYYY-MM-DD format').optional(),
  department: z.string().trim().max(100).optional(),
  shiftType: z.enum(SHIFT_TYPES, { errorMap: () => ({ message: 'Invalid shift type' }) }).optional(),
  employeeId: z.string().trim().optional(),
});

export const createRosterSchema = {
  body: rosterBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getRostersSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getRosterSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateRosterSchema = {
  body: rosterBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteRosterSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const copyRostersSchema = {
  body: z.object({
    sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Source date must be in YYYY-MM-DD format'),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format'),
    department: z.string().trim().max(100).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};
