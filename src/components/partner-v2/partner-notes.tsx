"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconNotes,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconLock,
  IconWorld,
  IconDotsVertical,
  IconUser
} from "@tabler/icons-react"
import { toast } from "sonner"

export interface PartnerNote {
  id: string
  user_id: string
  application_id: string | null
  student_id: string | null
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
  author_name?: string
  author_email?: string
}

interface PartnerNotesProps {
  applicationId?: string
  studentId?: string
  currentUserId?: string
  compact?: boolean
}

export function PartnerNotes({ 
  applicationId, 
  studentId, 
  currentUserId,
  compact = false 
}: PartnerNotesProps) {
  const [notes, setNotes] = React.useState<PartnerNote[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showDialog, setShowDialog] = React.useState(false)
  const [editingNote, setEditingNote] = React.useState<PartnerNote | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    content: "",
    is_private: true,
  })

  const fetchNotes = React.useCallback(async () => {
    if (!applicationId && !studentId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (applicationId) params.set('application_id', applicationId)
      if (studentId) params.set('student_id', studentId)

      const response = await fetch(`/api/partner/notes?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }, [applicationId, studentId])

  React.useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleOpenDialog = (note?: PartnerNote) => {
    if (note) {
      setEditingNote(note)
      setFormData({
        content: note.content,
        is_private: note.is_private,
      })
    } else {
      setEditingNote(null)
      setFormData({
        content: "",
        is_private: true,
      })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.content.trim()) {
      toast.error("Please enter a note")
      return
    }

    setSaving(true)
    try {
      const url = editingNote 
        ? `/api/partner/notes/${editingNote.id}`
        : '/api/partner/notes'
      const method = editingNote ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        content: formData.content,
        is_private: formData.is_private,
      }
      if (!editingNote) {
        if (applicationId) body.application_id = applicationId
        if (studentId) body.student_id = studentId
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingNote ? "Note updated" : "Note added")
        setShowDialog(false)
        fetchNotes()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save note")
      }
    } catch (error) {
      toast.error("Failed to save note")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/partner/notes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Note deleted")
        setNotes(prev => prev.filter(n => n.id !== id))
      } else {
        toast.error("Failed to delete note")
      }
    } catch (error) {
      toast.error("Failed to delete note")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canModify = (note: PartnerNote) => {
    return note.user_id === currentUserId
  }

  // Compact version for sidebar or small spaces
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IconNotes className="h-4 w-4" />
              Notes ({notes.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <IconLoader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet
            </p>
          ) : (
            notes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                className="p-2 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 flex-1">{note.content}</p>
                  {note.is_private && (
                    <IconLock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(note.created_at)}
                </p>
              </div>
            ))
          )}
          {notes.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full">
              View all {notes.length} notes
            </Button>
          )}
        </CardContent>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Update your note" : "Add a private note about this application"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note here..."
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span className="text-sm">Private (only visible to partners and admins)</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingNote ? "Update" : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Full version
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconNotes className="h-5 w-5" />
              Partner Notes
            </CardTitle>
            <CardDescription>
              Private notes visible only to partners and administrators
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <IconNotes className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">
              Add notes to track important information about this application
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4 mr-2" />
              Add Your First Note
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Author and visibility */}
                    <div className="flex items-center gap-2 mb-2">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {note.author_name || "Unknown"}
                      </span>
                      <Badge variant={note.is_private ? "secondary" : "outline"} className="text-xs">
                        {note.is_private ? (
                          <>
                            <IconLock className="h-3 w-3 mr-1" />
                            Private
                          </>
                        ) : (
                          <>
                            <IconWorld className="h-3 w-3 mr-1" />
                            Shared
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Content */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {note.content}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && " (edited)"}
                    </p>
                  </div>

                  {/* Actions */}
                  {canModify(note) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(note)}>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600"
                          disabled={deletingId === note.id}
                        >
                          {deletingId === note.id ? (
                            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <IconTrash className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
            <DialogDescription>
              {editingNote ? "Update your note content" : "Add a note about this application or student"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Note Content</label>
              <Textarea
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note here... (e.g., 'Student seems very motivated, good fit for the program')"
                className="mt-2"
              />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                className="h-4 w-4 mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="is_private" className="text-sm font-medium cursor-pointer">
                  Private Note
                </label>
                <p className="text-xs text-muted-foreground">
                  Private notes are only visible to partners and administrators. 
                  Uncheck to make it visible to the student as well.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingNote ? "Update Note" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Quick note input component for inline use
export function QuickNoteInput({
  applicationId,
  studentId,
  onNoteAdded,
}: {
  applicationId?: string
  studentId?: string
  onNoteAdded?: () => void
}) {
  const [content, setContent] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!content.trim()) return

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        content: content.trim(),
        is_private: true,
      }
      if (applicationId) body.application_id = applicationId
      if (studentId) body.student_id = studentId

      const response = await fetch('/api/partner/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setContent("")
        toast.success("Note added")
        onNoteAdded?.()
      } else {
        toast.error("Failed to add note")
      }
    } catch (error) {
      toast.error("Failed to add note")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Quick note..."
        rows={1}
        className="min-h-9"
      />
      <Button 
        size="sm" 
        onClick={handleSave} 
        disabled={saving || !content.trim()}
      >
        {saving ? (
          <IconLoader2 className="h-4 w-4 animate-spin" />
        ) : (
          <IconPlus className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
