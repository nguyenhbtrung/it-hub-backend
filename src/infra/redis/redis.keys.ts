export const RedisKeys = {
  user: (id: string) => `user:${id}`,
  course: (id: string) => `course:${id}`,
  courseDetail: (id: string, view = 'student', userId = '', role = '') =>
    `course:detail:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,
  courseContent: (id: string, view = 'student', userId = '', role = '') =>
    `course:content:${id}:${view}:${userId || 'anon'}:${role || 'anon'}`,
  featuredCourses: (page: number, limit: number) => `courses:featured:${page}:${limit}`,
  courseCatalog: (query: string) => `courses:catalog:${query}`,
  learningCourses: (userId: string, status: string, page: number, limit: number) =>
    `learning-courses:${userId}:${status}:${page}:${limit}`,
  section: (id: string) => `section:${id}`,
  step: (id: string) => `step:${id}`,

  refreshToken: (jti: string) => `auth:refresh:${jti}`,
  rateLimit: (key: string) => `rate:${key}`,
};
