import { GetTagsQueryDTO } from '@/dtos/tag.dto';
import { Tag } from '@/generated/prisma/client';
import { TagRepository } from '@/repositories/tag.repository';

export class TagService {
  constructor(private tagRepository: TagRepository) {}
  async getTags(query: GetTagsQueryDTO): Promise<{ data: Tag[]; meta: any }> {
    const { page = 1, limit = 10, q = '' } = query;
    const search = q?.trim().toLowerCase();
    const take = Number(limit);
    const skip = (page - 1) * limit;

    const [data, total] = await this.tagRepository.getTags(take, skip, search);
    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }
}
