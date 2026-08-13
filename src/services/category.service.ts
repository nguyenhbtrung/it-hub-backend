import { CreateCategoryDto, GetCategoriesQueryDTO, GetCourseByCategoryIdQueryDto } from '@/dtos/category.dto';
import { toFileResponseDto } from '@/dtos/file.dto';
import { BadRequestError, NotFoundError } from '@/errors';
import { Category } from '@/generated/prisma/client';
import { CourseCache } from '@/infra/cache';
import { CategoryRepository } from '@/repositories';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  private buildCoursesByCategoryCacheKeyQuery(query: GetCourseByCategoryIdQueryDto) {
    const { page = 1, limit = 5, level, duration, avgRating = 0, sortBy = 'popular' } = query;

    const normalizedLevel = Array.isArray(level) ? level.join(',') : level || '';
    const normalizedDuration = Array.isArray(duration) ? duration.join(',') : duration || '';

    return `${Number(page)}:${Number(limit)}:${normalizedLevel}:${normalizedDuration}:${Number(avgRating)}:${sortBy}`;
  }

  async getCourseByCategoryId(id: string, query: GetCourseByCategoryIdQueryDto) {
    const { page = 1, limit = 5, level, duration, avgRating = 0, sortBy = 'popular' } = query;

    const cacheKeyQuery = this.buildCoursesByCategoryCacheKeyQuery(query);
    const cachedResult = await CourseCache.getByCategoryId(id, cacheKeyQuery);
    if (cachedResult) {
      return cachedResult;
    }

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
    const result = {
      data: courses.map((course: any) => ({
        ...course,
        img: course.img ? toFileResponseDto(course.img) : null,
      })),
      meta: { total, page: Number(page), limit: Number(limit) },
    };

    await CourseCache.setByCategoryId(id, cacheKeyQuery, result);

    return result;
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

  async createCategory(payload: CreateCategoryDto) {
    const { name, slug, description, parentId } = payload;

    if (parentId) {
      const parent = await this.categoryRepository.getCategoryById(parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    if (slug) {
      const existing = await this.categoryRepository.getCategoryIdBySlug(slug);
      if (existing) {
        throw new BadRequestError('Category slug already exists');
      }
    }

    return this.categoryRepository.createCategory({
      name,
      slug,
      description,
      parentId: parentId ?? null,
    });
  }
}
