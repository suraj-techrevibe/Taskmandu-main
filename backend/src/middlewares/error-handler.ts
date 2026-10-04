import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import logger from '../config/logger';
import { ApiError } from '../utils/ApiError';

interface ErrorDetails {
  [key: string]: unknown;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let details: ErrorDetails | undefined;

  if (err instanceof multer.MulterError) {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? StatusCodes.REQUEST_TOO_LONG : StatusCodes.BAD_REQUEST;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 20 MB)' : err.message;
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details as ErrorDetails | undefined;
  } else if (err instanceof ZodError) {
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    details = { errors: err.issues };
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = 'Database validation failed';
    details = { errors: err.errors };
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid ${err.kind} value for '${err.path}'`;
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Malformed JSON payload';
  } else if (err instanceof Error && (err as { code?: unknown }).code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    const mongoErr = err as unknown as { keyValue?: Record<string, unknown> };
    const key = Object.keys(mongoErr.keyValue ?? {})[0];
    message = `Duplicate value for unique field${key ? `: '${key}'` : ''}`;
    details = { keyValue: mongoErr.keyValue };
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    details,
    stack: env.isProduction ? undefined : err instanceof Error ? err.stack : undefined,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
