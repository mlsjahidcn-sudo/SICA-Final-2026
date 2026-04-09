"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IconRestore, IconTrash } from "@tabler/icons-react"

interface DraftRecoveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecover: () => void
  onDiscard: () => void
  draftTimestamp?: Date | null
}

export function DraftRecoveryDialog({
  open,
  onOpenChange,
  onRecover,
  onDiscard,
  draftTimestamp,
}: DraftRecoveryDialogProps) {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recover Draft?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                We found an unsaved draft of this form. Would you like to recover it?
              </p>
              {draftTimestamp && (
                <p className="text-sm text-muted-foreground">
                  Last saved: {formatTimestamp(draftTimestamp)}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="gap-2">
            <IconTrash className="h-4 w-4" />
            Discard Draft
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRecover} className="gap-2">
            <IconRestore className="h-4 w-4" />
            Recover Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
