/**
 * Error Handling System
 * 
 * This module provides comprehensive error handling utilities including
 * custom error classes, error formatters, and error reporting mechanisms.
 * 
 * @module Errors
 * @version 1.0.0
 */

/**
 * Base application error class
 * All custom errors should extend from this class
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  readonly timestamp: Date;
  readonly requestId?: string;

  constructor(
    message: string,
    public readonly code?: string,
    requestId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.requestId = requestId;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON format for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly validationErrors?: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
    requestId?: string
  ) {
    super(message, 'VALIDATION_ERROR', requestId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message: string = 'Authentication required', requestId?: string) {
    super(message, 'AUTHENTICATION_ERROR', requestId);
  }
}

/**
 * Authorization error for permission failures
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message: string = 'Insufficient permissions', requestId?: string) {
    super(message, 'AUTHORIZATION_ERROR', requestId);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(
    resource: string = 'Resource',
    identifier?: string | number,
    requestId?: string
  ) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', requestId);
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message: string, requestId?: string) {
    super(message, 'CONFLICT_ERROR', requestId);
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly isOperational = true;

  constructor(
    message: string = 'Too many requests',
    public readonly retryAfter?: number,
    requestId?: string
  ) {
    super(message, 'RATE_LIMIT_ERROR', requestId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Database error for database-related failures
 */
export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly originalError?: Error,
    requestId?: string
  ) {
    super(message, 'DATABASE_ERROR', requestId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(process.env.NODE_ENV === 'development' && {
        originalError: this.originalError?.message,
      }),
    };
  }
}

/**
 * External API error for third-party service failures
 */
export class ExternalAPIError extends AppError {
  readonly statusCode = 502;
  readonly isOperational = true;

  constructor(
    service: string,
    message: string,
    public readonly originalStatus?: number,
    requestId?: string
  ) {
    super(`External service '${service}' error: ${message}`, 'EXTERNAL_API_ERROR', requestId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalStatus: this.originalStatus,
    };
  }
}

/**
 * Configuration error for misconfiguration issues
 */
export class ConfigurationError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message: string, requestId?: string) {
    super(message, 'CONFIGURATION_ERROR', requestId);
  }
}

/**
 * Business logic error for domain-specific failures
 */
export class BusinessLogicError extends AppError {
  readonly statusCode = 422;
  readonly isOperational = true;

  constructor(message: string, requestId?: string) {
    super(message, 'BUSINESS_LOGIC_ERROR', requestId);
  }
}

/**
 * Error types for specific domain errors
 */
export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string | number, requestId?: string) {
    super('User', identifier, requestId);
  }
}

export class RaffleNotFoundError extends NotFoundError {
  constructor(identifier: string, requestId?: string) {
    super('Raffle', identifier, requestId);
  }
}

export class PostNotFoundError extends NotFoundError {
  constructor(identifier: string, requestId?: string) {
    super('Post', identifier, requestId);
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(identifier: string | number, requestId?: string) {
    super(`User with identifier '${identifier}' already exists`, requestId);
  }
}

export class AlreadyParticipatedError extends ConflictError {
  constructor(requestId?: string) {
    super('User has already participated in this post', requestId);
  }
}

export class RaffleNotActiveError extends BusinessLogicError {
  constructor(requestId?: string) {
    super('Raffle is not currently active', requestId);
  }
}

export class InsufficientEngagementError extends BusinessLogicError {
  constructor(required: string, requestId?: string) {
    super(`Insufficient engagement: ${required} required`, requestId);
  }
}

export class NotFollowingError extends BusinessLogicError {
  constructor(requestId?: string) {
    super('User must follow @Like2Win to participate', requestId);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Determines if an error is operational (expected) or programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Formats error for logging
   */
  static formatForLogging(error: Error, context?: Record<string, any>): object {
    const baseError = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };

    if (error instanceof AppError) {
      return {
        ...baseError,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        requestId: error.requestId,
      };
    }

    return baseError;
  }

  /**
   * Formats error for API response
   */
  static formatForAPI(error: Error, requestId?: string): {
    success: false;
    error: string;
    message: string;
    code?: string;
    statusCode: number;
    requestId?: string;
    details?: any;
  } {
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId || requestId,
        ...(isDevelopment && { details: error.toJSON() }),
      };
    }

    // Generic error for unexpected errors
    return {
      success: false,
      error: 'InternalServerError',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      statusCode: 500,
      requestId,
      ...(isDevelopment && { details: { stack: error.stack } }),
    };
  }

  /**
   * Wraps database errors
   */
  static wrapDatabaseError(error: Error, requestId?: string): DatabaseError {
    // Check for common database error patterns
    const message = error.message.toLowerCase();

    if (message.includes('unique constraint') || message.includes('duplicate')) {
      return new ConflictError('Resource already exists', requestId);
    }

    if (message.includes('foreign key constraint')) {
      return new ValidationError('Invalid reference to related resource', undefined, requestId);
    }

    if (message.includes('not null constraint')) {
      return new ValidationError('Required field is missing', undefined, requestId);
    }

    if (message.includes('connection') || message.includes('timeout')) {
      return new DatabaseError('Database connection failed', error, requestId);
    }

    return new DatabaseError('Database operation failed', error, requestId);
  }

  /**
   * Extracts request ID from various sources
   */
  static extractRequestId(req?: any): string | undefined {
    if (!req) return undefined;

    // Try different common request ID headers
    return req.headers?.['x-request-id'] ||
           req.headers?.['x-correlation-id'] ||
           req.id ||
           undefined;
  }
}

/**
 * Error logger utility
 */
export class ErrorLogger {
  /**
   * Logs error with appropriate level
   */
  static log(error: Error, context?: Record<string, any>): void {
    const formattedError = ErrorHandler.formatForLogging(error, context);

    if (ErrorHandler.isOperationalError(error)) {
      console.warn('Operational Error:', formattedError);
    } else {
      console.error('Programming Error:', formattedError);
    }

    // In production, you might want to send this to an external service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, DataDog, etc.
      // SentryLogger.captureException(error, context);
    }
  }

  /**
   * Logs API error with request context
   */
  static logAPIError(
    error: Error,
    req?: { method?: string; url?: string; headers?: any },
    userId?: string
  ): void {
    const context = {
      ...(req && {
        method: req.method,
        url: req.url,
        userAgent: req.headers?.['user-agent'],
        ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'],
      }),
      ...(userId && { userId }),
      requestId: req ? ErrorHandler.extractRequestId(req) : undefined,
    };

    this.log(error, context);
  }
}

/**
 * Async error wrapper utility
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unexpected errors
      if (error instanceof Error) {
        ErrorLogger.log(error);
        throw new DatabaseError('An unexpected error occurred', error);
      }

      // Handle non-Error objects
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
      const wrappedError = new Error(errorMessage);
      ErrorLogger.log(wrappedError);
      throw new DatabaseError(errorMessage, wrappedError);
    }
  };
}

/**
 * Express.js error middleware
 */
export function errorMiddleware(
  error: Error,
  req: any,
  res: any,
  next: any
): void {
  const requestId = ErrorHandler.extractRequestId(req);
  
  // Log the error
  ErrorLogger.logAPIError(error, req, req.user?.id);

  // Format for API response
  const formattedError = ErrorHandler.formatForAPI(error, requestId);

  // Send response
  res.status(formattedError.statusCode).json(formattedError);
}

/**
 * Next.js API error wrapper
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request object if available (typically first argument in Next.js)
      const req = args[0] as any;
      const requestId = ErrorHandler.extractRequestId(req);

      if (error instanceof AppError) {
        ErrorLogger.logAPIError(error, req);
        throw error;
      }

      if (error instanceof Error) {
        ErrorLogger.logAPIError(error, req);
        throw ErrorHandler.wrapDatabaseError(error, requestId);
      }

      // Handle non-Error objects
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
      const wrappedError = new Error(errorMessage);
      ErrorLogger.logAPIError(wrappedError, req);
      throw new DatabaseError(errorMessage, wrappedError, requestId);
    }
  };
}

/**
 * Common error response helper for API routes
 */
export function sendErrorResponse(res: any, error: Error, requestId?: string): void {
  const formattedError = ErrorHandler.formatForAPI(error, requestId);
  res.status(formattedError.statusCode).json(formattedError);
}