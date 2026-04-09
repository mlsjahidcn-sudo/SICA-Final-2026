"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  IconFileText,
  IconPlus,
  IconTrash,
  IconEdit,
  IconStar,
  IconStarFilled,
  IconCopy,
  IconLoader2,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import { toast } from "sonner"

export interface ApplicationTemplate {
  id: string
  name: string
  description: string | null
  personal_statement: string | null
  study_plan: string | null
  is_default: boolean
  use_count: number
  created_at: string
  updated_at: string
}

interface TemplateManagerProps {
  onSelectTemplate?: (template: ApplicationTemplate) => void
  showSelectButton?: boolean
  compact?: boolean
}

export function TemplateManager({ 
  onSelectTemplate, 
  showSelectButton = false,
  compact = false 
}: TemplateManagerProps) {
  const [templates, setTemplates] = React.useState<ApplicationTemplate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showDialog, setShowDialog] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<ApplicationTemplate | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    personal_statement: "",
    study_plan: "",
    is_default: false,
  })

  const fetchTemplates = React.useCallback(async () => {
    try {
      const response = await fetch('/api/student/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleOpenDialog = (template?: ApplicationTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        description: template.description || "",
        personal_statement: template.personal_statement || "",
        study_plan: template.study_plan || "",
        is_default: template.is_default,
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: "",
        description: "",
        personal_statement: "",
        study_plan: "",
        is_default: false,
      })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required")
      return
    }

    setSaving(true)
    try {
      const url = editingTemplate 
        ? `/api/student/templates/${editingTemplate.id}`
        : '/api/student/templates'
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingTemplate ? "Template updated" : "Template created")
        setShowDialog(false)
        fetchTemplates()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save template")
      }
    } catch (error) {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/student/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Template deleted")
        setTemplates(prev => prev.filter(t => t.id !== id))
      } else {
        toast.error("Failed to delete template")
      }
    } catch (error) {
      toast.error("Failed to delete template")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string, isDefault: boolean) => {
    try {
      const response = await fetch(`/api/student/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: isDefault }),
      })

      if (response.ok) {
        toast.success(isDefault ? "Set as default template" : "Removed default")
        fetchTemplates()
      }
    } catch (error) {
      toast.error("Failed to update template")
    }
  }

  const handleSelectTemplate = async (template: ApplicationTemplate) => {
    // Increment use count
    try {
      await fetch(`/api/student/templates/${template.id}`, { method: 'PATCH' })
    } catch (error) {
      // Ignore error
    }

    onSelectTemplate?.(template)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Templates</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No templates yet. Create one to reuse your content.
            </p>
          ) : (
            templates.slice(0, 3).map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  {template.is_default && (
                    <IconStarFilled className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                {showSelectButton && (
                  <Button size="sm" variant="ghost">
                    Use
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Templates</CardTitle>
              <CardDescription>
                Save your personal statement and study plan as templates for future applications
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <IconFileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a template to reuse your personal statement and study plan
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <IconPlus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {template.is_default ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconFileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h4 className="font-medium">{template.name}</h4>
                    </div>
                    {template.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>Used {template.use_count} times</span>
                    <span>•</span>
                    <span>Updated {formatDate(template.updated_at)}</span>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2 mb-3">
                    {template.personal_statement && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-2">
                        <span className="font-medium">PS:</span> {template.personal_statement.substring(0, 100)}...
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {showSelectButton && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <IconCheck className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <IconEdit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleSetDefault(template.id, !template.is_default)}
                    >
                      {template.is_default ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconTrash className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Save your personal statement and study plan as a reusable template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Master's Application Template"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Set as default template</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
              />
            </div>

            <div>
              <Label htmlFor="personal_statement">Personal Statement</Label>
              <Textarea
                id="personal_statement"
                rows={6}
                value={formData.personal_statement}
                onChange={(e) => setFormData(prev => ({ ...prev, personal_statement: e.target.value }))}
                placeholder="Write your personal statement template..."
              />
            </div>

            <div>
              <Label htmlFor="study_plan">Study Plan</Label>
              <Textarea
                id="study_plan"
                rows={6}
                value={formData.study_plan}
                onChange={(e) => setFormData(prev => ({ ...prev, study_plan: e.target.value }))}
                placeholder="Write your study plan template..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Quick "Save as Template" button for forms
export function SaveAsTemplateButton({
  personalStatement,
  studyPlan,
  onSave,
}: {
  personalStatement?: string
  studyPlan?: string
  onSave?: () => void
}) {
  const [showDialog, setShowDialog] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name")
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/student/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          personal_statement: personalStatement,
          study_plan: studyPlan,
        }),
      })

      if (response.ok) {
        toast.success("Template saved!")
        setShowDialog(false)
        onSave?.()
      } else {
        toast.error("Failed to save template")
      }
    } catch (error) {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={!personalStatement && !studyPlan}
      >
        <IconCopy className="h-4 w-4 mr-2" />
        Save as Template
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current content as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Master's Application"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
