import { z } from 'zod';
import { NOTE_CATEGORIES } from '../../types';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note id format'),
});

const noteBaseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  content: z.string().trim().max(10000).optional().default(''),
  category: z
    .enum(NOTE_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) })
    .optional()
    .default('Personal Reminders'),
  color: z.string().trim().max(200).optional().default(''),
  isPinned: z.boolean().optional().default(false),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.enum(NOTE_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }).optional(),
  pinned: z.enum(['true', 'false']).optional(),
});

export const createNoteSchema = {
  body: noteBaseSchema,
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getNotesSchema = {
  body: z.object({}),
  query: listQuerySchema,
  params: z.object({}),
  headers: commonHeadersSchema,
};

export const getNoteSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const updateNoteSchema = {
  body: noteBaseSchema.partial(),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};

export const deleteNoteSchema = {
  body: z.object({}),
  query: z.object({}),
  params: idParamsSchema,
  headers: commonHeadersSchema,
};
