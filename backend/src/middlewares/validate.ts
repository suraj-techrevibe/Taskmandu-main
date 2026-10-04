import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { ApiError } from '../utils/ApiError';

export type RequestPart = 'body' | 'query' | 'params' | 'headers';

export type RequestSchema = Partial<
  Record<RequestPart, ZodSchema<unknown, ZodTypeDef, unknown>>
>;

export function validate(schema: RequestSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: { part: RequestPart; field: string; message: string }[] = [];

    (Object.keys(schema) as RequestPart[]).forEach((part) => {
      const partSchema = schema[part];
      if (!partSchema) return;

      const source = req[part];
      if (source === undefined) return;

      const result = partSchema.safeParse(source);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors.push({
            part,
            field: issue.path.join('.') || part,
            message: issue.message,
          });
        });
        return;
      }

      // Attach the parsed (transformed/typed) value back onto the request
      // so controllers receive sanitized, validated input.
      if (part === 'body') req.body = result.data;
      else if (part === 'query') req.query = result.data as Request['query'];
      else if (part === 'params') req.params = result.data as Request['params'];
      else if (part === 'headers') req.headers = result.data as Request['headers'];
    });

    if (errors.length > 0) {
      next(ApiError.badRequest('Request validation failed', { errors }));
      return;
    }

    next();
  };
}
