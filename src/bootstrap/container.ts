import {
  AiController,
  AuthController,
  CategoryController,
  CourseController,
  DashboardController,
  EnrollmentController,
  ExerciseController,
  FileController,
  SectionController,
  StepController,
  TagController,
  UnitController,
  UserController,
} from '@/controllers';
import { container } from '@/di/container';

export const aiController = container.resolve(AiController);
export const authController = container.resolve(AuthController);
export const categoryController = container.resolve(CategoryController);
export const courseController = container.resolve(CourseController);
export const dashboardController = container.resolve(DashboardController);
export const enrollmentController = container.resolve(EnrollmentController);
export const exerciseController = container.resolve(ExerciseController);
export const fileController = container.resolve(FileController);
export const sectionController = container.resolve(SectionController);
export const stepController = container.resolve(StepController);
export const tagController = container.resolve(TagController);
export const unitController = container.resolve(UnitController);
export const userController = container.resolve(UserController);
