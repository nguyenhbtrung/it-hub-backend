import { CourseCatalogCache } from './course.catalog.cache';
import { CourseContentCache } from './course.content.cache';
import { CourseDetailCache } from './course.detail.cache';
import { CourseFeaturedCache } from './course.featured.cache';
import { CourseLearningCache } from './course.learning.cache';
import { CourseRelationCache } from './course.relation.cache';

export class CourseCache {
  static async invalidateAll(courseId?: string) {
    const tasks = [
      CourseCatalogCache.invalidateAll(),
      CourseDetailCache.invalidateAll(),
      CourseContentCache.invalidateAll(),
      CourseFeaturedCache.invalidateAll(),
      CourseLearningCache.invalidateAll(),
      CourseRelationCache.invalidateAllCategories(),
    ];

    if (courseId) {
      tasks.push(CourseDetailCache.invalidateByCourseId(courseId), CourseContentCache.invalidateByCourseId(courseId));
    }

    await Promise.all(tasks);
  }
}
