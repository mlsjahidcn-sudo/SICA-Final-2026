import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Animation variant
   * @default "pulse"
   */
  animation?: "pulse" | "shimmer" | "wave" | "none"
}

function Skeleton({ className, animation = "pulse", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        animation === "pulse" && "animate-pulse",
        animation === "shimmer" && "animate-shimmer",
        animation === "wave" && "animate-wave",
        className
      )}
      {...props}
    >
      {animation === "shimmer" && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  )
}

// Pre-built skeleton patterns

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && "w-3/4")}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return <Skeleton className={cn("rounded-full", sizes[size], className)} />
}

function SkeletonImage({
  aspectRatio = "16/9",
  className,
}: {
  aspectRatio?: string
  className?: string
}) {
  return (
    <Skeleton
      className={cn("w-full", className)}
      style={{ aspectRatio }}
    />
  )
}

function SkeletonButton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  }

  return <Skeleton className={cn("rounded-md", sizes[size], className)} />
}

function SkeletonInput({
  className,
}: {
  className?: string
}) {
  return <Skeleton className={cn("h-10 w-full rounded-md", className)} />
}

function SkeletonCard({
  showHeader = true,
  showFooter = false,
  lines = 3,
  className,
}: {
  showHeader?: boolean
  showFooter?: boolean
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      {showHeader && (
        <div className="mb-4 flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
      {showFooter && (
        <div className="mt-4 flex items-center justify-between">
          <SkeletonButton size="sm" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border", className)}>
      {showHeader && (
        <div className="flex gap-4 border-b bg-muted/50 p-4">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 && "w-12 flex-none"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonList({
  items = 5,
  showAvatar = true,
  className,
}: {
  items?: number
  showAvatar?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonStat({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

function SkeletonStats({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <SkeletonStat />
        </div>
      ))}
    </div>
  )
}

function SkeletonForm({
  fields = 4,
  showButtons = true,
  className,
}: {
  fields?: number
  showButtons?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <SkeletonInput />
        </div>
      ))}
      {showButtons && (
        <div className="flex gap-3 pt-4">
          <SkeletonButton size="md" />
          <SkeletonButton size="md" />
        </div>
      )}
    </div>
  )
}

function SkeletonSidebar({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("w-64 space-y-6 p-4", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Navigation */}
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
      {/* User */}
      <div className="flex items-center gap-3 pt-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonButton,
  SkeletonInput,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonStat,
  SkeletonStats,
  SkeletonForm,
  SkeletonSidebar,
}
