import { CategoryController } from '@/controllers/category.controller';
import { getCategoriesQuerySchema } from '@/dtos/category.dto';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const categoryController = new CategoryController();

router.get('/', validateQuery(getCategoriesQuerySchema), categoryController.getCategories.bind(categoryController));

export default router;
