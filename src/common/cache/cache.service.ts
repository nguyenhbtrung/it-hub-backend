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

  static async delByPattern(pattern: string) {
    try {
      let cursor = '0';

      do {
        const reply = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = reply.cursor;
        const keys = reply.keys;

        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      /* empty */
    }
  }
}
