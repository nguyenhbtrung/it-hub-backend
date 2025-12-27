import { CourseController } from '@/controllers/course.controller';
import { UserRole } from '@/generated/prisma/enums';
import { authorize } from '@/middleware/authorize.middleware';
import { Router } from 'express';
import passport from 'passport';

const router = Router();
const courseController = new CourseController();

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  authorize([UserRole.admin, UserRole.instructor]),
  courseController.createCourse.bind(courseController)
);

export default router;
