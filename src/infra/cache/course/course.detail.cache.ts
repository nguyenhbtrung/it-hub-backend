import { CacheService } from '@/common/cache/cache.service';

import { CourseKeys } from './course.keys';

export class CourseDetailCache {
  private static readonly TTL = 24 * 60 * 60;

  static get(courseId: string, userId: string, role?: string, view: 'instructor' | 'student' = 'student') {
    return CacheService.get<any>(CourseKeys.detail(courseId, view, userId, role));
  }

  static set(courseId: string, userId: string, role: string | undefined, view: 'instructor' | 'student', data: any) {
    return CacheService.set(CourseKeys.detail(courseId, view, userId, role), data, this.TTL);
  }

  static invalidateAll() {
    return CacheService.delByPattern(CourseKeys.patterns.detail());
  }

  static invalidateByCourseId(courseId: string) {
    return CacheService.delByPattern(CourseKeys.patterns.detailByCourse(courseId));
  }
}
