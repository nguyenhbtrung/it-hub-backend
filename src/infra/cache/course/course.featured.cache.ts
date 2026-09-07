import { CacheService } from '@/common/cache/cache.service';

import { CourseKeys } from './course.keys';

export class CourseFeaturedCache {
  private static readonly TTL = 60 * 60;

  static get(page: number, limit: number) {
    return CacheService.get<any>(CourseKeys.featured(page, limit));
  }

  static set(page: number, limit: number, data: any) {
    return CacheService.set(CourseKeys.featured(page, limit), data, this.TTL);
  }

  static invalidateAll() {
    return CacheService.delByPattern(CourseKeys.patterns.featured());
  }
}
