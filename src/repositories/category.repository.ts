import { Category } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CategoryRepository {
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
