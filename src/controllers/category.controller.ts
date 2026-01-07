import { GetCategoriesQueryDTO, GetCourseByCategoryIdQueryDto } from '@/dtos/category.dto';
import { CategoryRepository } from '@/repositories/category.repository';
import { CategoryService } from '@/services/category.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const categoryService = new CategoryService(new CategoryRepository());

export class CategoryController {
  async getCourseByCategoryId(req: Request, res: Response) {
    const { id } = req.params;
    const query = req?.query as unknown as GetCourseByCategoryIdQueryDto;
    const result = await categoryService.getCourseByCategoryId(id, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getCategorySummary(req: Request, res: Response) {
    const { id } = req.params;
    const result = await categoryService.getCategorySummary(id);
    successResponse({
      res,
      data: result,
    });
  }
  async getCategoryIdBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await categoryService.getCategoryIdBySlug(slug);
    successResponse({
      res,
      data: result,
    });
  }

  async getCategoryTree(req: Request, res: Response) {
    const result = await categoryService.getCategoryTree();
    successResponse({
      res,
      data: result,
    });
  }

  async getCategories(req: Request, res: Response) {
    const query = req?.query as unknown as GetCategoriesQueryDTO;
    const result = await categoryService.getCategories(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
}
