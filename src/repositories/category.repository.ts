import { NotFoundError } from '@/errors';
import { Category, CourseLevel, CourseStatus } from '@/generated/prisma/client';
import { CategoryFindManyArgs, CategoryWhereInput } from '@/generated/prisma/models';
import { prisma } from '@/lib/prisma';
import { CourseDuration } from '@/types/course.types';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class CategoryRepository {
  async getCourseByCategoryId(
    categoryId: string,
    take: number,
    skip: number,
    levels: CourseLevel[] | undefined,
    durations: CourseDuration[] | undefined,
    avgRating: number,
    sortBy: string
  ) {
    const durationFilter: Record<CourseDuration, { gte?: number; lt?: number }> = {
      extraShort: { lt: 2 },
      short: { gte: 2, lt: 5 },
      medium: { gte: 5, lt: 10 },
      long: { gte: 10, lt: 17 },
      extraLong: { gte: 17 },
    };

    const orderBy: Record<string, any> = {
      rating: { avgRating: 'desc' },
      newest: { updatedAt: 'desc' },
      popular: { enrollments: { _count: 'desc' } },
    };

    const durationConditions = durations ? durations.map((d) => ({ totalDuration: durationFilter[d] })) : [];

    const categoryConditions = [{ categoryId }, { subCategoryId: categoryId }];

    const where = {
      status: CourseStatus.published,
      level: levels ? { in: levels } : undefined,
      avgRating: { gte: Number(avgRating) },
      AND: [{ OR: categoryConditions }, { OR: durationConditions }],
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        take,
        skip,
        orderBy: orderBy[sortBy],
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          instructor: {
            select: {
              fullname: true,
            },
          },
          status: true,
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          level: true,
          avgRating: true,
          reviewCount: true,
          totalDuration: true,
          img: { select: { url: true } },
          createdAt: true,
          _count: {
            select: {
              enrollments: {
                where: { status: { in: ['active', 'completed'] } },
              },
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return { courses, total };
  }

  async getCategorySummary(id: string) {
    const [category, avgRating, students] = await Promise.all([
      prisma.category.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          _count: {
            select: {
              courses: {
                where: { status: 'published' },
              },
              subCategoryCourses: {
                where: { status: 'published' },
              },
            },
          },
        },
      }),
      prisma.course.aggregate({
        where: {
          OR: [{ categoryId: id }, { subCategoryId: id }],
          status: 'published',
          avgRating: { gt: 0 },
        },
        _avg: {
          avgRating: true,
        },
      }),
      prisma.enrollment.count({
        where: {
          course: {
            OR: [{ categoryId: id }, { subCategoryId: id }],
            status: 'published',
          },
          status: {
            in: ['active', 'completed'],
          },
        },
      }),
    ]);
    if (!category) throw new NotFoundError('Category not found');

    return {
      ...category,
      avgRating: avgRating._avg.avgRating,
      students,
    };
  }

  async getCategoryIdBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return category?.id;
  }
  async getCategoryTree() {
    return prisma.category.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
  async getAll(
    parentId: string | null | undefined,
    includeParent: boolean | undefined,
    q: string | undefined
  ): Promise<Category[]> {
    const query = this.buildGetCategoriesQuery(parentId, includeParent, q);

    return prisma.category.findMany(query);
  }

  async getCategories(
    parentId: string | null | undefined,
    skip: number,
    take: number,
    includeParent: boolean | undefined,
    q: string | undefined
  ) {
    const query = this.buildGetCategoriesQuery(parentId, includeParent, q);
    const where = query.where;

    const paginatedQuery = { ...query, skip, take };

    const [categories, total] = await Promise.all([
      prisma.category.findMany(paginatedQuery),
      prisma.category.count({ where }),
    ]);
    return { categories, total };
  }

  private buildGetCategoriesQuery(
    parentId: string | null | undefined,
    includeParent: boolean | undefined,
    q: string | undefined
  ): CategoryFindManyArgs {
    const searchConditions = q
      ? [
          { name: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ]
      : [];
    const where = { parentId, OR: q ? searchConditions : undefined };

    const query: CategoryFindManyArgs = { where, orderBy: { name: 'asc' } };

    if (includeParent) {
      query.include = { parent: { select: { id: true, name: true } } };
    }

    return query;
  }
}
