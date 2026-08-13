import { CacheService } from '@/common/cache/cache.service';
import { RedisKeys } from '@/infra/redis/redis.keys';

export class CourseCache {
  private static readonly TTL = 24 * 60 * 60;

  static getByStepId(stepId: string) {
    return CacheService.get<any>(RedisKeys.courseByStep(stepId));
  }

  static setByStepId(stepId: string, course: any) {
    return CacheService.set(RedisKeys.courseByStep(stepId), course, this.TTL);
  }

  static invalidateByStepId(stepId: string) {
    return CacheService.del(RedisKeys.courseByStep(stepId));
  }
}
