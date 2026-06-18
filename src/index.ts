import 'dotenv/config';

import 'reflect-metadata';
import './di/registrations';

import express, { Application } from 'express';
import passportConfig from './config/passport';
import { errorHandler } from './middleware/errorHandler.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { NotFoundError } from './errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { redisClient } from './infra/redis/redis.client';
import router from './routes';

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
app.use('/api', router);

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

async function bootstrap() {
  try {
    await redisClient.connect();
    console.log('Redis connected');
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Email service configured: ${process.env.EMAIL_HOST}`);
    });
    const shutdown = async () => {
      console.log('Shutting down...');
      try {
        await redisClient.quit();
        console.log('Redis disconnected');
      } catch (err) {
        console.error('Error disconnecting Redis:', err);
      }
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start application:', err);
    process.exit(1);
  }
}
bootstrap();
