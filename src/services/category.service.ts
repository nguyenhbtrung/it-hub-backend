import { CategoryResponseDTO, GetCategoriesQueryDTO } from '@/dtos/category.dto';
import { Category } from '@/generated/prisma/client';
import { CategoryRepository } from '@/repositories/category.repository';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}
  async getCategoryTree() {
    const categories = await this.categoryRepository.getCategoryTree();
    return categories;
  }

  async getCategories(query: GetCategoriesQueryDTO): Promise<{ data: Category[]; meta: any }> {
    const { root, page = 1, limit = 20, all, parentId } = query;

    if (all) {
      const data = await this.categoryRepository.getAll(parentId || (root ? null : undefined));
      return { data, meta: { total: data.length } };
    }
    return { data: [], meta: {} };
  }
}
