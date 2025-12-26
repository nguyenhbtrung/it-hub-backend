import { Response } from 'express';

interface SuccessResponseParams {
  res: Response;
  data?: any;
  message?: string;
  code?: string;
  status?: number;
  meta?: Record<string, any>;
}

interface ErrorResponseParams {
  res: Response;
  message?: string;
  code?: string;
  status?: number;
  errors?: any[];
  meta?: Record<string, any>;
}

export const successResponse = ({
  res,
  message = 'Success',
  data = null,
  status = 200,
  meta = {},
}: SuccessResponseParams): Response => {
  return res.status(status).json({
    success: true,
    message,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  });
};

export const errorResponse = ({
  res,
  message = 'Internal Server Error',
  code = 'INTERNAL_ERROR',
  status = 500,
  errors = [],
  meta = {},
}: ErrorResponseParams): Response => {
  return res.status(status).json({
    success: false,
    code,
    message,
    errors,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  });
};
