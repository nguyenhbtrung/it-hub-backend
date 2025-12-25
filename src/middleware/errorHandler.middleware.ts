import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { ZodError } from 'zod';
import { JWSSignatureVerificationFailed, JWTExpired } from 'jose/errors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Operational errors (known errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err instanceof Error && (err as any).errors && { errors: (err as any).errors }),
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
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
      return res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists',
      });
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });
    }
  }

  // JWT errors
  if (err instanceof JWSSignatureVerificationFailed) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err instanceof JWTExpired) {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // Default to 500 internal server error
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
