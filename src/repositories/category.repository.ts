import { NotFoundError } from '@/errors';
import { Category } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CategoryRepository {
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
