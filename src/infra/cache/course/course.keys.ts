export const CourseKeys = {
  detail: (id: string, view = 'student', userId = '', role = '') =>
    `course:detail:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,

  content: (id: string, view = 'student', userId = '', role = '') =>
    `course:content:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,

  catalog: (query: string) => `courses:catalog:${query}`,
  featured: (page: number, limit: number) => `courses:featured:${page}:${limit}`,

  byCategory: (categoryId: string, query: string) => `courses:by-category:${categoryId}:${query}`,
  learningCourses: (userId: string, status: string, page: number, limit: number) =>
    `learning-courses:${userId}:${status}:${page}:${limit}`,

  patterns: {
    catalog: () => 'courses:catalog:*',
    detail: () => 'course:detail:*',
    content: () => 'course:content:*',
    featured: () => 'courses:featured:*',
    learningCourses: () => 'learning-courses:*',
    byCategory: () => 'courses:by-category:*',
    byCourse: (courseId: string) => `course:detail:${courseId}:*`,
    contentByCourse: (courseId: string) => `course:content:${courseId}:*`,
  },
};
