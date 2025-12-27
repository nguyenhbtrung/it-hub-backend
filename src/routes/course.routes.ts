import { CourseController } from '@/controllers/course.controller';
import { getMyCreatedCoursesSchema } from '@/dtos/coures.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize } from '@/middleware/authorize.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
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

router.get(
  '/me/created',
  passport.authenticate('jwt', { session: false }),
  authorize([UserRole.admin, UserRole.instructor]),
  validateQuery(getMyCreatedCoursesSchema),
  courseController.getMyCreatedCourses.bind(courseController)
);

export default router;
