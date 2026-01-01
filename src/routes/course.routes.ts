import { CourseController } from '@/controllers/course.controller';
import {
  getCourseDetailParamsScheme,
  getCourseDetailQueryScheme,
  getMyCreatedCoursesSchema,
  updateCourseDetailSchema,
  updateCourseImageScheme,
  updateCoursePromoVideoScheme,
} from '@/dtos/coures.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, optionalAuth, requireAuth } from '@/middleware/auth.middleware';
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

router.patch(
  '/:id/image',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateCourseImageScheme),
  courseController.updateCourseImage.bind(courseController)
);

router.patch(
  '/:id/promo-video',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateCoursePromoVideoScheme),
  courseController.updateCoursePromoVideo.bind(courseController)
);

router.get(
  '/me/created',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validateQuery(getMyCreatedCoursesSchema),
  courseController.getMyCreatedCourses.bind(courseController)
);

router.get(
  '/:id',
  optionalAuth,
  validateParams(getCourseDetailParamsScheme),
  validateQuery(getCourseDetailQueryScheme),
  courseController.getCourseDetail.bind(courseController)
);

export default router;
