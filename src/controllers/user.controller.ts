import {
  CreateOrUpdateLearningProgressDto,
  CreateUserDto,
  GetInstructorRegistrationsQueryDto,
  GetLearningCoursesQueryDto,
  GetUsersQueryDto,
  UpdateMyProfileDto,
  UpdateUserDto,
} from '@/dtos/user.dto';
import { UnauthorizedError } from '@/errors';
import { CourseService } from '@/services';
import { UserService } from '@/services';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly courseService: CourseService
  ) {}

  async getUsers(req: Request, res: Response) {
    const query = req?.query as unknown as GetUsersQueryDto;
    const result = await this.userService.getUsers(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.userService.getUserById(id);
    successResponse({
      res,
      data: result,
    });
  }

  async getInstructorRegistations(req: Request, res: Response) {
    const query = req?.query as unknown as GetInstructorRegistrationsQueryDto;
    const result = await this.userService.getInstructorRegistations(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getMyProfile(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const result = await this.userService.getMyProfile(userId);
    successResponse({
      res,
      data: result,
    });
  }

  async getMyLearningCourses(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const query = req?.query as unknown as GetLearningCoursesQueryDto;
    const result = await this.courseService.getLearningCoursesByUserId(userId, query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getMyLearningProgressByStepId(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const { stepId } = req.params;
    const result = await this.userService.getLearningProgressByStepId(userId, stepId);
    successResponse({ res, data: result });
  }

  async createUser(req: Request, res: Response) {
    const payload = req.body as CreateUserDto;
    const result = await this.userService.createUser(payload);
    successResponse({
      res,
      status: 201,
      data: result,
    });
  }

  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const payload = req.body as UpdateUserDto;
    const result = await this.userService.updateUser(id, payload);
    successResponse({
      res,
      data: result,
    });
  }

  async updateMyProfile(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const payload = req.body as UpdateMyProfileDto;
    const result = await this.userService.updateMyProfile(userId, payload);
    successResponse({
      res,
      data: result,
    });
  }

  async createOrUpdateStepLearningProgress(req: Request, res: Response) {
    const studentId = req?.user?.id;
    if (!studentId) throw new UnauthorizedError('studentId is missing');
    const { stepId } = req.params;
    const payload = req.body as CreateOrUpdateLearningProgressDto;
    const result = await this.userService.createOrUpdateStepLearningProgress(studentId, stepId, payload);
    successResponse({ res, data: result });
  }

  async createOrUpdateExerciseLearningProgress(req: Request, res: Response) {
    const studentId = req?.user?.id;
    if (!studentId) throw new UnauthorizedError('studentId is missing');
    const { exerciseId } = req.params;
    const payload = req.body as CreateOrUpdateLearningProgressDto;
    const result = await this.userService.createOrUpdateExerciseLearningProgress(studentId, exerciseId, payload);
    successResponse({ res, data: result });
  }

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    await this.userService.deleteUser(id);
    successResponse({
      res,
    });
  }
}
