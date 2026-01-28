import { GetUsersQueryDto, UpdateMyProfileDto } from '@/dtos/user.dto';
import { UnauthorizedError } from '@/errors';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const userService = new UserService(new UserRepository());

export class UserController {
  async getUsers(req: Request, res: Response) {
    const query = req?.query as unknown as GetUsersQueryDto;
    const result = await userService.getUser(query);
    successResponse({
      res,
      data: result.data,
      meta: result.meta,
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
}
