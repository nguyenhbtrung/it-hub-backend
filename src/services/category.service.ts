import { GetCategoriesQueryDTO, GetCourseByCategoryIdQueryDto } from '@/dtos/category.dto';
import { toFileResponseDto } from '@/dtos/file.dto';
import { NotFoundError } from '@/errors';
import { Category } from '@/generated/prisma/client';
import { CategoryRepository } from '@/repositories';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getCourseByCategoryId(id: string, query: GetCourseByCategoryIdQueryDto) {
    const { page = 1, limit = 5, level, duration, avgRating = 0, sortBy = 'popular' } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const levels = !level || Array.isArray(level) ? level : [level];
    const durations = !duration || Array.isArray(duration) ? duration : [duration];
    const { courses, total } = await this.categoryRepository.getCourseByCategoryId(
      id,
      take,
      skip,
      levels,
      durations,
      avgRating,
      sortBy
    );
    return {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getCategorySummary(id: string) {
    const category = await this.categoryRepository.getCategorySummary(id);
    return category;
  }

  async getCategoryIdBySlug(slug: string) {
    const categoryId = await this.categoryRepository.getCategoryIdBySlug(slug);
    if (!categoryId) throw new NotFoundError('Category not found');
    return categoryId;
  }

  async getCategoryTree() {
    const categories = await this.categoryRepository.getCategoryTree();
    return categories;
  }

  async getCategories(query: GetCategoriesQueryDTO): Promise<{ data: Category[]; meta: any }> {
    const { root, page = 1, limit = 10, all, parentId, includeParent, q } = query;

    if (all) {
      const data = await this.categoryRepository.getAll(parentId || (root ? null : undefined), includeParent, q);
      return { data, meta: { total: data.length } };
    }
    const take = Number(limit);
    const skip = (page - 1) * limit;

    const { categories, total } = await this.categoryRepository.getCategories(
      parentId || (root ? null : undefined),
      skip,
      take,
      includeParent,
      q
    );

    return { data: categories, meta: { total, page: Number(page), limit: Number(limit) } };
  }
}
