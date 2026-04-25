'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { LazyLoad, LazyPlaceholder, LazyCardPlaceholder } from './lazy-load';

// ============================================
// Dynamic Import with Loading
// ============================================

/**
 * Create a dynamically imported component with automatic loading state
 */
export function createDynamicComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: React.ReactNode;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFn, {
    loading: () => <>{options.loading || <LazyPlaceholder />}</>,
    ssr: options.ssr ?? false,
  });
}

// ============================================
// Lazy Section Wrapper
// ============================================

interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Wrapper for lazy loading sections that are below the fold
 */
export function LazySection({
  children,
  className,
  placeholder = <LazyPlaceholder />,
  threshold = 0.1,
  rootMargin = '200px',
}: LazySectionProps) {
  return (
    <LazyLoad
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
      placeholder={placeholder}
    >
      {children}
    </LazyLoad>
  );
}

// ============================================
// Lazy Grid Wrapper
// ============================================

interface LazyGridProps {
  children: React.ReactNode;
  className?: string;
  cardCount?: number;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Wrapper for lazy loading grid sections with card placeholders
 */
export function LazyGrid({
  children,
  className,
  cardCount = 3,
  threshold = 0.1,
  rootMargin = '200px',
}: LazyGridProps) {
  return (
    <LazyLoad
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
      placeholder={<LazyCardPlaceholder count={cardCount} />}
    >
      {children}
    </LazyLoad>
  );
}

// ============================================
// Pre-configured Lazy Components
// ============================================

// Note: Add lazy-loaded components here as needed
// Example patterns:

// import dynamic from 'next/dynamic';

// export const LazyChatWidget = dynamic(
//   () => import('@/components/chat/chat-widget').then((mod) => mod.ChatWidget),
//   {
//     loading: () => null,
//     ssr: false,
//   }
// );

// export const LazyTestimonialsSection = dynamic(
//   () => import('@/components/testimonials-section').then((mod) => mod.TestimonialsSection),
//   {
//     loading: () => <LazyCardPlaceholder count={3} />,
//     ssr: false,
//   }
// );
