import { CacheService } from '@/common/cache/cache.service';
import { CourseKeys } from './course.keys';

export class CourseCache {
  private static readonly TTL = 24 * 60 * 60;
  private static readonly LIST_TTL = 60 * 60;

  static getByStepId(stepId: string) {
    return CacheService.get<any>(CourseKeys.byStep(stepId));
  }

  static getByCategoryId(categoryId: string, query: string) {
    return CacheService.get<any>(CourseKeys.byCategory(categoryId, query));
  }

  static setByStepId(stepId: string, course: any) {
    return CacheService.set(CourseKeys.byStep(stepId), course, this.TTL);
  }

  static setByCategoryId(categoryId: string, query: string, data: any) {
    return CacheService.set(CourseKeys.byCategory(categoryId, query), data, this.LIST_TTL);
  }

  static invalidateByCategoryId(categoryId: string) {
    return CacheService.delByPattern(CourseKeys.patterns.byCategory(categoryId));
  }

  static invalidateByStepId(stepId: string) {
    return CacheService.del(CourseKeys.byStep(stepId));
  }
}
