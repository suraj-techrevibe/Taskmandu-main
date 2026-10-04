import { z } from 'zod';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES, GENDERS } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
  'content-type': z.string().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().trim().max(100).optional().default(''),
  relationship: z.string().trim().max(50).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
});

const employeeBaseSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('A valid email is required'),
  phone: z.string().trim().min(1, 'Phone is required').max(30),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Invalid gender' }) }),
  address: z.string().trim().max(500).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  employeeId: z.string().trim().min(1, 'Employee ID is required').max(50),
  department: z.string().trim().min(1, 'Department is required').max(100),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Invalid employment type' }) }),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be in YYYY-MM-DD format'),
  reportingManagerId: z.string().trim().max(50).optional().nullable(),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  status: z
    .enum(EMPLOYEE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) })
    .optional()
    .default('Active'),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee id format'),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  status: z.enum(EMPLOYEE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: 'Invalid employment type' }) }).optional(),
});

export const createEmployeeSchema = {
  body: employeeBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getEmployeesSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getEmployeeSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateEmployeeSchema = {
  body: employeeBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteEmployeeSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateEmployeeStatusSchema = {
  body: z.object({
    status: z.enum(EMPLOYEE_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
