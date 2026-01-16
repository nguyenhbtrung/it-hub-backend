import { TagController } from '@/controllers/tag.controller';
import { UserController } from '@/controllers/user.controller';
import { getTagsQuerySchema } from '@/dtos/tag.dto';
import { updateMyProfileSchema } from '@/dtos/user.dto';
import { requireAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const userController = new UserController();

router.get('/me/profile', requireAuth, userController.getMyProfile.bind(userController));

router.patch(
  '/me/profile',
  requireAuth,
  validate(updateMyProfileSchema),
  userController.updateMyProfile.bind(userController)
);

export default router;
