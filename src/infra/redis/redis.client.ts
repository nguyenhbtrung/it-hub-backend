import { createClient } from 'redis';

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || 'default',
  database: Number(process.env.REDIS_DB || 0),
});

redisClient.on('connect', () => {
  console.log('[Redis] connected');
});

redisClient.on('error', (err) => {
  console.error('[Redis] error', err);
  // console.log('pass', process.env.REDIS_PASSWORD);
});
