import { dashboardController } from '@/bootstrap/container';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

router.get(
  '/instructor/summary',
  requireAuth,
  authorize([UserRole.instructor]),
  dashboardController.getInstructorDashboardSummary.bind(dashboardController)
);

router.get(
  '/instructor/student-growth',
  requireAuth,
  authorize([UserRole.instructor]),
  dashboardController.getStudentGrowthOfInstructor.bind(dashboardController)
);

router.get(
  '/instructor/recent-activity',
  requireAuth,
  authorize([UserRole.instructor]),
  dashboardController.getRecentActivitiesOfInstructor.bind(dashboardController)
);

router.get(
  '/admin/summary',
  requireAuth,
  authorize([UserRole.admin]),
  dashboardController.getAdminDashboardSummary.bind(dashboardController)
);

router.get(
  '/admin/course-registration-growth',
  requireAuth,
  authorize([UserRole.admin]),
  dashboardController.getCourseRegistrationGrowthOfAdmin.bind(dashboardController)
);

router.get(
  '/admin/user-growth',
  requireAuth,
  authorize([UserRole.admin]),
  dashboardController.getUserGrowthOfAdmin.bind(dashboardController)
);

export default router;
