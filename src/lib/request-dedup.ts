/**
 * Request Deduplication Utility
 * Prevents duplicate concurrent requests to the same endpoint
 * Useful for preventing redundant API calls during React re-renders
 */

type Fetcher<T> = () => Promise<T>;

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Default TTL for cached responses (30 seconds)
  private defaultTTL = 30 * 1000;

  constructor() {
    // Clean up stale entries every minute
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean up pending requests older than 10 seconds (likely stuck)
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > 10 * 1000) {
        this.pendingRequests.delete(key);
      }
    }

    // Clean up cached responses past TTL
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Deduplicate and cache a request
   * If the same request is already in flight, returns the existing promise
   * If cached data exists and is fresh, returns cached data
   */
  async fetch<T>(
    key: string,
    fetcher: Fetcher<T>,
    options: {
      ttl?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, skipCache = false } = options;

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cached = this.cache.get(key) as { data: T; timestamp: number } | undefined;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key) as PendingRequest<T> | undefined;
    if (pending) {
      return pending.promise;
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache successful response
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      })
      .finally(() => {
        // Remove from pending after completion
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, { promise, timestamp: Date.now() });

    return promise;
  }

  /**
   * Invalidate cache for a specific key or pattern
   */
  invalidate(pattern: string): void {
    // Exact match
    if (this.cache.has(pattern)) {
      this.cache.delete(pattern);
      return;
    }

    // Pattern match (key starts with pattern)
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { cacheSize: number; pendingSize: number } {
    return {
      cacheSize: this.cache.size,
      pendingSize: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const deduplication = new RequestDeduplicator();

/**
 * Hook-friendly wrapper for request deduplication
 */
export function deduplicatedFetch<T>(
  key: string,
  fetcher: Fetcher<T>,
  options?: { ttl?: number; skipCache?: boolean }
): Promise<T> {
  return deduplication.fetch(key, fetcher, options);
}

/**
 * Generate cache key from URL and params
 */
export function createCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return endpoint;

  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
}
