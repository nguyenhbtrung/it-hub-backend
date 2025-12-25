import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '../dtos/auth.dto';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), authController.register.bind(authController));

router.post('/login', authLimiter, validate(loginSchema), authController.login.bind(authController));

router.post('/refresh-token', authController.refreshToken.bind(authController));

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail.bind(authController));
router.post(
  '/resend-verification',
  authLimiter,
  validate(requestPasswordResetSchema), // Reuse schema (only email)
  authController.resendVerificationEmail.bind(authController)
);
router.post(
  '/request-password-reset',
  passwordResetLimiter,
  validate(requestPasswordResetSchema),
  authController.requestPasswordReset.bind(authController)
);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));
// Protected routes
router.post('/logout', passport.authenticate('jwt', { session: false }), authController.logout.bind(authController));
router.post(
  '/logout-all',
  passport.authenticate('jwt', { session: false }),
  authController.logoutAll.bind(authController)
);
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  authController.getProfile.bind(authController)
);
export default router;
