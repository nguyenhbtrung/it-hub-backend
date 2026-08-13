import { CacheService } from '@/common/cache/cache.service';
import { RedisKeys } from '@/infra/redis/redis.keys';

export class CategoryCache {
  private static readonly TTL = 24 * 60 * 60;

  static getTree() {
    return CacheService.get<any>(RedisKeys.categoryTree());
  }

  static setTree(data: any) {
    return CacheService.set(RedisKeys.categoryTree(), data, this.TTL);
  }

  static invalidateTree() {
    return CacheService.del(RedisKeys.categoryTree());
  }
}
