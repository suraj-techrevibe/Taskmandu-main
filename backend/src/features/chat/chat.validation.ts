import { z } from 'zod';
import { CHAT_GROUP_CATEGORIES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group id format'),
});

const messageIdParamsSchema = z.object({
  messageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message id format'),
});

const groupBaseSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100),
  description: z.string().trim().max(1000).optional().default(''),
  category: z
    .enum(CHAT_GROUP_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) })
    .optional()
    .default('General'),
  memberIds: z.array(z.string().trim().min(1)).max(500).optional().default([]),
  isLocked: z.boolean().optional().default(false),
});

const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  category: z.enum(CHAT_GROUP_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }).optional(),
});

const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
});

const messageBodySchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(5000),
  isNotice: z.boolean().optional().default(false),
});

export const createGroupSchema = {
  body: groupBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getGroupsSchema = {
  body: z.object({}),
  query: listGroupsQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getGroupSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateGroupSchema = {
  body: groupBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteGroupSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const getMessagesSchema = {
  body: z.object({}),
  query: listMessagesQuerySchema,
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const sendMessageSchema = {
  body: messageBodySchema,
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const editMessageSchema = {
  body: z.object({
    text: z.string().trim().min(1, 'Message cannot be empty').max(5000),
  }),
  query: z.object({}),
  params: messageIdParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteMessageSchema = {
  body: z.object({}),
  query: z.object({}),
  params: messageIdParamsSchema,
  headers: commonHeadersSchema,
};

export const joinGroupSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const leaveGroupSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
