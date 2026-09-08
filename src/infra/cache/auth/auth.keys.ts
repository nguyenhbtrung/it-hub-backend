export const AuthKeys = {
  refreshToken: (jti: string) => `auth:refresh:${jti}`,
};
