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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
  IconAlertCircle,
  IconMapPin,
  IconClock,
  IconCash,
  IconBuilding,
  IconCertificate
} from "@tabler/icons-react"
import { useAutosave, AutosaveStatus } from "@/hooks/use-autosave"
import { toast } from "sonner"

interface ProgramInfo {
  id: string
  name: string
  name_en?: string
  name_cn?: string
  degree_level?: string
  degree_type?: string
  intake_months?: string[]
  tuition_fee_per_year?: number
  currency?: string
  duration_years?: number
  universities?: {
    id: string
    name_en: string
    name_cn?: string
    city?: string
    province?: string
    logo_url?: string | null
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
  const [createdAt, setCreatedAt] = React.useState<string>("")

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
        const { getValidToken } = await import('@/lib/auth-token')
        const token = await getValidToken()
        const response = await fetch(`/api/student/applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setFormData({
            personal_statement: data.application.personal_statement || "",
            study_plan: data.application.study_plan || "",
            intake: data.application.intake || "",
          })
          setProgram(data.application.programs)
          setStatus(data.application.status)
          setCreatedAt(data.application.created_at)
        } else {
          toast.error("Failed to load application")
          router.push("/student-v2/applications")
        }
      } catch (error) {
        console.error("Error fetching application:", error)
        toast.error("Failed to load application")
      } finally {
        setFetching(false)
      }
    }

    if (applicationId) fetchApplication()
  }, [applicationId, router])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getStatusBadge = (appStatus: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      submitted_to_university: { label: "Submitted to University", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
      passed_initial_review: { label: "Passed Initial Review", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
      pre_admitted: { label: "Pre Admitted", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      admitted: { label: "Admitted", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      jw202_released: { label: "JW202 Released", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
    }
    const config = statusConfig[appStatus] || statusConfig.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <IconArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header Card - Matching Application Detail Page */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {program?.universities?.logo_url ? (
                <Avatar className="h-16 w-16 rounded-xl">
                  <AvatarImage
                    src={program.universities.logo_url}
                    alt={program.universities.name_en}
                  />
                  <AvatarFallback className="rounded-xl bg-primary/10">
                    <IconSchool className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconSchool className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">
                    {program?.name || program?.name_en}
                  </CardTitle>
                  {getStatusBadge(status)}
                </div>
                <CardDescription className="text-base">
                  {program?.universities?.name_en}
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {program?.universities?.city && (
                    <div className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4" />
                      {program.universities.city}
                      {program.universities.province && `, ${program.universities.province}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <IconCertificate className="h-4 w-4" />
                    {program?.degree_level || program?.degree_type}
                  </div>
                </div>
              </div>
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {formatDate(createdAt)}</span>
              </div>
            )}
            {program?.duration_years && (
              <div className="flex items-center gap-2 text-sm">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: {program.duration_years} year{program.duration_years > 1 ? 's' : ''}</span>
              </div>
            )}
            {program?.tuition_fee_per_year && (
              <div className="flex items-center gap-2 text-sm">
                <IconCash className="h-4 w-4 text-muted-foreground" />
                <span>
                  {program.currency || 'CNY'} {program.tuition_fee_per_year.toLocaleString()}/year
                </span>
              </div>
            )}
            {formData.intake && (
              <div className="flex items-center gap-2 text-sm">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span>Intake: {formData.intake}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
      <Card className={isValid ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800"}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {isValid ? (
              <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <IconAlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${isValid ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}`}>
                {isValid ? "Ready for Submission" : "Incomplete Application"}
              </p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li className={formData.personal_statement.trim() ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                  {formData.personal_statement.trim() ? "✓" : "○"} Personal statement
                </li>
                <li className={formData.study_plan.trim() ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                  {formData.study_plan.trim() ? "✓" : "○"} Study plan
                </li>
                <li className={formData.intake ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
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