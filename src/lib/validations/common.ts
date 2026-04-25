import { z } from 'zod';

/**
 * Common validation schemas and utilities
 */

/**
 * UUID validator
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination query params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Search query params
 */
export const searchSchema = z.object({
  search: z.string().max(100).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Combined pagination and search
 */
export const paginationWithSearchSchema = paginationSchema.merge(searchSchema);

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Helper to validate request body with Zod schema
 * Returns parsed data or throws error
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

/**
 * Helper to validate query parameters with Zod schema
 * Returns parsed data or throws error
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T, params: URLSearchParams): z.infer<T> {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.parse(obj);
}

/**
 * Helper to validate path parameters with Zod schema
 * Returns parsed data or throws error
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T, params: Record<string, string | undefined>): z.infer<T> {
  return schema.parse(params);
}

/**
 * Safe validation that returns error instead of throwing
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PaginationWithSearchInput = z.infer<typeof paginationWithSearchSchema>;
