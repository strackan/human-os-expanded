/**
 * Skeleton Loader Components
 *
 * Provides skeleton loading states for various content types
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

/**
 * Base skeleton element
 */
export function Skeleton({ className, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-gray-700/30 rounded', className)}
      aria-label={ariaLabel || 'Loading...'}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Skeleton for assessment results page
 */
export function ResultsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6" role="status" aria-label="Loading results">
      {/* Header */}
      <div className="mb-12 text-center">
        <Skeleton className="h-12 w-64 mx-auto mb-4" aria-label="Loading title" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" aria-label="Loading subtitle" />
        <Skeleton className="h-8 w-32 mx-auto" aria-label="Loading score" />
      </div>

      {/* Personality Profile Card */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div>
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6"
          >
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mx-auto" />
          </div>
        ))}
      </div>

      {/* Dimension Breakdown */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
        <Skeleton className="h-8 w-56 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading your assessment results</span>
    </div>
  );
}

/**
 * Skeleton for question card
 */
export function QuestionSkeleton() {
  return (
    <div
      className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8"
      role="status"
      aria-label="Loading question"
    >
      <Skeleton className="h-7 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-6" />
      <Skeleton className="h-32 w-full mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <span className="sr-only">Loading question</span>
    </div>
  );
}

/**
 * Skeleton for assessment start page
 */
export function AssessmentStartSkeleton() {
  return (
    <div className="max-w-2xl w-full" role="status" aria-label="Loading assessment">
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8" />

        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-6" />

        <Skeleton className="h-12 w-full" />
      </div>
      <span className="sr-only">Loading assessment start page</span>
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function ListItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading list items</span>
    </div>
  );
}

/**
 * Skeleton for cards grid
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6"
        >
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading cards</span>
    </div>
  );
}

/**
 * Inline skeleton for loading within text
 */
export function InlineSkeleton({ width = '100px' }: { width?: string }) {
  return (
    <span
      className="inline-block animate-pulse bg-gray-700/30 rounded"
      style={{ width, height: '1em', verticalAlign: 'middle' }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </span>
  );
}
