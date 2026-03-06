import { DashboardController } from '@/controllers/dashboard.controller';

import { UserRole } from '@/generated/prisma/enums';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();
const dashboardController = new DashboardController();

router.get(
  '/instructor/summary',
  requireAuth,
  authorize([UserRole.instructor]),
  dashboardController.getInstructorDashboardSummary.bind(dashboardController)
);

export default router;
