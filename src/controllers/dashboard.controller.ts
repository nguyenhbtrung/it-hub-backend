import { UnauthorizedError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { DashboardService } from '@/services/dashboard.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const dashboardService = new DashboardService(new EnrollmentRepository(), new CourseRepository());

export class DashboardController {
  async getInstructorDashboardSummary(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await dashboardService.getInstructorDashboardSummary(userId);
    successResponse({ res, data: result });
  }
}
