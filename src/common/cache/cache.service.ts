import { redisClient } from '@/infra/redis/redis.client';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttlSeconds: number) {
    if (ttlSeconds <= 0) return;
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch {
      /* empty */
    }
  }

  static async del(key: string) {
    try {
      await redisClient.del(key);
    } catch {
      /* empty */
    }
  }
}
