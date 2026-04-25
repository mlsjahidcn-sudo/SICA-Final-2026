"use client"

import * as React from "react"

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveOptions<T> {
  /** Data to auto-save */
  data: T
  /** Unique key for storing the draft */
  storageKey: string
  /** Debounce delay in milliseconds (default: 2000ms) */
  debounceMs?: number
  /** Whether auto-save is enabled */
  enabled?: boolean
  /** Callback when data is saved (for remote save) */
  onSave?: (data: T) => Promise<void>
  /** Callback when draft is recovered */
  onRecover?: (data: T) => void
}

interface AutoSaveReturn<T> {
  /** Current save status */
  status: SaveStatus
  /** Last saved timestamp */
  lastSaved: Date | null
  /** Manually trigger save */
  save: () => Promise<void>
  /** Clear saved draft */
  clearDraft: () => void
  /** Check if there's a draft to recover */
  hasDraft: boolean
  /** Recover draft data */
  recoverDraft: () => T | null
  /** Discard draft */
  discardDraft: () => void
}

const STORAGE_PREFIX = 'sica_draft_'

export function useAutoSave<T>({
  data,
  storageKey,
  debounceMs = 2000,
  enabled = true,
  onSave,
  onRecover,
}: AutoSaveOptions<T>): AutoSaveReturn<T> {
  const [status, setStatus] = React.useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [hasDraft, setHasDraft] = React.useState(false)
  
  const fullKey = `${STORAGE_PREFIX}${storageKey}`
  const dataRef = React.useRef(data)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Update data ref when data changes
  React.useEffect(() => {
    dataRef.current = data
  }, [data])

  // Check for existing draft on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(fullKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.data && parsed.timestamp) {
          setHasDraft(true)
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, [fullKey])

  // Save to localStorage
  const saveToStorage = React.useCallback((dataToSave: T) => {
    const payload = {
      data: dataToSave,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(fullKey, JSON.stringify(payload))
    setLastSaved(new Date())
    setHasDraft(true)
  }, [fullKey])

  // Clear draft
  const clearDraft = React.useCallback(() => {
    localStorage.removeItem(fullKey)
    setHasDraft(false)
    setLastSaved(null)
  }, [fullKey])

  // Recover draft
  const recoverDraft = React.useCallback((): T | null => {
    const saved = localStorage.getItem(fullKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.data) {
          onRecover?.(parsed.data)
          return parsed.data
        }
      } catch {
        // Invalid data
      }
    }
    return null
  }, [fullKey, onRecover])

  // Discard draft
  const discardDraft = React.useCallback(() => {
    clearDraft()
  }, [clearDraft])

  // Main save function
  const save = React.useCallback(async () => {
    if (!enabled) return

    setStatus('saving')
    try {
      // Save to localStorage first (always)
      saveToStorage(dataRef.current)
      
      // If remote save callback provided, call it
      if (onSave) {
        await onSave(dataRef.current)
      }
      
      setStatus('saved')
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setStatus('error')
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 5000)
    }
  }, [enabled, saveToStorage, onSave])

  // Debounced auto-save
  React.useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, debounceMs, save])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    lastSaved,
    save,
    clearDraft,
    hasDraft,
    recoverDraft,
    discardDraft,
  }
}

// Utility function to check for draft
export function hasStoredDraft(storageKey: string): boolean {
  const fullKey = `${STORAGE_PREFIX}${storageKey}`
  const saved = localStorage.getItem(fullKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return !!(parsed.data && parsed.timestamp)
    } catch {
      return false
    }
  }
  return false
}

// Utility function to get draft timestamp
export function getDraftTimestamp(storageKey: string): Date | null {
  const fullKey = `${STORAGE_PREFIX}${storageKey}`
  const saved = localStorage.getItem(fullKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.timestamp) {
        return new Date(parsed.timestamp)
      }
    } catch {
      return null
    }
  }
  return null
}
