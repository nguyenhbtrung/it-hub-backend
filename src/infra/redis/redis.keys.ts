export const RedisKeys = {
  user: (id: string) => `user:${id}`,

  course: (id: string) => `course:${id}`,
  courseByStep: (stepId: string) => `course:by-step:${stepId}`,
  courseDetail: (id: string, view = 'student', userId = '', role = '') =>
    `course:detail:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,
  courseContent: (id: string, view = 'student', userId = '', role = '') =>
    `course:content:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,
  featuredCourses: (page: number, limit: number) => `courses:featured:${page}:${limit}`,
  courseCatalog: (query: string) => `courses:catalog:${query}`,
  coursesByCategory: (categoryId: string, query: string) => `courses:by-category:${categoryId}:${query}`,
  coursesByCategoryPattern: (categoryId: string) => `courses:by-category:${categoryId}:*`,
  learningCourses: (userId: string, status: string, page: number, limit: number) =>
    `learning-courses:${userId}:${status}:${page}:${limit}`,

  section: (id: string) => `section:${id}`,

  step: (id: string) => `step:${id}`,

  refreshToken: (jti: string) => `auth:refresh:${jti}`,
  rateLimit: (key: string) => `rate:${key}`,
};
