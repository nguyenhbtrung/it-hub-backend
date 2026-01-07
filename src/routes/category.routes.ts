import { CategoryController } from '@/controllers/category.controller';
import { getCategoriesQuerySchema, getCourseByCategoryIdQuerySchema } from '@/dtos/category.dto';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const categoryController = new CategoryController();

router.get(
  '/:id/courses',
  validateQuery(getCourseByCategoryIdQuerySchema),
  categoryController.getCourseByCategoryId.bind(categoryController)
);
router.get('/:id/summary', categoryController.getCategorySummary.bind(categoryController));
router.get('/:slug/id', categoryController.getCategoryIdBySlug.bind(categoryController));
router.get('/tree', categoryController.getCategoryTree.bind(categoryController));
router.get('/', validateQuery(getCategoriesQuerySchema), categoryController.getCategories.bind(categoryController));

export default router;
