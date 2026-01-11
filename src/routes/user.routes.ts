import { TagController } from '@/controllers/tag.controller';
import { UserController } from '@/controllers/user.controller';
import { getTagsQuerySchema } from '@/dtos/tag.dto';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const userController = new UserController();

router.get('/me/profile', requireAuth, userController.getMyProfile.bind(userController));

export default router;
