import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

const handler = () => {
  throw ApiError.tooManyRequests();
};

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  handler,
});
