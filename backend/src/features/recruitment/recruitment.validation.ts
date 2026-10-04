import { z } from 'zod';
import {
  APPLICATION_STAGES,
  EMPLOYMENT_TYPES,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  JOB_STATUSES,
} from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// ---------- Job ----------

const jobBaseSchema = z.object({
  title: z.string().trim().min(1, 'Job title is required').max(100),
  department: z.string().trim().max(100).optional().default(''),
  location: z.string().trim().max(100).optional().default(''),
  employmentType: z
    .enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Invalid employment type' }) })
    .optional()
    .default('Full-Time'),
  openings: z.coerce.number().int().min(1, 'Openings must be at least 1').max(100),
  salaryMin: z.coerce.number().min(0).optional().nullable(),
  salaryMax: z.coerce.number().min(0).optional().nullable(),
  description: z.string().trim().max(5000).optional().default(''),
  requirements: z.string().trim().max(5000).optional().default(''),
  status: z
    .enum(JOB_STATUSES, { errorMap: () => ({ message: 'Invalid job status' }) })
    .optional()
    .default('Open'),
});

const jobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(JOB_STATUSES, { errorMap: () => ({ message: 'Invalid job status' }) }).optional(),
  department: z.string().trim().max(100).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Invalid employment type' }) }).optional(),
});

// ---------- Job Application ----------

const applicationBaseSchema = z.object({
  jobId: objectIdSchema.optional().nullable(),
  candidateName: z.string().trim().min(1, 'Candidate name is required').max(100),
  email: z.string().trim().email('A valid email is required'),
  phone: z.string().trim().max(30).optional().default(''),
  roleApplied: z.string().trim().min(1, 'Role applied is required').max(100),
  stage: z
    .enum(APPLICATION_STAGES, { errorMap: () => ({ message: 'Invalid stage' }) })
    .optional()
    .default('Applied'),
  experienceYears: z.coerce.number().min(0, 'Experience cannot be negative').max(60),
  resumeUrl: z.string().trim().max(1000).optional().nullable(),
  appliedDate: dateSchema,
  rating: z.coerce.number().min(1).max(5).optional().default(3),
  source: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(5000).optional().default(''),
});

const applicationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  stage: z.enum(APPLICATION_STAGES, { errorMap: () => ({ message: 'Invalid stage' }) }).optional(),
  roleApplied: z.string().trim().max(100).optional(),
  source: z.string().trim().max(100).optional(),
  jobId: objectIdSchema.optional(),
});

// ---------- Upcoming Interview ----------

const interviewBaseSchema = z.object({
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application id format'),
  jobId: objectIdSchema.optional().nullable(),
  candidateName: z.string().trim().min(1, 'Candidate name is required').max(100),
  roleApplied: z.string().trim().min(1, 'Role applied is required').max(100),
  interviewDate: dateSchema,
  interviewTime: timeSchema,
  interviewType: z.enum(INTERVIEW_TYPES, { errorMap: () => ({ message: 'Invalid interview type' }) }),
  interviewers: z.array(z.string().trim().min(1).max(100)).max(20).optional().default([]),
  meetingLink: z.string().trim().max(1000).optional().nullable(),
  status: z
    .enum(INTERVIEW_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) })
    .optional()
    .default('Scheduled'),
  notes: z.string().trim().max(5000).optional().default(''),
});

const interviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(INTERVIEW_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application id').optional(),
  jobId: objectIdSchema.optional(),
});

export const createApplicationSchema = {
  body: applicationBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getApplicationsSchema = {
  body: z.object({}),
  query: applicationListQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getApplicationSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateApplicationSchema = {
  body: applicationBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateApplicationStageSchema = {
  body: z.object({
    stage: z.enum(APPLICATION_STAGES, { errorMap: () => ({ message: 'Invalid stage' }) }),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteApplicationSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const createInterviewSchema = {
  body: interviewBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getInterviewsSchema = {
  body: z.object({}),
  query: interviewListQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getInterviewSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateInterviewSchema = {
  body: interviewBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteInterviewSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

// ---------- Job ----------

export const createJobSchema = {
  body: jobBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getJobsSchema = {
  body: z.object({}),
  query: jobListQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getJobSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateJobSchema = {
  body: jobBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteJobSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
