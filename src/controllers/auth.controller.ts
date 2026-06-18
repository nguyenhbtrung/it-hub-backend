import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { toUserResponseDTO } from '../dtos/user.dto';
import { UnauthorizedError } from '@/errors';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullname } = req.body;
      const result = await this.authService.register(email, password, fullname);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      successResponse({
        res,
        status: 201,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      successResponse({
        res,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      console.log('refreshToken', refreshToken);
      if (!refreshToken) throw new UnauthorizedError('Refresh token is required');
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      successResponse({
        res,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new UnauthorizedError('Refresh token is required');
      await this.authService.logout(refreshToken);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });

      successResponse({ res, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      await this.authService.logoutAll(userId);

      successResponse({ res, message: 'Logged out from all devices successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const user = await this.authService.verifyEmail(token);

      successResponse({ res, message: 'Email verified successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await this.authService.resendVerificationEmail(email);

      successResponse({ res, message: 'Verification email sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await this.authService.requestPasswordReset(email);

      successResponse({ res, message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await this.authService.resetPassword(token, password);

      successResponse({ res, message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req?.user?.id || '';
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(userId, currentPassword, newPassword);

      successResponse({ res, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      successResponse({ res, data: toUserResponseDTO(user) });
    } catch (error) {
      next(error);
    }
  }
}
