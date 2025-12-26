import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { ZodError } from 'zod';
import { JWSSignatureVerificationFailed, JWTExpired } from 'jose/errors';
import { errorResponse } from '@/utils/response';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Operational errors (known errors)
  if (err instanceof AppError) {
    return errorResponse({ res, status: err.status, message: err.message, code: err.code, errors: err.errors });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return errorResponse({
      res,
      status: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return errorResponse({
        res,
        status: 409,
        message: 'A record with this value already exists',
        code: 'RECORD_ALREADY_EXISTS',
      });
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return errorResponse({ res, status: 404, message: 'Record not found', code: 'RECORD_NOT_FOUND' });
    }
  }

  // JWT errors
  if (err instanceof JWSSignatureVerificationFailed) {
    return errorResponse({ res, status: 401, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  if (err instanceof JWTExpired) {
    return errorResponse({ res, status: 401, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // Default to 500 internal server error
  res.status(500).json({
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};
