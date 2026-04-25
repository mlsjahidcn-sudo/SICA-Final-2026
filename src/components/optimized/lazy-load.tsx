'use client';

import { useState, useEffect, useRef, ComponentType, LazyExoticComponent, Suspense } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface LazyLoadProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  placeholder?: React.ReactNode;
  onVisible?: () => void;
}

interface LazyComponentProps<T> {
  component: LazyExoticComponent<ComponentType<T>>;
  props?: T;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
}

// ============================================
// Intersection Observer Hook
// ============================================

export function useLazyLoad(
  threshold = 0.1,
  rootMargin = '200px'
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return [ref, isVisible];
}

// ============================================
// Lazy Load Wrapper Component
// ============================================

export function LazyLoad({
  children,
  threshold = 0.1,
  rootMargin = '200px',
  className,
  placeholder,
  onVisible,
}: LazyLoadProps) {
  const [ref, isVisible] = useLazyLoad(threshold, rootMargin);

  useEffect(() => {
    if (isVisible && onVisible) {
      onVisible();
    }
  }, [isVisible, onVisible]);

  return (
    <div ref={ref} className={cn('min-h-[100px]', className)}>
      {isVisible ? children : placeholder}
    </div>
  );
}

// ============================================
// Lazy Component with Suspense
// ============================================

export function LazyComponent<T extends object>({
  component: LazyComponent,
  props,
  threshold = 0.1,
  rootMargin = '200px',
  placeholder,
  fallback,
}: LazyComponentProps<T>) {
  const [ref, isVisible] = useLazyLoad(threshold, rootMargin);

  return (
    <div ref={ref} className="min-h-[100px]">
      {isVisible ? (
        <Suspense fallback={fallback || placeholder || <LazyPlaceholder />}>
          <LazyComponent {...(props as T)} />
        </Suspense>
      ) : (
        placeholder || <LazyPlaceholder />
      )}
    </div>
  );
}

// ============================================
// Default Placeholder Components
// ============================================

export function LazyPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="h-40 bg-muted rounded-lg" />
    </div>
  );
}

export function LazyCardPlaceholder({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function LazyListPlaceholder({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4">
          <div className="h-16 w-16 bg-muted rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Preload Utility
// ============================================

/**
 * Preload a lazy component when user hovers over a trigger element
 */
export function usePreloadOnHover() {
  const preloadRef = useRef<(() => void) | null>(null);

  const setPreload = (preloadFn: () => void) => {
    preloadRef.current = preloadFn;
  };

  const handleMouseEnter = () => {
    if (preloadRef.current) {
      preloadRef.current();
    }
  };

  return { setPreload, handleMouseEnter };
}
