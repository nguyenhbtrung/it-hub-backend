import { CacheService } from '@/common/cache/cache.service';

import { CourseKeys } from './course.keys';

export class CourseLearningCache {
  private static readonly TTL = 60 * 60;

  static get(userId: string, status: string, page: number, limit: number) {
    return CacheService.get<any>(CourseKeys.learningCourses(userId, status, page, limit));
  }

  static set(userId: string, status: string, page: number, limit: number, data: any) {
    return CacheService.set(CourseKeys.learningCourses(userId, status, page, limit), data, this.TTL);
  }

  static invalidateAll() {
    return CacheService.delByPattern(CourseKeys.patterns.learningCourses());
  }
}
