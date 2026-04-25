"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { IconTrash, IconUserOff } from "@tabler/icons-react"
import { toast } from "sonner"

interface DeleteStudentDialogProps {
  studentId: string
  studentName: string
  hasApplications?: boolean
  onStudentDeleted?: () => void
  trigger?: React.ReactNode
}

export function DeleteStudentDialog({ 
  studentId, 
  studentName, 
  hasApplications = false,
  onStudentDeleted,
  trigger 
}: DeleteStudentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student')
      }

      if (data.action === 'deactivated') {
        toast.success('Student deactivated (has applications)')
      } else {
        toast.success('Student deleted successfully')
      }
      
      setOpen(false)
      onStudentDeleted?.()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete student')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasApplications ? 'Deactivate Student' : 'Delete Student'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasApplications ? (
              <>
                <strong>{studentName}</strong> has existing applications and cannot be permanently deleted.
                Would you like to deactivate their account instead? They will not be able to log in.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{studentName}</strong>? This action cannot be undone.
                All student data will be permanently removed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasApplications ? (
              <>
                <IconUserOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
