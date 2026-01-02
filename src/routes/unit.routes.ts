import { UnitController } from '@/controllers/unit.controller';

import { updateUnitScheme } from '@/dtos/unit.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const unitController = new UnitController();

// router.post(
//   '/:id/unit',
//   requireAuth,
//   authorize([UserRole.admin, UserRole.instructor]),
//   validate(addUnitScheme),
//   sectionController.addUnit.bind(sectionController)
// );

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateUnitScheme),
  unitController.updateUnit.bind(unitController)
);

// router.delete(
//   '/:id',
//   requireAuth,
//   authorize([UserRole.admin, UserRole.instructor]),
//   sectionController.deleteSection.bind(sectionController)
// );

export default router;
