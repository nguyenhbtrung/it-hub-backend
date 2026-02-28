import { ExerciseController } from '@/controllers/exercise.controller';
import {
  addSubmissionScheme,
  getExerciseSubmissionsQuerySchema,
  getStudentSubmissionsQuerySchema,
  updateExerciseScheme,
  updateSubmissionSchema,
} from '@/dtos/exercise.dto';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { serializeBigIntMiddleware } from '@/middleware/serializeBigInt.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const exerciseController = new ExerciseController();

router.get(
  '/:unitId',
  requireAuth,
  serializeBigIntMiddleware,
  exerciseController.getExerciseByUnitId.bind(exerciseController)
);

router.get(
  '/:exerciseId/submissions/me',
  requireAuth,
  serializeBigIntMiddleware,
  validateQuery(getExerciseSubmissionsQuerySchema),
  exerciseController.getMyExerciseSubmissionsByExerciseId.bind(exerciseController)
);

router.get(
  '/:unitId/submissions/overview',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  exerciseController.getSubmissionOverviewByUnitId.bind(exerciseController)
);

router.get(
  '/:unitId/submissions',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validateQuery(getStudentSubmissionsQuerySchema),
  exerciseController.getStudentSubmissions.bind(exerciseController)
);

router.get(
  '/submissions/:id',
  requireAuth,
  serializeBigIntMiddleware,
  authorize([UserRole.admin, UserRole.instructor]),
  exerciseController.getSubmissionById.bind(exerciseController)
);

router.patch(
  '/:unitId',
  requireAuth,
  serializeBigIntMiddleware,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateExerciseScheme),
  exerciseController.updateExercise.bind(exerciseController)
);

router.patch(
  '/submissions/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateSubmissionSchema),
  exerciseController.updateSubmission.bind(exerciseController)
);

router.post(
  '/:exerciseId/submissions',
  requireAuth,
  validate(addSubmissionScheme),
  exerciseController.addSubmission.bind(exerciseController)
);

router.delete('/submissions/:id', requireAuth, exerciseController.deleteSubmission.bind(exerciseController));

export default router;
