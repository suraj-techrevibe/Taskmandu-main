import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification id format'),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  type: z.enum(NOTIFICATION_TYPES, { errorMap: () => ({ message: 'Invalid type' }) }).optional(),
  read: z.enum(['true', 'false']).optional(),
});

export const createNotificationSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    message: z.string().trim().min(1, 'Message is required').max(2000),
    type: z.enum(NOTIFICATION_TYPES, { errorMap: () => ({ message: 'Invalid type' }) }),
    recipientId: z.string().trim().optional().nullable(),
  }),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getNotificationsSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getNotificationSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const markReadSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const markAllReadSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const deleteNotificationSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const clearAllSchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};
