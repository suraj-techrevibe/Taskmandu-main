import { z } from 'zod';
import { EMPLOYMENT_TYPES, GENDERS } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid onboarding id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const personalDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  dob: dateSchema,
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Invalid gender' }) }),
  phone: z.string().trim().min(1, 'Phone is required').max(30),
  email: z.string().trim().email('A valid email is required'),
  address: z.string().trim().max(500).optional().default(''),
  emergencyContact: z.string().trim().max(200).optional().default(''),
});

const employmentInfoSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee ID is required').max(50),
  department: z.string().trim().min(1, 'Department is required').max(100),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Invalid employment type' }) }),
  joiningDate: dateSchema,
  reportingManagerId: z.string().trim().max(50).optional().nullable(),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
});

const documentsSchema = z.object({
  citizenshipVerified: z.boolean().optional(),
  passportVerified: z.boolean().optional(),
  contractSigned: z.boolean().optional(),
  bankDetailsSubmitted: z.boolean().optional(),
});

const assetsAllocatedSchema = z.object({
  laptop: z.boolean().optional(),
  idCard: z.boolean().optional(),
  simCard: z.boolean().optional(),
  accessCard: z.boolean().optional(),
});

const checklistSchema = z.object({
  emailCreated: z.boolean().optional(),
  payrollAdded: z.boolean().optional(),
  systemAccessGranted: z.boolean().optional(),
  trainingCompleted: z.boolean().optional(),
});

const onboardingBaseSchema = z.object({
  personalDetails: personalDetailsSchema,
  employmentInfo: employmentInfoSchema,
  documents: documentsSchema.optional(),
  assetsAllocated: assetsAllocatedSchema.optional(),
  checklist: checklistSchema.optional(),
  currentStep: z.coerce.number().int().min(0).max(4).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isCompleted: z.enum(['true', 'false']).optional(),
  department: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const createOnboardingSchema = {
  body: onboardingBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getOnboardingsSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getOnboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateOnboardingSchema = {
  body: onboardingBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteOnboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const activateOnboardingSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const advanceStepSchema = {
  body: z.object({
    step: z.coerce.number().int().min(0).max(4, 'Step must be between 0 and 4'),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

const decisionTokenParamSchema = z.object({
  token: z.string().trim().min(1),
});

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const getOnboardingDecisionSchema = {
  body: z.object({}),
  query: z.object({}),
  params: decisionTokenParamSchema,
};

export const acceptOnboardingDecisionSchema = {
  body: z.object({
    password: passwordSchema,
  }),
  query: z.object({}),
  params: decisionTokenParamSchema,
};
