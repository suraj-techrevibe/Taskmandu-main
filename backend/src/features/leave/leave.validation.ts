import { z } from 'zod';
import { LEAVE_STATUSES, LEAVE_TYPES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid leave id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const leaveBaseSchema = z.object({
  employeeId: z.string().trim().optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  leaveType: z.enum(LEAVE_TYPES, { errorMap: () => ({ message: 'Invalid leave type' }) }),
  reason: z.string().trim().max(2000).optional().default(''),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(LEAVE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  employeeId: z.string().trim().optional(),
  leaveType: z.enum(LEAVE_TYPES, { errorMap: () => ({ message: 'Invalid leave type' }) }).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const createLeaveSchema = {
  body: leaveBaseSchema.refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: 'End date must be on or after start date', path: ['endDate'] },
  ),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getLeavesSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getLeaveSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const getMyLeavesSchema = {
  body: z.object({}),
  query: z.object({
    status: z.enum(LEAVE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const updateLeaveSchema = {
  body: leaveBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const actionLeaveSchema = {
  body: z.object({
    status: z.enum(['Approved', 'Rejected'], {
      errorMap: () => ({ message: 'Status must be Approved or Rejected' }),
    }),
    notes: z.string().trim().max(2000).optional().default(''),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteLeaveSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
