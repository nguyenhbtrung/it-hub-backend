import { categoryController } from '@/bootstrap/container';
import { createCategorySchema, getCategoriesQuerySchema, getCourseByCategoryIdQuerySchema } from '@/dtos/category.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();

router.get(
  '/:id/courses',
  validateQuery(getCourseByCategoryIdQuerySchema),
  categoryController.getCourseByCategoryId.bind(categoryController)
);
router.get('/:id/summary', categoryController.getCategorySummary.bind(categoryController));
router.get('/:slug/id', categoryController.getCategoryIdBySlug.bind(categoryController));
router.get('/tree', categoryController.getCategoryTree.bind(categoryController));
router.get('/', validateQuery(getCategoriesQuerySchema), categoryController.getCategories.bind(categoryController));

router.post(
  '/',
  requireAuth,
  authorize([UserRole.admin]),
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);

export default router;
