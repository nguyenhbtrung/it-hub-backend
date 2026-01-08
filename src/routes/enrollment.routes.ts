import { EnrollmentController } from '@/controllers/enrollment.controller';
import { getCourseByCategoryIdQuerySchema } from '@/dtos/category.dto';
import { updateEnrollmentSchema } from '@/dtos/enrollment.dto';
import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const enrollmentController = new EnrollmentController();

router.patch(
  '/:courseId/:userId',
  requireAuth,
  authorize([UserRole.instructor, UserRole.admin]),
  validate(updateEnrollmentSchema),
  enrollmentController.updateEnrollment.bind(enrollmentController)
);

router.delete('/:courseId/:userId', requireAuth, enrollmentController.deleteEnrollment.bind(enrollmentController));

export default router;
