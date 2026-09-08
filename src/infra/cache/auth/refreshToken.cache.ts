import { CacheService } from '@/common/cache/cache.service';
import { AuthKeys } from './auth.keys';

const OVERLAP_WINDOW_SEC = 20;
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7;

export class RefreshTokenCache {
  static get(id: string) {
    return CacheService.get<any>(AuthKeys.refreshToken(id));
  }

  static set(token: string, newToken?: string, accessToken?: string) {
    const value = {
      accessToken,
      refreshToken: newToken || token,
    };
    return CacheService.set(AuthKeys.refreshToken(token), value, newToken ? OVERLAP_WINDOW_SEC : REFRESH_TOKEN_EXPIRY);
  }
}
