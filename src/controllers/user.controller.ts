import { UnauthorizedError } from '@/errors';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const userService = new UserService(new UserRepository());

export class UserController {
  async getMyProfile(req: Request, res: Response) {
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const result = await userService.getMyProfile(userId);
    successResponse({
      res,
      data: result,
    });
  }
}
