import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attendance id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const checkInSchema = {
  body: z.object({
    locationType: z.enum(['Onsite', 'WFH']).default('Onsite'),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const checkOutSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getAttendancesSchema = {
  body: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    employeeId: z.string().trim().optional(),
    date: dateSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    status: z.enum(ATTENDANCE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  }),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getAttendanceSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const getMyAttendanceSchema = {
  body: z.object({}),
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  }),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const updateAttendanceSchema = {
  body: z
    .object({
      checkInTime: z.string().datetime().optional(),
      checkOutTime: z.string().datetime().nullable().optional(),
      status: z.enum(ATTENDANCE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
      workingHours: z.number().min(0).max(24).optional(),
      locationType: z.enum(['Onsite', 'WFH']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteAttendanceSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const getMyStatsSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getMyHistorySchema = {
  body: z.object({}),
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    status: z.enum(ATTENDANCE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
    locationType: z.enum(['Onsite', 'WFH']).optional(),
  }),
  params: z.object({}),
  headers: commonHeadersSchema,
};
