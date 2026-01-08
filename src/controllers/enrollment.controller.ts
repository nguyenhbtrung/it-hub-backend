import {
  CreateEnrollmentDto,
  CreateEnrollmentQueryDto,
  DeleteEnrollmentQueryDto,
  UpdateEnrollmentDto,
} from '@/dtos/enrollment.dto';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { EnrollmentService } from '@/services/enrollment.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const enrollmentService = new EnrollmentService(new EnrollmentRepository(), new CourseRepository());

export class EnrollmentController {
  async createEnrollment(req: Request, res: Response) {
    const { courseId } = req.params;
    const myId = req?.user?.id;
    const role = req?.user?.role;
    const payload = req.body as CreateEnrollmentDto;
    const { userId } = req?.query as unknown as CreateEnrollmentQueryDto;
    const result = await enrollmentService.createEnrollment(courseId, userId, myId || '', role, payload);
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
    await enrollmentService.updateEnrollment(courseId, userId, instructorId || '', role, payload);
    successResponse({
      res,
    });
  }

  async deleteEnrollment(req: Request, res: Response) {
    const { courseId } = req.params;
    const myId = req?.user?.id;
    const role = req?.user?.role;
    const { userId } = req?.query as unknown as DeleteEnrollmentQueryDto;
    await enrollmentService.deleteEnrollment(courseId, userId, myId || '', role);
    successResponse({
      res,
    });
  }
}
