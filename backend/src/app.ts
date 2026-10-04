import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRateLimiter } from './middlewares/rate-limiter';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found';
import { httpLogger } from './middlewares/http-logger';
import { UPLOAD_ROOT } from './middlewares/upload';
import apiRoutes from './routes';

export function createApp(): Express {
  const app = express();

  // ---------- Global middlewares ----------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(httpLogger());
  app.use('/api/v1', apiRateLimiter);
  app.use('/uploads', express.static(UPLOAD_ROOT));

  // ---------- Routes ----------
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Taskmandu Workforce Management API',
      version: '1.0.0',
      docs: '/api/v1/health',
    });
  });
  app.use('/api/v1', apiRoutes);

  // ---------- 404 & error handling ----------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
