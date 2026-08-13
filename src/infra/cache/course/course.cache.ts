import { CacheService } from '@/common/cache/cache.service';
import { RedisKeys } from '@/infra/redis/redis.keys';

export class CourseCache {
  private static readonly TTL = 24 * 60 * 60;
  private static readonly LIST_TTL = 60 * 60;

  static getByStepId(stepId: string) {
    return CacheService.get<any>(RedisKeys.courseByStep(stepId));
  }

  static getByCategoryId(categoryId: string, query: string) {
    return CacheService.get<any>(RedisKeys.coursesByCategory(categoryId, query));
  }

  static setByStepId(stepId: string, course: any) {
    return CacheService.set(RedisKeys.courseByStep(stepId), course, this.TTL);
  }

  static setByCategoryId(categoryId: string, query: string, data: any) {
    return CacheService.set(RedisKeys.coursesByCategory(categoryId, query), data, this.LIST_TTL);
  }

  static invalidateByCategoryId(categoryId: string) {
    return CacheService.delByPattern(RedisKeys.coursesByCategoryPattern(categoryId));
  }

  static invalidateByStepId(stepId: string) {
    return CacheService.del(RedisKeys.courseByStep(stepId));
  }
}
