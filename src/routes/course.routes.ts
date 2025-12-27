import { CourseController } from '@/controllers/course.controller';
import { Router } from 'express';
import passport from 'passport';

const router = Router();
const courseController = new CourseController();

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  courseController.createCourse.bind(courseController)
);
