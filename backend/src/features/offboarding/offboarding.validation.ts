import { z } from 'zod';
import { CLEARANCE_STATUSES, REHIRE_ELIGIBILITIES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid offboarding id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const clearanceStatusSchema = z.object({
  hr: z.enum(CLEARANCE_STATUSES).optional(),
  finance: z.enum(CLEARANCE_STATUSES).optional(),
  it: z.enum(CLEARANCE_STATUSES).optional(),
  operations: z.enum(CLEARANCE_STATUSES).optional(),
});

const assetsReturnedSchema = z.object({
  laptop: z.boolean().optional(),
  monitor: z.boolean().optional(),
  accessCard: z.boolean().optional(),
  simCard: z.boolean().optional(),
});

const exitInterviewSchema = z.object({
  companyFeedback: z.string().trim().max(5000).optional(),
  suggestions: z.string().trim().max(5000).optional(),
  rehireEligibility: z.enum(REHIRE_ELIGIBILITIES).optional(),
});

const offboardingBaseSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee id is required'),
  lastWorkingDay: dateSchema,
  reason: z.string().trim().max(2000).optional().default(''),
  noticePeriod: z.coerce.number().int().min(0, 'Notice period cannot be negative').max(365),
  feedback: z.string().trim().max(5000).optional().default(''),
  clearanceStatus: clearanceStatusSchema.optional(),
  assetsReturned: assetsReturnedSchema.optional(),
  exitInterview: exitInterviewSchema.optional(),
  currentStep: z.coerce.number().int().min(0).max(4).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isCompleted: z.enum(['true', 'false']).optional(),
  employeeId: z.string().trim().optional(),
});

export const createOffboardingSchema = {
  body: offboardingBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getOffboardingsSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getOffboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateOffboardingSchema = {
  body: offboardingBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateClearanceSchema = {
  body: z.object({
    department: z.enum(['hr', 'finance', 'it', 'operations'], {
      errorMap: () => ({ message: 'Invalid clearance department' }),
    }),
    status: z.enum(CLEARANCE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteOffboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const archiveOffboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
