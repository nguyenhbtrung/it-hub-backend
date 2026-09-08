import { CacheService } from '@/common/cache/cache.service';
import { StepKeys } from './step.keys';

export class StepCache {
  private static readonly TTL = 24 * 60 * 60;

  static get(id: string) {
    return CacheService.get<any>(StepKeys.byId(id));
  }

  static set(step: any) {
    return CacheService.set(StepKeys.byId(step.id), step, this.TTL);
  }

  static invalidate(id: string) {
    return CacheService.del(StepKeys.byId(id));
  }
}
