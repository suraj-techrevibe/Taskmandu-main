import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
