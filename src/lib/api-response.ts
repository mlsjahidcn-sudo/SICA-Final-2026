import { NextResponse } from 'next/server';

/**
 * Standardized API Response Format
 * 
 * All API responses should use these helpers to ensure consistency
 * across the entire application.
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

/**
 * Success response helper
 * 
 * @example
 * return success({ user: userData }, { total: 100 });
 */
export function success<T>(
  data: T,
  meta?: Record<string, unknown>
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response);
}

/**
 * Error response helper
 * 
 * @example
 * return error('UNAUTHORIZED', 'Authentication required', 401);
 * return error('VALIDATION_ERROR', 'Invalid input', 400, { field: 'email' });
 */
export function error(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<APIResponse> {
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Common error shortcuts
 */
export const errors = {
  /**
   * Authentication required (401)
   */
  unauthorized: (message = 'Authentication required') =>
    error('UNAUTHORIZED', message, 401),

  /**
   * Insufficient permissions (403)
   */
  forbidden: (message = 'Insufficient permissions') =>
    error('FORBIDDEN', message, 403),

  /**
   * Resource not found (404)
   */
  notFound: (resource = 'Resource', id?: string) =>
    error('NOT_FOUND', id ? `${resource} with id ${id} not found` : `${resource} not found`, 404),

  /**
   * Validation error (400)
   */
  validation: (message: string, details?: unknown) =>
    error('VALIDATION_ERROR', message, 400, details),

  /**
   * Missing required fields (400)
   */
  missingFields: (fields: string[]) =>
    error('MISSING_FIELDS', 'Required fields are missing', 400, { fields }),

  /**
   * Duplicate resource (409)
   */
  duplicate: (resource: string, field?: string) =>
    error('DUPLICATE', `${resource} already exists${field ? ` (${field})` : ''}`, 409),

  /**
   * Internal server error (500)
   */
  internal: (message = 'Internal server error', details?: unknown) =>
    error('INTERNAL_ERROR', message, 500, details),

  /**
   * Bad request (400)
   */
  badRequest: (message: string, details?: unknown) =>
    error('BAD_REQUEST', message, 400, details),

  /**
   * Rate limit exceeded (429)
   */
  rateLimit: (retryAfter?: number) => {
    const response = error('RATE_LIMIT', 'Too many requests, please try again later', 429);
    if (retryAfter) {
      response.headers.set('Retry-After', String(retryAfter));
    }
    return response;
  },
};

/**
 * Pagination helper
 * 
 * @example
 * const response = paginated(users, { page: 1, limit: 20, total: 100 });
 */
export function paginated<T>(
  data: T[],
  options: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse<APIResponse<T[]>> {
  return success(data, {
    pagination: {
      page: options.page,
      limit: options.limit,
      total: options.total,
      totalPages: Math.ceil(options.total / options.limit),
    },
  });
}

/**
 * Created response helper (201)
 */
export function created<T>(data: T): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: 201 }
  );
}

/**
 * No content response helper (204)
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
