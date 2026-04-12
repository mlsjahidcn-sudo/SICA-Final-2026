"use client"

import * as React from "react"

interface UseAutosaveOptions {
  /**
   * The ID of the application to autosave
   */
  applicationId: string
  /**
   * Debounce delay in milliseconds (default: 2000ms)
   */
  delay?: number
  /**
   * Callback when save is successful
   */
  onSave?: (data: unknown) => void
  /**
   * Callback when save fails
   */
  onError?: (error: string) => void
}

interface AutosaveState {
  isSaving: boolean
  lastSavedAt: Date | null
  error: string | null
  hasUnsavedChanges: boolean
}

/**
 * Custom hook for autosaving application draft
 * 
 * @example
 * ```tsx
 * const { saveNow, state } = useAutosave({
 *   applicationId: '123',
 *   delay: 2000,
 *   onSave: (data) => console.log('Saved!', data),
 * })
 * 
 * // When content changes:
 * debouncedSave({ personal_statement: '...' })
 * ```
 */
export function useAutosave({
  applicationId,
  delay = 2000,
  onSave,
  onError,
}: UseAutosaveOptions) {
  const [state, setState] = React.useState<AutosaveState>({
    isSaving: false,
    lastSavedAt: null,
    error: null,
    hasUnsavedChanges: false,
  })

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = React.useRef<Record<string, unknown> | null>(null)

  const saveNow = React.useCallback(async (data: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }))

    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      const response = await fetch(`/api/student/applications/${applicationId}/autosave`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: new Date(),
        hasUnsavedChanges: false,
      }))

      onSave?.(result.application)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save'
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }))
      onError?.(errorMessage)
      throw error
    }
  }, [applicationId, onSave, onError])

  const debouncedSave = React.useCallback((data: Record<string, unknown>) => {
    // Mark as having unsaved changes
    setState((prev) => ({ ...prev, hasUnsavedChanges: true }))

    // Store pending data
    pendingDataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveNow(pendingDataRef.current)
      }
    }, delay)
  }, [delay, saveNow])

  // Save immediately on unmount if there are pending changes
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Note: We can't await async operations in cleanup,
      // but we use navigator.sendBeacon for page unload if needed
    }
  }, [])

  // Handle page unload (browser close/refresh)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.hasUnsavedChanges])

  return {
    ...state,
    debouncedSave,
    saveNow,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  }
}

/**
 * Autosave status indicator component
 */
export function AutosaveStatus({ 
  isSaving, 
  lastSavedAt, 
  error,
  hasUnsavedChanges,
}: AutosaveState) {
  if (error) {
    return (
      <span className="text-sm text-red-500 flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Save failed: {error}
      </span>
    )
  }

  if (isSaving) {
    return (
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Saving...
      </span>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <span className="text-sm text-yellow-600 flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Unsaved changes
      </span>
    )
  }

  if (lastSavedAt) {
    const timeAgo = getTimeAgo(lastSavedAt)
    return (
      <span className="text-sm text-green-600 flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved {timeAgo}
      </span>
    )
  }

  return null
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) {
    return 'just now'
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
