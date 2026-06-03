import { GetTagsQueryDTO } from '@/dtos/tag.dto';
import { TagService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  async getTags(req: Request, res: Response, next: NextFunction) {
    const query = req.query as unknown as GetTagsQueryDTO;
    const result = await this.tagService.getTags(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
}
