import { CreateCourseDTO, GetCourseDetailByInstructorParamsDTO, GetMyCreatedCoursesDTO } from '@/dtos/coures.dto';
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

  async getMyCreatedCourses(req: Request, res: Response, next: NextFunction) {
    const query = req.query as unknown as GetMyCreatedCoursesDTO;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await courseService.getMyCreatedCourses(query, instructorId);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }
  // async getCourseDetailByInstructor(req: Request, res: Response, next: NextFunction) {
  //   const { id: courseId } = req.params as GetCourseDetailByInstructorParamsDTO;
  //   const instructorId = req?.user?.id;
  //   if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
  //   const result = await courseService.getMyCreatedCourses(query, instructorId);
  //   successResponse({
  //     res,
  //     data: result.data,
  //     meta: result.meta,
  //   });
  // }
}
