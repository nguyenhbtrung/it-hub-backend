import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected route
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  authController.getProfile.bind(authController)
);

export default router;
