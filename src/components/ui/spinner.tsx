import { cn } from "@/lib/utils"
import { IconLoader, IconLoader2, IconLoader3 } from "@tabler/icons-react"

export interface SpinnerProps extends React.ComponentProps<"svg"> {
  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "primary" | "muted" | "destructive"
  /**
   * Loading text for accessibility
   */
  label?: string
}

const spinnerSizes = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
}

const spinnerVariants = {
  default: "text-foreground",
  primary: "text-primary",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
}

function Spinner({
  size = "md",
  variant = "default",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <IconLoader2
      role="status"
      aria-label={label}
      className={cn(
        "animate-spin",
        spinnerSizes[size],
        spinnerVariants[variant],
        className
      )}
      {...props}
    />
  )
}

// Dots Spinner - Alternative animated dots
export interface DotsSpinnerProps {
  /**
   * Size of the dots
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "primary" | "muted"
  /**
   * Loading text for accessibility
   */
  label?: string
  /**
   * Additional class name
   */
  className?: string
}

const dotSizes = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
}

const dotVariants = {
  default: "bg-foreground",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
}

function DotsSpinner({
  size = "md",
  variant = "default",
  label = "Loading",
  className,
}: DotsSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center gap-1", className)}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-bounce",
            dotSizes[size],
            dotVariants[variant]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Pulse Spinner - Pulsating circle
export interface PulseSpinnerProps {
  /**
   * Size of the pulse
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl"
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "muted"
  /**
   * Loading text for accessibility
   */
  label?: string
  /**
   * Additional class name
   */
  className?: string
}

const pulseSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const pulseVariants = {
  default: "bg-foreground",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
}

function PulseSpinner({
  size = "md",
  variant = "primary",
  label = "Loading",
  className,
}: PulseSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("relative", pulseSizes[size], className)}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-75",
          pulseVariants[variant]
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full animate-pulse",
          pulseVariants[variant]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Ring Spinner - Rotating ring
export interface RingSpinnerProps {
  /**
   * Size of the ring
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl"
  /**
   * Thickness of the ring
   * @default 2
   */
  thickness?: number
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "muted" | "destructive"
  /**
   * Loading text for accessibility
   */
  label?: string
  /**
   * Additional class name
   */
  className?: string
}

const ringSizes = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
}

const ringColors = {
  default: "border-foreground",
  primary: "border-primary",
  muted: "border-muted-foreground",
  destructive: "border-destructive",
}

function RingSpinner({
  size = "md",
  thickness = 2,
  variant = "primary",
  label = "Loading",
  className,
}: RingSpinnerProps) {
  const dimension = ringSizes[size]

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("relative", className)}
      style={{ width: dimension, height: dimension }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full border-transparent",
          ringColors[variant]
        )}
        style={{
          borderWidth: thickness,
          borderTopColor: "currentColor",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Loading Button - Button with inline spinner
export interface LoadingButtonProps {
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Button text
   */
  children: React.ReactNode
  /**
   * Spinner size
   * @default "sm"
   */
  spinnerSize?: SpinnerProps["size"]
  /**
   * Additional class name
   */
  className?: string
}

function LoadingButton({
  loading = false,
  children,
  spinnerSize = "sm",
  className,
}: LoadingButtonProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {loading && <Spinner size={spinnerSize} />}
      {children}
    </span>
  )
}

export {
  Spinner,
  DotsSpinner,
  PulseSpinner,
  RingSpinner,
  LoadingButton,
}
