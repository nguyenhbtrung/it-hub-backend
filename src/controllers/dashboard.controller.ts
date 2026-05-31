import { UnauthorizedError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { UserRepository } from '@/repositories/user.repository';
import { DashboardService } from '@/services/dashboard.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const dashboardService = new DashboardService(new EnrollmentRepository(), new CourseRepository(), new UserRepository());

export class DashboardController {
  async getInstructorDashboardSummary(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await dashboardService.getInstructorDashboardSummary(userId);
    successResponse({ res, data: result });
  }

  async getStudentGrowthOfInstructor(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await dashboardService.getStudentGrowthOfInstructor(userId);
    successResponse({ res, data: result });
  }

  async getRecentActivitiesOfInstructor(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await dashboardService.getRecentActivitiesOfInstructor(userId, 3);
    successResponse({ res, data: result });
  }

  async getAdminDashboardSummary(req: Request, res: Response) {
    const result = await dashboardService.getAdminDashboardSummary();
    successResponse({ res, data: result });
  }

  async getCourseRegistrationGrowthOfAdmin(req: Request, res: Response) {
    const result = await dashboardService.getCourseRegistrationGrowthOfAdmin();
    successResponse({ res, data: result });
  }

  async getUserGrowthOfAdmin(req: Request, res: Response) {
    const result = await dashboardService.getUserGrowthOfAdmin();
    successResponse({ res, data: result });
  }
}
