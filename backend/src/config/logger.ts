import pino from 'pino';
import { env } from './env';

const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
});

export default logger;
