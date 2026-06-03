import { UnauthorizedError } from '@/errors';
import { DashboardService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  async getInstructorDashboardSummary(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await this.dashboardService.getInstructorDashboardSummary(userId);
    successResponse({ res, data: result });
  }

  async getStudentGrowthOfInstructor(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await this.dashboardService.getStudentGrowthOfInstructor(userId);
    successResponse({ res, data: result });
  }

  async getRecentActivitiesOfInstructor(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await this.dashboardService.getRecentActivitiesOfInstructor(userId, 3);
    successResponse({ res, data: result });
  }

  async getAdminDashboardSummary(req: Request, res: Response) {
    const result = await this.dashboardService.getAdminDashboardSummary();
    successResponse({ res, data: result });
  }

  async getCourseRegistrationGrowthOfAdmin(req: Request, res: Response) {
    const result = await this.dashboardService.getCourseRegistrationGrowthOfAdmin();
    successResponse({ res, data: result });
  }

  async getUserGrowthOfAdmin(req: Request, res: Response) {
    const result = await this.dashboardService.getUserGrowthOfAdmin();
    successResponse({ res, data: result });
  }
}
