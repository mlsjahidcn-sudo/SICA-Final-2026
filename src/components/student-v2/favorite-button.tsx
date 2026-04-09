"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconStar, IconStarFilled, IconLoader2 } from "@tabler/icons-react"
import { studentApi } from "@/lib/student-api"
import { toast } from "sonner"

interface FavoriteButtonProps {
  entityId: string
  entityType: "university" | "program"
  isFavorited?: boolean
  onFavoriteChange?: (isFavorited: boolean) => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
  className?: string
}

export function FavoriteButton({
  entityId,
  entityType,
  isFavorited: initialIsFavorited = false,
  onFavoriteChange,
  variant = "outline",
  size = "default",
  showText = true,
  className,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = React.useState(initialIsFavorited)
  const [loading, setLoading] = React.useState(false)

  // Check favorite status on mount
  const checkFavoriteStatus = React.useCallback(async () => {
    const { data } = await studentApi.checkFavorite(entityId, entityType)
    if (data) {
      setIsFavorited(data.is_favorited)
    }
  }, [entityId, entityType])

  React.useEffect(() => {
    checkFavoriteStatus()
  }, [checkFavoriteStatus])

  const handleToggleFavorite = async () => {
    setLoading(true)
    
    try {
      if (isFavorited) {
        const { error } = await studentApi.removeFavorite(entityId, entityType)
        if (error) {
          toast.error("Failed to remove from favorites")
        } else {
          setIsFavorited(false)
          onFavoriteChange?.(false)
          toast.success("Removed from favorites")
        }
      } else {
        const { error } = await studentApi.addFavorite(entityId, entityType)
        if (error) {
          toast.error("Failed to add to favorites")
        } else {
          setIsFavorited(true)
          onFavoriteChange?.(true)
          toast.success("Added to favorites")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : isFavorited ? (
        <IconStarFilled className="h-4 w-4 text-yellow-500" />
      ) : (
        <IconStar className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isFavorited ? "Saved" : "Save"}
        </span>
      )}
    </Button>
  )
}
