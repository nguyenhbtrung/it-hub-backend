import { Router } from 'express';

import aiRoutes from './ai.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import courseRoutes from './course.routes';
import dashboardRoutes from './dashboard.routes';
import enrollmentRoutes from './enrollment.routes';
import exerciseRoutes from './exercise.routes';
import fileRoutes from './file.routes';
import sectionRoutes from './section.routes';
import stepRoutes from './step.routes';
import tagRoutes from './tag.routes';
import unitRoutes from './unit.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/files', fileRoutes);
router.use('/sections', sectionRoutes);
router.use('/steps', stepRoutes);
router.use('/tags', tagRoutes);
router.use('/units', unitRoutes);
router.use('/users', userRoutes);

export default router;
