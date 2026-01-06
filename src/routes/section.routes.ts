import { SectionController } from '@/controllers/section.controller';
import { addUnitScheme, updateSectionScheme } from '@/dtos/section.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const sectionController = new SectionController();

router.get('/:id', requireAuth, sectionController.getSectionById.bind(sectionController));

router.post(
  '/:id/unit',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(addUnitScheme),
  sectionController.addUnit.bind(sectionController)
);

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateSectionScheme),
  sectionController.updateSection.bind(sectionController)
);

router.delete(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  sectionController.deleteSection.bind(sectionController)
);

export default router;
