import { ExerciseController } from '@/controllers/exercise.controller';
import { addSubmissionScheme, updateExerciseScheme } from '@/dtos/exercise.dto';
import { updateStepScheme } from '@/dtos/step.dto';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { serializeBigIntMiddleware } from '@/middleware/serializeBigInt.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const exerciseController = new ExerciseController();

router.get(
  '/:unitId',
  requireAuth,
  serializeBigIntMiddleware,
  exerciseController.getExerciseByUnitId.bind(exerciseController)
);

router.patch(
  '/:unitId',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateExerciseScheme),
  exerciseController.updateExercise.bind(exerciseController)
);

router.post(
  '/:exerciseId/submissions',
  requireAuth,
  validate(addSubmissionScheme),
  exerciseController.addSubmission.bind(exerciseController)
);

// router.delete(
//   '/:id',
//   requireAuth,
//   authorize([UserRole.admin, UserRole.instructor]),
//   exerciseController.deleteStep.bind(exerciseController)
// );

export default router;
