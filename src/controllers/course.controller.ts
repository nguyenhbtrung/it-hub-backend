import {
  CreateCourseDTO,
  GetCourseDetailParamsDTO,
  GetCourseDetailQueryDTO,
  GetMyCreatedCoursesDTO,
  UpdateCourseDetailDTO,
} from '@/dtos/coures.dto';
import { UnauthorizedError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { TagRepository } from '@/repositories/tag.repository';
import { CourseService } from '@/services/course.service';
import { successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';

const courseService = new CourseService(new CourseRepository(), new TagRepository());

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

  async updateCourseDetail(req: Request, res: Response, next: NextFunction) {
    const { id: courseId } = req.params;
    const payload = req.body as UpdateCourseDetailDTO;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await courseService.updateCourseDetail(courseId, instructorId, payload);
    successResponse({
      res,
      message: 'Course updated successfully',
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
  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    const { view } = req.query as GetCourseDetailQueryDTO;
    const { id: courseId } = req.params as GetCourseDetailParamsDTO;
    const instructorId = req?.user?.id;
    const result = await courseService.getCourseDetail(courseId, instructorId || '', view);
    successResponse({
      res,
      data: result,
    });
  }
}
