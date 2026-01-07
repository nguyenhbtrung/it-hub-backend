import { CourseController } from '@/controllers/course.controller';
import {
  addSectionScheme,
  getCourseContentBreadcrumbQueryScheme,
  getCourseContentQueryScheme,
  getCourseDetailParamsScheme,
  getCourseDetailQueryScheme,
  getCoursesQuerySchema,
  getFeaturedCoursesQuerySchema,
  getMyCreatedCoursesSchema,
  getRecommendedCoursesQuerySchema,
  updateCourseDetailSchema,
  updateCourseImageScheme,
  updateCoursePromoVideoScheme,
  updateCourseStatusSchema,
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

router.post(
  '/:id/section',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(addSectionScheme),
  courseController.addSection.bind(courseController)
);

router.patch(
  '/:id/duration',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  courseController.updateCourseTotalDuration.bind(courseController)
);

router.patch(
  '/:id/status',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validate(updateCourseStatusSchema),
  courseController.updateCourseStatus.bind(courseController)
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

router.get('/', optionalAuth, validateQuery(getCoursesQuerySchema), courseController.getCourses.bind(courseController));

router.get(
  '/recommended',
  optionalAuth,
  validateQuery(getRecommendedCoursesQuerySchema),
  courseController.getRecommendedCourses.bind(courseController)
);

router.get(
  '/featured',
  validateQuery(getFeaturedCoursesQuerySchema),
  courseController.getFeaturedCourses.bind(courseController)
);

router.get(
  '/:id/user-enrollment-status',
  optionalAuth,
  courseController.getUserEnrollmentStatus.bind(courseController)
);

router.get(
  '/me/created',
  requireAuth,
  authorize([UserRole.admin, UserRole.instructor]),
  validateQuery(getMyCreatedCoursesSchema),
  courseController.getMyCreatedCourses.bind(courseController)
);

router.get('/slug/:slug/courseId', courseController.getCourseIdBySlug.bind(courseController));

router.get(
  '/:id',
  optionalAuth,
  validateParams(getCourseDetailParamsScheme),
  validateQuery(getCourseDetailQueryScheme),
  courseController.getCourseDetail.bind(courseController)
);
router.get(
  '/:id/content',
  optionalAuth,
  validateQuery(getCourseContentQueryScheme),
  courseController.getCourseContent.bind(courseController)
);

router.get('/:id/content/outline', optionalAuth, courseController.getCourseContentOutline.bind(courseController));
router.get(
  '/content/:contentId/breadcrumb',
  optionalAuth,
  validateQuery(getCourseContentBreadcrumbQueryScheme),
  courseController.getCourseContentBreadcrumb.bind(courseController)
);

export default router;
