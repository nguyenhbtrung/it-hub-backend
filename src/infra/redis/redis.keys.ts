export const RedisKeys = {
  user: (id: string) => `user:${id}`,
  course: (id: string) => `course:${id}`,
  courseDetail: (id: string) => `course:detail:${id}`,
  section: (id: string) => `section:${id}`,
  step: (id: string) => `step:${id}`,

  refreshToken: (jti: string) => `auth:refresh:${jti}`,
  rateLimit: (key: string) => `rate:${key}`,
};
