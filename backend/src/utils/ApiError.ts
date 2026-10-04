import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(StatusCodes.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message);
  }

  static validation(message = 'Validation failed', details?: unknown): ApiError {
    return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message, details);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, false);
  }
}
