import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './config/logger';
import { attachRealtimeServer } from './services/realtime';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const app = createApp();
    const server = http.createServer(app);
    attachRealtimeServer(server);

    server.listen(env.PORT, () => {
      const address = server.address() as AddressInfo;
      logger.info(`🚀 Taskmandu API running at http://localhost:${address.port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
      // Force exit if graceful shutdown takes too long
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();
