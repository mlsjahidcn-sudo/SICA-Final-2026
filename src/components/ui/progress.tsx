"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Progress variants with different colors
const progressVariants = {
  default: "bg-primary",
  success: "bg-green-500 dark:bg-green-400",
  warning: "bg-yellow-500 dark:bg-yellow-400",
  error: "bg-red-500 dark:bg-red-400",
  info: "bg-blue-500 dark:bg-blue-400",
} as const

// Progress sizes
const progressSizes = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
  xl: "h-4",
} as const

type ProgressVariant = keyof typeof progressVariants
type ProgressSize = keyof typeof progressSizes

export interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  /**
   * The variant of the progress bar
   * @default "default"
   */
  variant?: ProgressVariant
  /**
   * The size of the progress bar
   * @default "md"
   */
  size?: ProgressSize
  /**
   * Show striped pattern on the progress bar
   * @default false
   */
  striped?: boolean
  /**
   * Animate the striped pattern
   * @default false
   */
  animated?: boolean
  /**
   * Show indeterminate loading state
   * @default false
   */
  indeterminate?: boolean
  /**
   * Label to display above the progress bar
   */
  label?: string
  /**
   * Show the current value next to the label
   * @default false
   */
  showValue?: boolean
  /**
   * Custom format for the value display
   */
  valueFormat?: (value: number | undefined) => string
}

function Progress({
  className,
  value,
  variant = "default",
  size = "md",
  striped = false,
  animated = false,
  indeterminate = false,
  label,
  showValue = false,
  valueFormat,
  ...props
}: ProgressProps) {
  const safeValue = value ?? undefined
  const formattedValue = valueFormat ? valueFormat(safeValue) : safeValue !== undefined ? `${Math.round(safeValue)}%` : ""

  return (
    <div className="w-full">
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-muted-foreground">{formattedValue}</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          progressSizes[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "size-full flex-1 transition-all duration-300 ease-in-out",
            progressVariants[variant],
            // Striped pattern
            striped && "relative overflow-hidden",
            // Indeterminate animation
            indeterminate && "animate-indeterminate w-1/3",
            // Animated stripes
            animated && striped && "animate-stripes"
          )}
          style={
            striped && !indeterminate
              ? {
                  transform: `translateX(-${100 - (value || 0)}%)`,
                  backgroundImage:
                    "linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)",
                  backgroundSize: "1rem 1rem",
                }
              : indeterminate
              ? undefined
              : { transform: `translateX(-${100 - (value || 0)}%)` }
          }
        />
      </ProgressPrimitive.Root>
    </div>
  )
}

// Circular Progress Component
export interface CircularProgressProps {
  /**
   * The value of the progress (0-100)
   */
  value?: number
  /**
   * The size of the circular progress
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl"
  /**
   * The variant of the progress
   * @default "default"
   */
  variant?: ProgressVariant
  /**
   * Thickness of the progress ring
   * @default 4
   */
  thickness?: number
  /**
   * Show the value in the center
   * @default false
   */
  showValue?: boolean
  /**
   * Custom content in the center
   */
  children?: React.ReactNode
  /**
   * Additional class name
   */
  className?: string
}

const circularSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
}

const circularTextSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
}

function CircularProgress({
  value = 0,
  size = "md",
  variant = "default",
  thickness = 4,
  showValue = false,
  children,
  className,
}: CircularProgressProps) {
  const radius = 50 - thickness / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const colorMap = {
    default: "text-primary",
    success: "text-green-500 dark:text-green-400",
    warning: "text-yellow-500 dark:text-yellow-400",
    error: "text-red-500 dark:text-red-400",
    info: "text-blue-500 dark:text-blue-400",
  }

  return (
    <div className={cn("relative inline-flex", circularSizes[size], className)}>
      <svg className="transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="text-muted"
          strokeWidth={thickness}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className={cn(
            "transition-all duration-300 ease-in-out",
            colorMap[variant]
          )}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      {/* Center content */}
      {(showValue || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <span className={cn("font-medium", circularTextSizes[size])}>
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { Progress, CircularProgress }
