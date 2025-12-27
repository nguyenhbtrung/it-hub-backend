import { CreateCourseDTO } from '@/dtos/coures.dto';
import { UnauthorizedError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { CourseService } from '@/services/course.service';
import { successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';

const courseService = new CourseService(new CourseRepository());

export class CourseController {
  async createCourse(req: Request, res: Response, next: NextFunction) {
    const payload = req.body as CreateCourseDTO;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await courseService.createCourse(payload, instructorId);
    successResponse({
      res,
      message: 'Course created successfully',
      data: result,
      status: 201,
    });
  }
}
