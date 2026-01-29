import { CreateUserDto, GetUsersQueryDto, UpdateMyProfileDto, UpdateUserDto } from '@/dtos/user.dto';
import { UnauthorizedError } from '@/errors';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { UserRepository } from '@/repositories/user.repository';
import { VerificationTokenRepository } from '@/repositories/verificationToken.repository';
import { UserService } from '@/services/user.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const userService = new UserService(new UserRepository(), new VerificationTokenRepository(), new UnitOfWork());

export class UserController {
  async getUsers(req: Request, res: Response) {
    const query = req?.query as unknown as GetUsersQueryDto;
    const result = await userService.getUsers(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
    });
  }

  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await userService.getUserById(id);
    successResponse({
      res,
      data: result,
    });
  }

  async getMyProfile(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const result = await userService.getMyProfile(userId);
    successResponse({
      res,
      data: result,
    });
  }

  async createUser(req: Request, res: Response) {
    const payload = req.body as CreateUserDto;
    const result = await userService.createUser(payload);
    successResponse({
      res,
      status: 201,
      data: result,
    });
  }

  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const payload = req.body as UpdateUserDto;
    const result = await userService.updateUser(id, payload);
    successResponse({
      res,
      data: result,
    });
  }

  async updateMyProfile(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const payload = req.body as UpdateMyProfileDto;
    const result = await userService.updateMyProfile(userId, payload);
    successResponse({
      res,
      data: result,
    });
  }

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    await userService.deleteUser(id);
    successResponse({
      res,
    });
  }
}
