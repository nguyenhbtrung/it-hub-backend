import { CourseController } from '@/controllers/course.controller';
import { GetCourseDetailByInstructorParamsSchema, getMyCreatedCoursesSchema } from '@/dtos/coures.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize } from '@/middleware/authorize.middleware';
import { validateParams, validateQuery } from '@/middleware/validate.middleware';
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

router.get(
  '/:id/by-instructor',
  passport.authenticate('jwt', { session: false }),
  authorize([UserRole.admin, UserRole.instructor]),
  validateParams(GetCourseDetailByInstructorParamsSchema),
  courseController.getCourseDetailByInstructor.bind(courseController)
);

export default router;
