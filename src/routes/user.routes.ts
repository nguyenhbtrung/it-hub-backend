import { TagController } from '@/controllers/tag.controller';
import { UserController } from '@/controllers/user.controller';
import { getTagsQuerySchema } from '@/dtos/tag.dto';
import { createUserSchema, getUsersQueryScheme, updateMyProfileSchema, updateUserSchema } from '@/dtos/user.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const userController = new UserController();

router.get(
  '/',
  requireAuth,
  authorize([UserRole.admin]),
  validateQuery(getUsersQueryScheme),
  userController.getUsers.bind(userController)
);

router.get('/:id', requireAuth, authorize([UserRole.admin]), userController.getUserById.bind(userController));

router.get('/me/profile', requireAuth, userController.getMyProfile.bind(userController));

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

export default router;
