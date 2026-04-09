"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconArrowLeft,
  IconSchool,
  IconLoader2,
  IconDeviceFloppy,
  IconCalendar,
  IconCheck,
  IconAlertCircle
} from "@tabler/icons-react"
import { useAutosave, AutosaveStatus } from "@/hooks/use-autosave"
import { toast } from "sonner"

interface ProgramInfo {
  id: string
  name_en: string
  name_cn?: string
  degree_type: string
  intake_months?: string[]
  universities?: {
    name_en: string
    city?: string
  }
}

export default function EditApplicationPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [fetching, setFetching] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    personal_statement: "",
    study_plan: "",
    intake: "",
  })
  const [program, setProgram] = React.useState<ProgramInfo | null>(null)
  const [status, setStatus] = React.useState<string>("draft")

  // Autosave hook
  const autosave = useAutosave({
    applicationId,
    delay: 2000, // 2 seconds debounce
    onSave: () => {
      // Silent success - status indicator will show
    },
    onError: (error) => {
      toast.error("Failed to autosave: " + error)
    },
  })

  // Fetch application data
  React.useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await fetch(`/api/student/applications/${applicationId}`)
        if (response.ok) {
          const data = await response.json()
          setFormData({
            personal_statement: data.application.personal_statement || "",
            study_plan: data.application.study_plan || "",
            intake: data.application.intake || "",
          })
          setProgram(data.application.programs)
          setStatus(data.application.status)
        } else {
          // Mock data for development
          setProgram({
            id: "prog1",
            name_en: "Computer Science and Technology",
            name_cn: "计算机科学与技术",
            degree_type: "Master",
            intake_months: ["September 2024", "March 2025", "September 2025"],
            universities: { name_en: "Tsinghua University", city: "Beijing" }
          })
          setFormData({
            personal_statement: "I am passionate about computer science...",
            study_plan: "My research interests include machine learning...",
            intake: "September 2025",
          })
          setStatus("draft")
        }
      } catch (error) {
        console.error("Error fetching application:", error)
      } finally {
        setFetching(false)
      }
    }

    if (applicationId) fetchApplication()
  }, [applicationId])

  // Handle manual save (for Save button)
  const handleSave = async () => {
    setSaving(true)
    try {
      await autosave.saveNow(formData)
      toast.success("Application saved successfully!")
      router.push(`/student-v2/applications/${applicationId}`)
    } catch (error) {
      toast.error("Failed to save application")
    } finally {
      setSaving(false)
    }
  }

  // Handle field changes with autosave
  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    
    // Trigger autosave
    autosave.debouncedSave(newData)
  }

  // Check if form is valid for submission
  const isValid = formData.personal_statement.trim() && 
                  formData.study_plan.trim() && 
                  formData.intake

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <IconArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Application</h1>
          <p className="text-muted-foreground">Update your application details</p>
        </div>
        <div className="flex items-center gap-3">
          <AutosaveStatus 
            isSaving={autosave.isSaving}
            lastSavedAt={autosave.lastSavedAt}
            error={autosave.error}
            hasUnsavedChanges={autosave.hasUnsavedChanges}
          />
          <Button onClick={handleSave} disabled={saving || autosave.isSaving}>
            {saving ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Program Info */}
      {program && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <IconSchool className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{program.name_en}</p>
                  {program.name_cn && (
                    <p className="text-sm text-muted-foreground">{program.name_cn}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {program.universities?.name_en} • {program.degree_type}
                  </p>
                </div>
              </div>
              <Badge variant={status === "draft" ? "secondary" : "default"}>
                {status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intake Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Intake Selection
          </CardTitle>
          <CardDescription>Choose your preferred intake period</CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={formData.intake} 
            onValueChange={(value) => handleFieldChange("intake", value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select intake period" />
            </SelectTrigger>
            <SelectContent>
              {program?.intake_months?.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              )) || (
                <>
                  <SelectItem value="September 2024">September 2024</SelectItem>
                  <SelectItem value="March 2025">March 2025</SelectItem>
                  <SelectItem value="September 2025">September 2025</SelectItem>
                  <SelectItem value="March 2026">March 2026</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Details</CardTitle>
          <CardDescription>
            Write your personal statement and study plan. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Personal Statement *</Label>
              <span className="text-xs text-muted-foreground">
                {formData.personal_statement.length} characters
              </span>
            </div>
            <Textarea
              rows={8}
              value={formData.personal_statement}
              onChange={(e) => handleFieldChange("personal_statement", e.target.value)}
              placeholder="Tell us about yourself, your background, achievements, and why you want to study this program..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 200 characters recommended
            </p>
          </div>
          
          <Separator />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Study Plan *</Label>
              <span className="text-xs text-muted-foreground">
                {formData.study_plan.length} characters
              </span>
            </div>
            <Textarea
              rows={8}
              value={formData.study_plan}
              onChange={(e) => handleFieldChange("study_plan", e.target.value)}
              placeholder="Describe your academic goals, research interests, and how this program will help you achieve them..."
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 200 characters recommended
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className={isValid ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {isValid ? (
              <IconCheck className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <IconAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${isValid ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}`}>
                {isValid ? "Ready for Submission" : "Incomplete Application"}
              </p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li className={formData.personal_statement.trim() ? "text-green-600" : "text-yellow-600"}>
                  {formData.personal_statement.trim() ? "✓" : "○"} Personal statement
                </li>
                <li className={formData.study_plan.trim() ? "text-green-600" : "text-yellow-600"}>
                  {formData.study_plan.trim() ? "✓" : "○"} Study plan
                </li>
                <li className={formData.intake ? "text-green-600" : "text-yellow-600"}>
                  {formData.intake ? "✓" : "○"} Intake selection
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving || autosave.isSaving}
        >
          {saving ? (
            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
          )}
          Save & Continue
        </Button>
      </div>
    </div>
  )
}
