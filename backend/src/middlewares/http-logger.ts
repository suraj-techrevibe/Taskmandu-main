import type { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';
import { env } from '../config/env';

const RESET = '\x1b[0m';
const C = {
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  boldRed: '\x1b[1m\x1b[31m',
};

function colorize(value: string, code: string): string {
  return env.isProduction ? value : `${code}${value}${RESET}`;
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET':
      return C.green;
    case 'POST':
      return C.cyan;
    case 'PUT':
    case 'PATCH':
      return C.yellow;
    case 'DELETE':
      return C.red;
    default:
      return C.magenta;
  }
}

function statusColor(statusCode: number): string {
  if (statusCode >= 500) return C.boldRed;
  if (statusCode >= 400) return C.red;
  if (statusCode >= 300) return C.yellow;
  return C.green;
}

function statusToLevel(statusCode: number): 'error' | 'warn' | 'info' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

export function httpLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      if (req.originalUrl === '/api/v1/health') return;
      const durationMs = Date.now() - start;
      const level = statusToLevel(res.statusCode);
      const ip = req.ip ?? '-';
      const method = colorize(req.method, methodColor(req.method));
      const status = colorize(String(res.statusCode), statusColor(res.statusCode));
      logger[level](
        `${method} ${req.originalUrl} ${status} ${durationMs}ms - ${ip}`,
      );
    });

    next();
  };
}
