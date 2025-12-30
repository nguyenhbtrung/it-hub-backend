import { CourseController } from '@/controllers/course.controller';
import {
  GetCourseDetailByInstructorParamsSchema,
  getMyCreatedCoursesSchema,
  updateCourseDetailSchema,
} from '@/dtos/coures.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const courseController = new CourseController();

router.post(
  '/',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  courseController.createCourse.bind(courseController)
);

router.patch(
  '/:id',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateCourseDetailSchema),
  courseController.updateCourseDetail.bind(courseController)
);

router.get(
  '/me/created',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validateQuery(getMyCreatedCoursesSchema),
  courseController.getMyCreatedCourses.bind(courseController)
);

router.get(
  '/:id/by-instructor',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validateParams(GetCourseDetailByInstructorParamsSchema),
  courseController.getCourseDetailByInstructor.bind(courseController)
);

export default router;
