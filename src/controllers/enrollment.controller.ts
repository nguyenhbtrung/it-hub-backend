import {
  CreateEnrollmentDto,
  CreateEnrollmentQueryDto,
  DeleteEnrollmentQueryDto,
  UpdateEnrollmentDto,
} from '@/dtos/enrollment.dto';
import { EnrollmentService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  async createEnrollment(req: Request, res: Response) {
    const { courseId } = req.params;
    const myId = req?.user?.id;
    const role = req?.user?.role;
    const payload = req.body as CreateEnrollmentDto;
    const { userId } = req?.query as unknown as CreateEnrollmentQueryDto;
    const result = await this.enrollmentService.createEnrollment(courseId, userId, myId || '', role, payload);
    successResponse({
      res,
      status: 201,
      data: result,
    });
  }

  async updateEnrollment(req: Request, res: Response) {
    const { courseId, userId } = req.params;
    const instructorId = req?.user?.id;
    const role = req?.user?.role;
    const payload = req.body as UpdateEnrollmentDto;
    await this.enrollmentService.updateEnrollment(courseId, userId, instructorId || '', role, payload);
    successResponse({
      res,
    });
  }

  async deleteEnrollment(req: Request, res: Response) {
    const { courseId } = req.params;
    const myId = req?.user?.id;
    const role = req?.user?.role;
    const { userId } = req?.query as unknown as DeleteEnrollmentQueryDto;
    await this.enrollmentService.deleteEnrollment(courseId, userId, myId || '', role);
    successResponse({
      res,
    });
  }
}
