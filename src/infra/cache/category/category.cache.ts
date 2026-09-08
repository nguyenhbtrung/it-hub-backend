import { CacheService } from '@/common/cache/cache.service';
import { CategoryKeys } from './category.keys';

export class CategoryCache {
  private static readonly TTL = 24 * 60 * 60;

  static getTree() {
    return CacheService.get<any>(CategoryKeys.tree());
  }

  static setTree(data: any) {
    return CacheService.set(CategoryKeys.tree(), data, this.TTL);
  }

  static invalidateTree() {
    return CacheService.del(CategoryKeys.tree());
  }
}
