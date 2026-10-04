import { z } from 'zod';
import { PROJECT_STATUSES, TASK_PRIORITIES, TASK_STATUSES, VARIABLE_TYPES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project id format'),
});

const subIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project id format'),
  subId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid nested item id format'),
});

const subSubIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project id format'),
  subId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task id format'),
  subSubId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sub-task id format'),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const projectBaseSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  status: z.enum(PROJECT_STATUSES).optional().default('Planning'),
  manager: z.string().trim().max(100).optional().default(''),
  startDate: dateSchema.optional().nullable(),
  endDate: dateSchema.optional().nullable(),
  color: z.string().trim().max(200).optional().default(''),
});

const documentSchema = z.object({
  name: z.string().trim().min(1, 'Document name is required').max(200),
  size: z.string().trim().max(50).optional().default(''),
  uploadedBy: z.string().trim().max(100).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
});

const sharedVariableSchema = z.object({
  key: z.string().trim().min(1, 'Variable key is required').max(200),
  value: z.string().trim().max(5000).optional().default(''),
  isSecret: z.boolean().optional().default(false),
  type: z.enum(VARIABLE_TYPES).optional().default('Environment'),
  description: z.string().trim().max(1000).optional().default(''),
  updatedBy: z.string().trim().max(100).optional().default(''),
});

const projectTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  assignedToId: z.array(z.string().trim()).optional().default([]),
  assignedByName: z.string().trim().max(100).optional().default(''),
  priority: z.enum(TASK_PRIORITIES).optional().default('Medium'),
  dueDate: dateSchema,
  estimatedHours: z.coerce.number().min(0).max(1000).optional().default(0),
  status: z.enum(TASK_STATUSES).optional().default('Assigned'),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
});

const subTaskSchema = z.object({
  title: z.string().trim().min(1, 'Sub-task title is required').max(200),
  assignedToId: z.array(z.string().trim()).optional().default([]),
  assignedByName: z.string().trim().max(100).optional().default(''),
  status: z.enum(TASK_STATUSES).optional().default('Assigned'),
});

const memberSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional().default('member'),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const createProjectSchema = {
  body: projectBaseSchema.extend({
    members: z.array(memberSchema).optional().default([]),
    createdBy: z.string().trim().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getProjectsSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getProjectSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateProjectSchema = {
  body: projectBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteProjectSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const addDocumentSchema = {
  body: documentSchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateDocumentSchema = {
  body: documentSchema.partial(),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteDocumentSchema = {
  body: z.object({}),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addVariableSchema = {
  body: sharedVariableSchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateVariableSchema = {
  body: sharedVariableSchema.partial(),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteVariableSchema = {
  body: z.object({}),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addTaskSchema = {
  body: projectTaskSchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateTaskSchema = {
  body: projectTaskSchema.partial(),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteTaskSchema = {
  body: z.object({}),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addCommentSchema = {
  body: z.object({
    text: z.string().trim().min(1, 'Comment text is required').max(2000),
  }),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addSubTaskSchema = {
  body: subTaskSchema,
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};

export const updateSubTaskSchema = {
  body: subTaskSchema.partial(),
  query: z.object({}),
  params: subSubIdParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteSubTaskSchema = {
  body: z.object({}),
  query: z.object({}),
  params: subSubIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addSubTaskCommentSchema = {
  body: z.object({
    text: z.string().trim().min(1, 'Comment text is required').max(2000),
  }),
  query: z.object({}),
  params: subSubIdParamsSchema,
  headers: commonHeadersSchema,
};

export const addMemberSchema = {
  body: memberSchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const removeMemberSchema = {
  body: z.object({}),
  query: z.object({}),
  params: subIdParamsSchema,
  headers: commonHeadersSchema,
};
