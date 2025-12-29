import { GetTagsQueryDTO } from '@/dtos/tag.dto';
import { TagRepository } from '@/repositories/tag.repository';
import { TagService } from '@/services/tag.service';
import { successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';

const tagService = new TagService(new TagRepository());

export class TagController {
  async getTags(req: Request, res: Response, next: NextFunction) {
    const query = req.query as unknown as GetTagsQueryDTO;
    const result = await tagService.getTags(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
}
