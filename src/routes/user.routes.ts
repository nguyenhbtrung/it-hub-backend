import { userController } from '@/bootstrap/container';
import {
  createOrUpdateLearningProgressSchema,
  createUserSchema,
  getInstructorRegistrationsQuerySchema,
  getLearningCoursesQuerySchema,
  getUsersQueryScheme,
  updateMyProfileSchema,
  updateUserSchema,
} from '@/dtos/user.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();

router.get(
  '/',
  requireAuth,
  authorize([UserRole.admin]),
  validateQuery(getUsersQueryScheme),
  userController.getUsers.bind(userController)
);

router.get('/:id', requireAuth, authorize([UserRole.admin]), userController.getUserById.bind(userController));

router.get('/me/profile', requireAuth, userController.getMyProfile.bind(userController));
router.get(
  '/me/learn/courses',
  requireAuth,
  validateQuery(getLearningCoursesQuerySchema),
  userController.getMyLearningCourses.bind(userController)
);

router.get(
  '/instructor/registrations',
  requireAuth,
  authorize([UserRole.admin]),
  validateQuery(getInstructorRegistrationsQuerySchema),
  userController.getInstructorRegistations.bind(userController)
);

router.get(
  '/me/steps/:stepId/progress',
  requireAuth,
  userController.getMyLearningProgressByStepId.bind(userController)
);

router.post(
  '/',
  requireAuth,
  authorize([UserRole.admin]),
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin]),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

router.patch(
  '/me/profile',
  requireAuth,
  validate(updateMyProfileSchema),
  userController.updateMyProfile.bind(userController)
);

router.put(
  '/me/steps/:stepId/progress',
  requireAuth,
  validate(createOrUpdateLearningProgressSchema),
  userController.createOrUpdateStepLearningProgress.bind(userController)
);

router.put(
  '/me/exercises/:exerciseId/progress',
  requireAuth,
  validate(createOrUpdateLearningProgressSchema),
  userController.createOrUpdateExerciseLearningProgress.bind(userController)
);

router.delete('/:id', requireAuth, authorize([UserRole.admin]), userController.deleteUser.bind(userController));

export default router;
