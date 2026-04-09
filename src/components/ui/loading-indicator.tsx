"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"

export interface LoadingIndicatorProps {
  /**
   * Loading state
   * @default true
   */
  loading?: boolean
  /**
   * Visual variant
   * @default "spinner"
   */
  variant?: "spinner" | "progress" | "dots" | "skeleton" | "overlay"
  /**
   * Loading message to display
   */
  message?: string
  /**
   * Progress value (0-100) for progress variant
   */
  progress?: number
  /**
   * Show progress bar with indeterminate state
   * @default false
   */
  indeterminate?: boolean
  /**
   * Full page overlay mode
   * @default false
   */
  fullPage?: boolean
  /**
   * Blur background content
   * @default true
   */
  blur?: boolean
  /**
   * Additional class name
   */
  className?: string
  /**
   * Children to show when not loading
   */
  children?: React.ReactNode
}

function LoadingIndicator({
  loading = true,
  variant = "spinner",
  message,
  progress,
  indeterminate = false,
  fullPage = false,
  blur = true,
  className,
  children,
}: LoadingIndicatorProps) {
  if (!loading && children) {
    return <>{children}</>
  }

  if (!loading) {
    return null
  }

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullPage ? "min-h-screen" : "min-h-[200px]",
        className
      )}
    >
      {variant === "spinner" && (
        <>
          <Spinner size="lg" variant="primary" />
          {message && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {message}
            </p>
          )}
        </>
      )}

      {variant === "progress" && (
        <div className="w-full max-w-sm space-y-2">
          {message && (
            <p className="text-sm font-medium text-foreground">{message}</p>
          )}
          <Progress
            value={progress}
            indeterminate={indeterminate || progress === undefined}
            showValue={!indeterminate && progress !== undefined}
          />
        </div>
      )}

      {variant === "dots" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      )}

      {variant === "skeleton" && (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground text-center">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80",
          blur && "backdrop-blur-sm"
        )}
      >
        {content}
      </div>
    )
  }

  return content
}

// Overlay Loading - Shows overlay on top of content
export interface LoadingOverlayProps {
  /**
   * Loading state
   */
  loading: boolean
  /**
   * Loading message
   */
  message?: string
  /**
   * Blur background content
   * @default true
   */
  blur?: boolean
  /**
   * Spinner size
   * @default "lg"
   */
  spinnerSize?: "sm" | "md" | "lg" | "xl"
  /**
   * Additional class name for overlay
   */
  className?: string
  /**
   * Content to overlay
   */
  children: React.ReactNode
}

function LoadingOverlay({
  loading,
  message,
  blur = true,
  spinnerSize = "lg",
  className,
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 transition-opacity",
            blur && "backdrop-blur-sm",
            className
          )}
        >
          <Spinner size={spinnerSize} variant="primary" />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Page Loading - Full page loading with fade animation
export interface PageLoadingProps {
  /**
   * Loading state
   */
  loading: boolean
  /**
   * Loading message
   * @default "Loading..."
   */
  message?: string
  /**
   * Show progress bar
   * @default false
   */
  showProgress?: boolean
  /**
   * Progress value
   */
  progress?: number
  /**
   * Additional class name
   */
  className?: string
}

function PageLoading({
  loading,
  message = "Loading...",
  showProgress = false,
  progress,
  className,
}: PageLoadingProps) {
  if (!loading) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-300",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo or Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <div className="h-6 w-6 rounded bg-primary-foreground/20 animate-pulse" />
          </div>
          <span className="text-2xl font-bold text-foreground">SICA</span>
        </div>

        {/* Spinner */}
        <Spinner size="xl" variant="primary" />

        {/* Message */}
        <p className="text-muted-foreground animate-pulse">{message}</p>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48">
            <Progress
              value={progress}
              indeterminate={progress === undefined}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Loading - For buttons and small areas
export interface InlineLoadingProps {
  /**
   * Loading state
   */
  loading: boolean
  /**
   * Text to show when loading
   */
  loadingText?: string
  /**
   * Text to show when not loading
   */
  text?: string
  /**
   * Spinner size
   * @default "sm"
   */
  spinnerSize?: "xs" | "sm" | "md"
  /**
   * Additional class name
   */
  className?: string
}

function InlineLoading({
  loading,
  loadingText = "Loading...",
  text,
  spinnerSize = "sm",
  className,
}: InlineLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {loading && <Spinner size={spinnerSize} />}
      <span>{loading ? loadingText : text}</span>
    </span>
  )
}

// Section Loading - For content sections
export interface SectionLoadingProps {
  /**
   * Loading state
   */
  loading: boolean
  /**
   * Number of skeleton rows
   * @default 3
   */
  rows?: number
  /**
   * Show card wrapper
   * @default false
   */
  showCard?: boolean
  /**
   * Additional class name
   */
  className?: string
  /**
   * Content to show when loaded
   */
  children: React.ReactNode
}

function SectionLoading({
  loading,
  rows = 3,
  showCard = false,
  className,
  children,
}: SectionLoadingProps) {
  const content = loading ? (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded bg-muted animate-pulse",
            i === rows - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  ) : (
    children
  )

  if (showCard) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {content}
      </div>
    )
  }

  return <>{content}</>
}

export {
  LoadingIndicator,
  LoadingOverlay,
  PageLoading,
  InlineLoading,
  SectionLoading,
}
