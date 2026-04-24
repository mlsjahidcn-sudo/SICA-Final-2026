'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache, CACHE_TTL } from '@/lib/api-cache';
import { deduplicatedFetch, createCacheKey } from '@/lib/request-dedup';

// ============================================
// Types
// ============================================

interface UseOptimizedQueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseOptimizedQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  isFetching: boolean;
  refetch: () => void;
}

// ============================================
// Main Hook
// ============================================

/**
 * Optimized data fetching hook with caching and deduplication
 */
export function useOptimizedQuery<T>(
  options: UseOptimizedQueryOptions<T>
): UseOptimizedQueryResult<T> {
  const {
    queryKey,
    queryFn,
    enabled = true,
    staleTime = CACHE_TTL.MEDIUM,
    cacheTime = CACHE_TTL.LONG,
    refetchOnWindowFocus = false,
    refetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(() => {
    // Try to get initial data from cache
    return apiCache.get<T>(queryKey) ?? undefined;
  });
  
  const [isLoading, setIsLoading] = useState(!data);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsFetching(true);
    setIsError(false);
    setError(undefined);

    try {
      const result = await deduplicatedFetch(
        queryKey,
        queryFn,
        { ttl: cacheTime }
      );

      if (isMounted.current) {
        setData(result);
        setIsLoading(false);
        lastFetchTime.current = Date.now();
        
        // Cache the result
        apiCache.set(queryKey, result, cacheTime);
        
        onSuccess?.(result);
      }
    } catch (err) {
      if (isMounted.current) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current) {
        setIsFetching(false);
      }
    }
  }, [queryKey, queryFn, enabled, cacheTime, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    // Check if data is stale
    const cachedData = apiCache.get<T>(queryKey);
    const now = Date.now();
    
    if (cachedData && refetchOnMount === false) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    if (cachedData && now - lastFetchTime.current < staleTime) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [queryKey, enabled, staleTime, refetchOnMount, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFetchTime.current > staleTime) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, staleTime, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
}

// ============================================
// Pagination Hook
// ============================================

interface UsePaginatedQueryOptions<T> {
  queryKey: string;
  queryFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  enabled?: boolean;
}

interface UsePaginatedQueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  hasMore: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Hook for paginated data with infinite scroll support
 */
export function usePaginatedQuery<T>(
  options: UsePaginatedQueryOptions<T>
): UsePaginatedQueryResult<T> {
  const { queryKey, queryFn, pageSize = 12, enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const isMounted = useRef(true);

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    if (!enabled) return;

    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const result = await deduplicatedFetch(
        createCacheKey(queryKey, { page: pageNum, limit: pageSize }),
        () => queryFn(pageNum, pageSize),
        { ttl: CACHE_TTL.SHORT }
      );

      if (isMounted.current) {
        if (append) {
          setData(prev => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        setTotal(result.total);
      }
    } catch (error) {
      console.error('Paginated query error:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [queryKey, queryFn, pageSize, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(1);
    }
  }, [enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchNextPage = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  }, [page, fetchData]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  const hasMore = data.length < total;

  return {
    data,
    total,
    page,
    pageSize,
    isLoading,
    isFetching,
    hasMore,
    fetchNextPage,
    refetch,
  };
}

// ============================================
// Prefetch Utility
// ============================================

/**
 * Prefetch data for faster navigation
 */
export function prefetchQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  cacheTime = CACHE_TTL.LONG
): Promise<T> {
  return deduplicatedFetch(queryKey, queryFn, { ttl: cacheTime });
}

// ============================================
// Cache Invalidation
// ============================================

/**
 * Invalidate queries matching a pattern
 */
export function invalidateQueries(pattern: string): void {
  // Clear from both caches
  apiCache.delete?.(pattern);
}
