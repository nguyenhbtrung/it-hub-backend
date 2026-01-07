import { NotFoundError } from '@/errors';
import { Category, CourseLevel, CourseStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { CourseDuration } from '@/types/course.type';

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
      newest: { createdAt: 'desc' },
      popular: { enrollments: { _count: 'desc' } },
    };

    const where = {
      OR: [{ categoryId }, { subCategoryId: categoryId }],
      status: CourseStatus.published,
      level: levels ? { in: levels } : undefined,
      avgRating: { gte: Number(avgRating) },
      ...(durations ? { OR: durations.map((d) => ({ totalDuration: durationFilter[d] })) } : {}),
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
            },
          },
        },
      }),
      prisma.course.aggregate({
        where: {
          categoryId: id,
          status: 'published',
        },
        _avg: {
          avgRating: true,
        },
      }),
      prisma.enrollment.count({
        where: {
          course: {
            categoryId: id,
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
  async getAll(parentId: string | null | undefined): Promise<Category[]> {
    return prisma.category.findMany({ where: { parentId }, orderBy: { name: 'asc' } });
  }
}
