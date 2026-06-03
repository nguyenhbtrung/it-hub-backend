import { GetCategoriesQueryDTO, GetCourseByCategoryIdQueryDto } from '@/dtos/category.dto';
import { CategoryService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async getCourseByCategoryId(req: Request, res: Response) {
    const { id } = req.params;
    const query = req?.query as unknown as GetCourseByCategoryIdQueryDto;
    const result = await this.categoryService.getCourseByCategoryId(id, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getCategorySummary(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.categoryService.getCategorySummary(id);
    successResponse({
      res,
      data: result,
    });
  }
  async getCategoryIdBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await this.categoryService.getCategoryIdBySlug(slug);
    successResponse({
      res,
      data: result,
    });
  }

  async getCategoryTree(req: Request, res: Response) {
    const result = await this.categoryService.getCategoryTree();
    successResponse({
      res,
      data: result,
    });
  }

  async getCategories(req: Request, res: Response) {
    const query = req?.query as unknown as GetCategoriesQueryDTO;
    const result = await this.categoryService.getCategories(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
}
