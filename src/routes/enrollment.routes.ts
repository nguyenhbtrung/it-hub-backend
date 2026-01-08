import { EnrollmentController } from '@/controllers/enrollment.controller';
import { getCourseByCategoryIdQuerySchema } from '@/dtos/category.dto';
import { createEnrollmentSchema, updateEnrollmentSchema } from '@/dtos/enrollment.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const enrollmentController = new EnrollmentController();

router.post(
  '/:courseId/',
  requireAuth,
  validate(createEnrollmentSchema),
  enrollmentController.createEnrollment.bind(enrollmentController)
);

router.patch(
  '/:courseId/:userId',
  requireAuth,
  authorize([UserRole.instructor, UserRole.admin]),
  validate(updateEnrollmentSchema),
  enrollmentController.updateEnrollment.bind(enrollmentController)
);

router.delete('/:courseId/', requireAuth, enrollmentController.deleteEnrollment.bind(enrollmentController));

export default router;
