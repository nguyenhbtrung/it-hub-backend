import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import passportConfig from './config/passport';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import courseRoutes from './routes/course.routes';
import sectionRoutes from './routes/section.routes';
import unitRoutes from './routes/unit.routes';
import stepRoutes from './routes/step.routes';
import exerciseRoutes from './routes/exercise.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import tagRoutes from './routes/tag.routes';
import fileRoutes from './routes/file.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { NotFoundError } from './errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

app.use(passportConfig.initialize());

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Apply rate limiting to all API routes
// app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Email service configured: ${process.env.EMAIL_HOST}`);
});
