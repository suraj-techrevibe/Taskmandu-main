import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task id format'),
});

const attachmentSchema = z.object({
  name: z.string().trim().min(1, 'Attachment name is required').max(200),
  size: z.string().trim().max(50).optional().default(''),
  url: z.string().trim().max(1000).optional().default(''),
});

const taskBaseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  assignedToId: z.array(z.string().trim()).min(1, 'At least one assignee is required'),
  priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Invalid priority' }) }).optional().default('Medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  estimatedHours: z.coerce.number().min(0).max(1000).optional().default(0),
  status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional().default('Assigned'),
  attachments: z.array(attachmentSchema).max(50).optional().default([]),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  assignedToId: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Invalid priority' }) }).optional(),
  tag: z.string().trim().max(50).optional(),
  dueBefore: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due before must be in YYYY-MM-DD format').optional(),
  dueAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due after must be in YYYY-MM-DD format').optional(),
});

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

export const createTaskSchema = {
  body: taskBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getTasksSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getTaskSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateTaskSchema = {
  body: taskBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateTaskStatusSchema = {
  body: z.object({
    status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  }),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const addCommentSchema = {
  body: commentSchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteTaskSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
