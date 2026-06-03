import {
  AddSectionDto,
  CreateCourseDTO,
  CreateOrUpdateReviewDto,
  GetCourseContentBreadcrumbQueryDTO,
  GetCourseContentQueryDTO,
  GetCourseDetailParamsDTO,
  GetCourseDetailQueryDTO,
  getCourseExercisesGroupedBySectionQueryDto,
  GetCourseReviewsQueryDto,
  GetCoursesQueryDTO,
  GetFeaturedCoursesQueryDTO,
  GetMyCreatedCoursesDTO,
  GetNavigationByContentIdQueryDto,
  GetRecommendedCoursesQueryDto,
  GetRegistrationsByCourseIdQueryDto,
  GetStudentsByCourseIdQueryDto,
  UpdateCourseDetailDTO,
  UpdateCourseImageDto,
  UpdateCoursePromoVideoDto,
  UpdateCourseStatusDTO,
} from '@/dtos/coures.dto';
import { UnauthorizedError } from '@/errors';
import { CourseService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  async createCourse(req: Request, res: Response, next: NextFunction) {
    const payload = req.body as CreateCourseDTO;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.courseService.createCourse(payload, instructorId);
    successResponse({
      res,
      message: 'Course created successfully',
      data: result,
      status: 201,
    });
  }

  async createOrUpdateReview(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const payload = req.body as CreateOrUpdateReviewDto;
    const result = await this.courseService.createOrUpdateReview(courseId, userId || '', payload);
    successResponse({
      res,
      data: result,
    });
  }

  async updateCourseStatus(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const { status } = req.body as UpdateCourseStatusDTO;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    await this.courseService.updateCourseStatus(courseId, userId || '', role, status);
    successResponse({
      res,
    });
  }

  async updateCourseTotalDuration(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const result = await this.courseService.updateCourseTotalDuration(courseId);
    successResponse({ res, message: 'Course duration updated successfully.', data: { duration: result } });
  }

  async updateCourseDetail(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const payload = req.body as UpdateCourseDetailDTO;
    const instructorId = req?.user?.id;
    const role = req?.user?.role;
    await this.courseService.updateCourseDetail(courseId, instructorId || '', role, payload);
    successResponse({
      res,
      message: 'Course updated successfully',
    });
  }

  async getNavigationByContentId(req: Request, res: Response) {
    const query = req?.query as unknown as GetNavigationByContentIdQueryDto;
    const { contentId } = req.params;
    const result = await this.courseService.getNavigationByContentId(contentId, query);
    successResponse({
      res,
      data: result,
    });
  }

  async getRegistrationsByCoursesId(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const query = req?.query as unknown as GetRegistrationsByCourseIdQueryDto;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getRegistrationsByCoursesId(courseId, userId || '', role, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getStudentsByCourseId(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const query = req?.query as unknown as GetStudentsByCourseIdQueryDto;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getStudentsByCourseId(courseId, userId || '', role, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getCourses(req: Request, res: Response) {
    const query = req?.query as unknown as GetCoursesQueryDTO;
    const result = await this.courseService.getCourses(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getRecommendedCourses(req: Request, res: Response) {
    const { categoryId } = req.query as unknown as GetRecommendedCoursesQueryDto;
    const userId = req?.user?.id;
    const result = await this.courseService.getRecommendedCourses(categoryId, userId);
    successResponse({
      res,
      data: result,
    });
  }

  async getFeaturedCourses(req: Request, res: Response) {
    const query = req.query as unknown as GetFeaturedCoursesQueryDTO;
    const result = await this.courseService.getFeaturedCourses(query);
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
    const result = await this.courseService.getUserEnrollmentStatus(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getMyCreatedCourses(req: Request, res: Response) {
    const query = req.query as unknown as GetMyCreatedCoursesDTO;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.courseService.getMyCreatedCourses(query, instructorId);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getCourseInstructor(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseInstructor(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseReviewStatistics(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseReviewStatistics(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseReviews(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const query = req.query as unknown as GetCourseReviewsQueryDto;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseReviews(courseId, userId || '', role, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getMyReviewOfTheCourse(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const result = await this.courseService.getMyReviewOfTheCourse(courseId, userId || '');
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseDetail(req: Request, res: Response) {
    const { view } = req.query as GetCourseDetailQueryDTO;
    const { id: courseId } = req.params as GetCourseDetailParamsDTO;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseDetail(courseId, userId || '', role, view);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseIdBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await this.courseService.getCourseIdBySlug(slug);
    successResponse({ res, data: result });
  }

  async getCourseContent(req: Request, res: Response) {
    const { view } = req.query as GetCourseContentQueryDTO;
    const { id: courseId } = req.params;
    const instructorId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseContent(courseId, instructorId || '', role, view);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseContentOutline(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const userId = req?.user?.id;
    const role = req?.user?.role;
    const result = await this.courseService.getCourseContentOutline(courseId, userId || '', role);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseContentBreadcrumb(req: Request, res: Response) {
    const { contentId } = req.params;
    const { type } = req.query as GetCourseContentBreadcrumbQueryDTO;
    const result = await this.courseService.getContentBreadcrumb(contentId, type);
    successResponse({
      res,
      data: result,
    });
  }

  async getCourseExercisesGroupedBySection(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const query = req.query as unknown as getCourseExercisesGroupedBySectionQueryDto;
    const result = await this.courseService.getCourseExercisesGroupedBySection(courseId, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async addSection(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const payload = req.body as AddSectionDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.courseService.addSection(courseId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add section successfully', data: result });
  }

  async updateCourseImage(req: Request, res: Response) {
    const { id: courseId } = req.params;
    const { imageId } = req.body as UpdateCourseImageDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await this.courseService.updateCourseImage(courseId, imageId, instructorId);
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
    await this.courseService.updatePromoVideoImage(courseId, promoVideoId, instructorId);
    successResponse({
      res,
      message: 'Course promo video updated successfully',
    });
  }
}
