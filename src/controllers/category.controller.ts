import { GetCategoriesQueryDTO } from '@/dtos/category.dto';
import { CategoryRepository } from '@/repositories/category.repository';
import { CategoryService } from '@/services/category.service';
import { successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';

const categoryService = new CategoryService(new CategoryRepository());

export class CategoryController {
  async getCategoryTree(req: Request, res: Response) {
    const result = await categoryService.getCategoryTree();
    successResponse({
      res,
      data: result,
    });
  }

  async getCategories(req: Request, res: Response) {
    const query = req.query as unknown as GetCategoriesQueryDTO;
    const result = await categoryService.getCategories(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
}
