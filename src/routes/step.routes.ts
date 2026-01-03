import { StepController } from '@/controllers/step.controller';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const stepController = new StepController();

// router.post(
//   '/:id/step',
//   requireAuth,
//   authorize([UserRole.admin, UserRole.instructor]),
//   validate(addStepScheme),
//   stepController.addStep.bind(stepController)
// );

// router.patch(
//   '/:id',
//   requireAuth,
//   authorize([UserRole.admin, UserRole.instructor]),
//   validate(updateUnitScheme),
//   stepController.updateUnit.bind(stepController)
// );

router.delete(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  stepController.deleteStep.bind(stepController)
);

export default router;
