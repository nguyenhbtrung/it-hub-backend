import { CacheService } from '@/common/cache/cache.service';
import { User } from '@/generated/prisma/client';
import { RedisKeys } from '@/infra/redis/redis.keys';

export class UserCache {
  static get(id: string) {
    return CacheService.get<User>(RedisKeys.user(id));
  }

  static set(user: User) {
    return CacheService.set(RedisKeys.user(user.id), user, 300);
  }

  static invalidate(id: string) {
    return CacheService.del(RedisKeys.user(id));
  }
}
