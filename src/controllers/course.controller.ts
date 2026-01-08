import {
  AddSectionDto,
  CreateCourseDTO,
  GetCourseContentBreadcrumbQueryDTO,
  GetCourseContentQueryDTO,
  GetCourseDetailParamsDTO,
  GetCourseDetailQueryDTO,
  GetCoursesQueryDTO,
  GetFeaturedCoursesQueryDTO,
  GetMyCreatedCoursesDTO,
  GetRecommendedCoursesQueryDto,
  UpdateCourseDetailDTO,
  UpdateCourseImageDto,
  UpdateCoursePromoVideoDto,
  UpdateCourseStatusDTO,
} from '@/dtos/coures.dto';
import { UnauthorizedError } from '@/errors';
import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { TagRepository } from '@/repositories/tag.repository';
import { CourseService } from '@/services/course.service';
import { successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';

const courseService = new CourseService(new CourseRepository(), new TagRepository(), new EnrollmentRepository());

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

  async updateCourseStatus(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const { status } = req.body as UpdateCourseStatusDTO;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    await courseService.updateCourseStatus(courseId, userId || '', role, status);
    successResponse({
      res,
    });
  }

  async updateCourseTotalDuration(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const result = await courseService.updateCourseTotalDuration(courseId);
    successResponse({ res, message: 'Course duration updated successfully.', data: { duration: result } });
  }

  async updateCourseDetail(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const payload = req.body as UpdateCourseDetailDTO;
    const instructorId = req?.user?.id;
    const role = req?.user?.role;
    await courseService.updateCourseDetail(courseId, instructorId || '', role, payload);
    successResponse({
      res,
      message: 'Course updated successfully',
    });
  }

  async getStudentsByCourseId(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.id;
    const result = await courseService.getStudentsByCourseId(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourses(req: Request, res: Response) {
    const query = req?.query as unknown as GetCoursesQueryDTO;
    const result = await courseService.getCourses(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getRecommendedCourses(req: Request, res: Response) {
    const { categoryId } = req.query as unknown as GetRecommendedCoursesQueryDto;
    const userId = req?.user?.id;
    const result = await courseService.getRecommendedCourses(categoryId, userId);
    successResponse({
      res,
      data: result,
    });
  }

  async getFeaturedCourses(req: Request, res: Response) {
    const query = req.query as unknown as GetFeaturedCoursesQueryDTO;
    const result = await courseService.getFeaturedCourses(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getUserEnrollmentStatus(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await courseService.getUserEnrollmentStatus(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getMyCreatedCourses(req: Request, res: Response) {
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
  async getCourseDetail(req: Request, res: Response) {
    const { view } = req.query as GetCourseDetailQueryDTO;
    const { id: courseId } = req.params as GetCourseDetailParamsDTO;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await courseService.getCourseDetail(courseId, userId || '', role, view);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseIdBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await courseService.getCourseIdBySlug(slug);
    successResponse({ res, data: result });
  }

  async getCourseContent(req: Request, res: Response) {
    const { view } = req.query as GetCourseContentQueryDTO;
    const { id: courseId } = req.params;
    const instructorId = req?.user?.id;
    const role = req?.user?.role;
    const result = await courseService.getCourseContent(courseId, instructorId || '', role, view);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseContentOutline(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await courseService.getCourseContentOutline(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseContentBreadcrumb(req: Request, res: Response) {
    const { contentId } = req.params;
    const { type } = req.query as GetCourseContentBreadcrumbQueryDTO;
    const result = await courseService.getContentBreadcrumb(contentId, type);
    successResponse({
      res,
      data: result,
    });
  }

  async addSection(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const payload = req.body as AddSectionDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await courseService.addSection(courseId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add section successfully', data: result });
  }

  async updateCourseImage(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const { imageId } = req.body as UpdateCourseImageDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await courseService.updateCourseImage(courseId, imageId, instructorId);
    successResponse({
      res,
      message: 'Course image updated successfully',
    });
  }

  async updateCoursePromoVideo(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const { promoVideoId } = req.body as UpdateCoursePromoVideoDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await courseService.updatePromoVideoImage(courseId, promoVideoId, instructorId);
    successResponse({
      res,
      message: 'Course promo video updated successfully',
    });
  }
}
