import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const baseQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  department: z.string().trim().max(100).optional(),
});

export const getAttendanceReportSchema = {
  body: z.object({}),
  query: baseQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getTaskReportSchema = {
  body: z.object({}),
  query: baseQuerySchema.extend({
    status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
    priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Invalid priority' }) }).optional(),
  }),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getHrReportSchema = {
  body: z.object({}),
  query: baseQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const exportReportSchema = {
  body: z.object({}),
  query: baseQuerySchema.extend({
    format: z.enum(['csv']).optional().default('csv'),
  }),
  params: z.object({
    type: z.enum(['attendance', 'tasks', 'hr'], {
      errorMap: () => ({ message: 'Report type must be attendance, tasks or hr' }),
    }),
  }),
  headers: commonHeadersSchema,
};
