import { z } from 'zod';

const commonHeadersSchema = z.object({
  authorization: z.string({ required_error: 'Authorization header is required' }),
  'user-agent': z.string().optional(),
});

export const getDashboardSummarySchema = {
  body: z.object({}),
  query: z.object({}),
  params: z.object({}),
  headers: commonHeadersSchema,
};
