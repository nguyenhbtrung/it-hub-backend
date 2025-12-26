export class AppError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: string,
    public errors?: any[],
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST', errors?: any[]) {
    super(400, message, code, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', errors?: any[]) {
    super(401, message, code, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN', errors?: any[]) {
    super(403, message, code, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', code: string = 'NOT_FOUND', errors?: any[]) {
    super(404, message, code, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT', errors?: any[]) {
    super(409, message, code, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', errors?: any[]) {
    super(422, message, 'VALIDATION_ERROR', errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', code: string = 'TOO_MANY_REQUESTS', errors?: any[]) {
    super(429, message, code, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_ERROR', errors?: any[]) {
    super(500, message, code, errors, false);
  }
}
