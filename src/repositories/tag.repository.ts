import { Tag } from '@/generated/prisma/client';
import { TagWhereInput } from '@/generated/prisma/models';
import { prisma } from '@/lib/prisma';

export class TagRepository {
  async getTags(take: number, skip: number, q?: string): Promise<[Tag[], number]> {
    const where = (q ? { slug: { contains: q, mode: 'insensitive' } } : {}) as TagWhereInput;
    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where: where,
        take,
        skip,
        orderBy: { name: 'asc' },
      }),
      prisma.tag.count({ where }),
    ]);
    return [tags, total];
  }
}
