import { GetCoursesQueryDTO } from '@/dtos/coures.dto';
import { CacheService } from '@/common/cache/cache.service';

import { CourseKeys } from './course.keys';

export class CourseCatalogCache {
  private static readonly TTL = 60 * 60;

  private static buildQuery(query: GetCoursesQueryDTO) {
    const {
      view = 'student',
      page = 1,
      limit = 5,
      q = '',
      level,
      duration,
      avgRating = 0,
      sortBy,
      sortOrder = 'asc',
      status,
    } = query;

    const normalizedLevel = Array.isArray(level) ? level.join(',') : level || '';
    const normalizedDuration = Array.isArray(duration) ? duration.join(',') : duration || '';

    return `${view}:${Number(page)}:${Number(limit)}:${q}:${normalizedLevel}:${normalizedDuration}:${Number(
      avgRating
    )}:${sortBy || ''}:${sortOrder}:${status || ''}`;
  }

  static get(query: GetCoursesQueryDTO) {
    return CacheService.get<any>(CourseKeys.catalog(this.buildQuery(query)));
  }

  static set(query: GetCoursesQueryDTO, data: any) {
    return CacheService.set(CourseKeys.catalog(this.buildQuery(query)), data, this.TTL);
  }

  static invalidateAll() {
    return CacheService.delByPattern(CourseKeys.patterns.catalog());
  }
}
