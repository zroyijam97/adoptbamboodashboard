/**
 * Standardized API Response Utility
 * Provides consistent response formats across all API endpoints
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Error types for better error handling
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR'
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response builders
export class ApiResponseBuilder {
  static success<T>(data: T, message?: string, statusCode: number = 200): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: statusCode });
  }

  static error(
    error: string | ApiError,
    statusCode?: number,
    details?: any
  ): NextResponse {
    let errorMessage: string;
    let errorType: ApiErrorType;
    let finalStatusCode: number;

    if (error instanceof ApiError) {
      errorMessage = error.message;
      errorType = error.type;
      finalStatusCode = error.statusCode;
    } else {
      errorMessage = error;
      errorType = ApiErrorType.INTERNAL_ERROR;
      finalStatusCode = statusCode || 500;
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    // Log error for monitoring
    logger.error(`API Error: ${errorMessage}`, error instanceof Error ? error : undefined, {
      type: errorType,
      statusCode: finalStatusCode,
      details
    });

    return NextResponse.json(response, { status: finalStatusCode });
  }

  static validationError(message: string, details?: any): NextResponse {
    return this.error(new ApiError(ApiErrorType.VALIDATION_ERROR, message, 400, details));
  }

  static notFound(resource: string = 'Resource'): NextResponse {
    return this.error(new ApiError(ApiErrorType.NOT_FOUND, `${resource} not found`, 404));
  }

  static unauthorized(message: string = 'Unauthorized access'): NextResponse {
    return this.error(new ApiError(ApiErrorType.UNAUTHORIZED, message, 401));
  }

  static forbidden(message: string = 'Access forbidden'): NextResponse {
    return this.error(new ApiError(ApiErrorType.FORBIDDEN, message, 403));
  }

  static internalError(message: string = 'Internal server error', details?: any): NextResponse {
    return this.error(new ApiError(ApiErrorType.INTERNAL_ERROR, message, 500, details));
  }

  static databaseError(operation: string, details?: any): NextResponse {
    const message = `Database operation failed: ${operation}`;
    return this.error(new ApiError(ApiErrorType.DATABASE_ERROR, message, 500, details));
  }
}

// Validation utilities
export class ValidationHelper {
  static validateRequired(data: Record<string, any>, requiredFields: string[]): string[] {
    const missing: string[] = [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    }
    
    return missing;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    // Malaysian phone number format
    const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validateAmount(amount: string | number): boolean {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(numAmount) && numAmount > 0;
  }
}

// API endpoint wrapper for consistent error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    
    try {
      logger.apiRequest(endpoint, 'REQUEST');
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Extract status from NextResponse
      const status = result.status || 200;
      logger.apiResponse(endpoint, status, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.apiResponse(endpoint, 500, duration, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      if (error instanceof ApiError) {
        return ApiResponseBuilder.error(error);
      }
      
      return ApiResponseBuilder.internalError(
        'An unexpected error occurred',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }) as T;
}

// Database operation wrapper
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    logger.database(operationName, 'executing');
    const result = await operation();
    logger.database(operationName, 'completed');
    return result;
  } catch (error) {
    logger.error(`Database operation failed: ${operationName}`, error);
    throw new ApiError(
      ApiErrorType.DATABASE_ERROR,
      `Database operation failed: ${operationName}`,
      500,
      error instanceof Error ? error.message : 'Unknown database error'
    );
  }
}