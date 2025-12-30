import { UserRole } from '@/generated/prisma/enums';
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const requireAuth = passport.authenticate('jwt', { session: false });

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    req.user = user || null;
    next();
  })(req, res, next);
};

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
