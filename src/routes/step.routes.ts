import { stepController } from '@/bootstrap/container';
import { updateStepScheme } from '@/dtos/step.dto';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();

router.get('/:id', requireAuth, stepController.getStepById.bind(stepController));

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateStepScheme),
  stepController.updateStep.bind(stepController)
);

router.delete(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  stepController.deleteStep.bind(stepController)
);

export default router;
