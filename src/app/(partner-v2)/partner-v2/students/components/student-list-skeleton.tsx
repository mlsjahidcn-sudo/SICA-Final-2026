'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for student list
 */
export function StudentListSkeleton() {
  return (
    <Card>
      {/* Table Header Skeleton */}
      <div className="hidden md:grid md:grid-cols-[auto_2fr_1.5fr_1fr_0.8fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b bg-muted/50">
        <Checkbox disabled />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-[72px]" />
      </div>
      
      {/* Rows Skeleton */}
      <div className="divide-y">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[auto_2fr_1.5fr_1fr_0.8fr_1fr_1fr_auto] items-center gap-2 md:gap-4 px-4 py-3"
          >
            <div className="hidden md:block">
              <Checkbox disabled />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for student detail page
 */
export function StudentDetailSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 lg:px-6 pb-6">
        <Skeleton className="h-10 w-full mb-4" />
        <Card>
          <CardContent className="pt-6 space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/**
 * Empty state for student list
 */
export function EmptyStudentList({ hasSearch }: { hasSearch?: boolean }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="mx-auto max-w-sm">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {hasSearch ? 'No students found' : 'No students yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {hasSearch
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by adding your first student to the system.'}
          </p>
          {!hasSearch && (
            <div className="flex justify-center">
              <a
                href="/partner-v2/students/new"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Add Your First Student
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
