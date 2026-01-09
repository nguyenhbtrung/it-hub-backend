import { UnitController } from '@/controllers/unit.controller';

import { addMaterialScheme, addStepScheme, updateUnitScheme } from '@/dtos/unit.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const unitController = new UnitController();

router.get('/:id', requireAuth, unitController.getUnitById.bind(unitController));

router.post(
  '/:id/step',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(addStepScheme),
  unitController.addStep.bind(unitController)
);

router.post(
  '/:id/material',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(addMaterialScheme),
  unitController.addMaterial.bind(unitController)
);

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateUnitScheme),
  unitController.updateUnit.bind(unitController)
);

router.delete(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  unitController.deleteUnit.bind(unitController)
);

export default router;
