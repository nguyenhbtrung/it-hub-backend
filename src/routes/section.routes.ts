import { SectionController } from '@/controllers/section.controller';
import { getCategoriesQuerySchema } from '@/dtos/category.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const sectionController = new SectionController();

router.delete(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  sectionController.deleteSection.bind(sectionController)
);

export default router;
