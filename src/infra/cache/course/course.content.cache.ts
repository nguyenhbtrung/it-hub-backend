import { CacheService } from '@/common/cache/cache.service';

import { CourseKeys } from './course.keys';

export class CourseContentCache {
  private static readonly TTL = 10 * 60;

  static get(courseId: string, userId: string, role?: string, view: 'instructor' | 'student' = 'student') {
    return CacheService.get<any>(CourseKeys.content(courseId, view, userId, role));
  }

  static set(courseId: string, userId: string, role: string | undefined, view: 'instructor' | 'student', data: any) {
    return CacheService.set(CourseKeys.content(courseId, view, userId, role), data, this.TTL);
  }

  static invalidateAll() {
    return CacheService.delByPattern(CourseKeys.patterns.content());
  }

  static invalidateByCourseId(courseId: string) {
    return CacheService.delByPattern(CourseKeys.patterns.contentByCourse(courseId));
  }
}
