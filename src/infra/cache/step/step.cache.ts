import { CacheService } from '@/common/cache/cache.service';
import { RedisKeys } from '@/infra/redis/redis.keys';

export class StepCache {
  private static readonly TTL = 24 * 60 * 60;

  static get(id: string) {
    return CacheService.get<any>(RedisKeys.step(id));
  }

  static set(step: any) {
    return CacheService.set(RedisKeys.step(step.id), step, this.TTL);
  }

  static invalidate(id: string) {
    return CacheService.del(RedisKeys.step(id));
  }
}
