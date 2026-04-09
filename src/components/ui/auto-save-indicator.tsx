"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  IconLoader2,
  IconDeviceFloppy,
  IconCheck,
  IconAlertCircle,
  IconCloud,
} from "@tabler/icons-react"
import type { SaveStatus } from "@/hooks/use-auto-save"

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSaved: Date | null
  className?: string
  showTimestamp?: boolean
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className,
  showTimestamp = true,
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'just now'
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }
    
    // More than 24 hours
    return date.toLocaleDateString()
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {status === 'idle' && lastSaved && showTimestamp && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <IconCloud className="h-3.5 w-3.5" />
          <span>Saved {formatTime(lastSaved)}</span>
        </div>
      )}
      
      {status === 'saving' && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
      
      {status === 'saved' && (
        <div className="flex items-center gap-1.5 text-green-600">
          <IconCheck className="h-3.5 w-3.5" />
          <span>Saved</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-1.5 text-destructive">
          <IconAlertCircle className="h-3.5 w-3.5" />
          <span>Save failed</span>
        </div>
      )}
    </div>
  )
}

// Compact version for tight spaces
export function AutoSaveIndicatorCompact({
  status,
  lastSaved,
  className,
}: AutoSaveIndicatorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {status === 'idle' && lastSaved && (
        <IconDeviceFloppy className="h-4 w-4 text-muted-foreground" />
      )}
      
      {status === 'saving' && (
        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      
      {status === 'saved' && (
        <IconCheck className="h-4 w-4 text-green-600" />
      )}
      
      {status === 'error' && (
        <IconAlertCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  )
}
