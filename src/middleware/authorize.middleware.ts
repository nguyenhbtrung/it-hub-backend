import { UserRole } from '@/generated/prisma/enums';
import { Request, Response, NextFunction } from 'express';

export const authorize = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role && !roles.includes(req?.user?.role)) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
  }
  next();
};
