/**
 * Simple in-memory cache for API responses
 * Reduces database load and prevents process pile-up
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from request params
  static generateKey(prefix: string, params: Record<string, string | number | boolean | undefined | null>): string {
    const sortedParams = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }
}

// Singleton instance
export const apiCache = new SimpleCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 seconds - for frequently changing data
  MEDIUM: 2 * 60 * 1000, // 2 minutes - for moderately changing data
  LONG: 5 * 60 * 1000,   // 5 minutes - for relatively static data
  HOUR: 60 * 60 * 1000,  // 1 hour - for very static data
} as const;

/**
 * Wrap an async function with caching
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
      resolve(cached);
      return;
    }

    // Execute function and cache result
    fn()
      .then((data) => {
        apiCache.set(key, data, ttl);
        resolve(data);
      })
      .catch(reject);
  });
}

/**
 * Execute a promise or thenable (like Supabase queries) with timeout
 */
export function withTimeout<T>(
  promiseOrThenable: PromiseLike<T> | Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    Promise.resolve(promiseOrThenable)
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
