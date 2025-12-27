import { Category } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CategoryRepository {
  async getAll(parentId: string | null | undefined): Promise<Category[]> {
    return prisma.category.findMany({ where: { parentId }, orderBy: { name: 'asc' } });
  }
}
