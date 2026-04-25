"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { PageContainer } from "@/components/admin"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowLeft,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  FileText,
} from "lucide-react"
import { getValidToken } from "@/lib/auth-token"

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
  university?: {
    id: string
    name_en: string
    name_cn?: string
    city?: string
    province?: string
    logo_url?: string | null
  }
}

function EditIndividualApplicationContent() {
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
  const [notes, setNotes] = React.useState<string>("")

  // Fetch application data
  React.useEffect(() => {
    const fetchApplication = async () => {
      try {
        const token = await getValidToken()
        const response = await fetch(`/api/admin/individual-applications/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setFormData({
            personal_statement: data.personal_statement || "",
            study_plan: data.study_plan || "",
            intake: data.intake || "",
          })
          setProgram(data.program)
          setStatus(data.status)
          setCreatedAt(data.created_at)
          setNotes(data.notes || "")
        } else {
          toast.error("Failed to load application")
          router.push("/admin/v2/individual-applications")
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

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getValidToken()
      const response = await fetch(`/api/admin/individual-applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personal_statement: formData.personal_statement,
          study_plan: formData.study_plan,
          intake: formData.intake,
          notes: notes,
        }),
      })
      if (response.ok) {
        toast.success("Application saved successfully!")
        router.push(`/admin/v2/applications/${applicationId}`)
      } else {
        const errData = await response.json().catch(() => ({}))
        toast.error(errData.error || "Failed to save application")
      }
    } catch (error) {
      console.error("Error saving application:", error)
      toast.error("Failed to save application")
    } finally {
      setSaving(false)
    }
  }

  // Handle field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {program?.university?.logo_url ? (
                <Avatar className="h-16 w-16 rounded-xl">
                  <AvatarImage
                    src={program.university.logo_url}
                    alt={program.university.name_en}
                  />
                  <AvatarFallback className="rounded-xl bg-primary/10">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-primary" />
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
                  {program?.university?.name_en}
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {program?.university?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {program.university.city}
                      {program.university.province && `, ${program.university.province}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {program?.degree_level || program?.degree_type}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {formatDate(createdAt)}</span>
              </div>
            )}
            {program?.duration_years && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Duration: {program.duration_years} year{program.duration_years > 1 ? 's' : ''}</span>
              </div>
            )}
            {program?.tuition_fee_per_year && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  {program.currency || 'CNY'} {program.tuition_fee_per_year.toLocaleString()}/year
                </span>
              </div>
            )}
            {formData.intake && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <Calendar className="h-5 w-5" />
            Intake Selection
          </CardTitle>
          <CardDescription>Choose the preferred intake period</CardDescription>
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
            Edit the personal statement, study plan, and notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Personal Statement</Label>
              <span className="text-xs text-muted-foreground">
                {formData.personal_statement.length} characters
              </span>
            </div>
            <Textarea
              rows={8}
              value={formData.personal_statement}
              onChange={(e) => handleFieldChange("personal_statement", e.target.value)}
              placeholder="Personal statement..."
              className="resize-none"
            />
          </div>
          
          <Separator />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Study Plan</Label>
              <span className="text-xs text-muted-foreground">
                {formData.study_plan.length} characters
              </span>
            </div>
            <Textarea
              rows={8}
              value={formData.study_plan}
              onChange={(e) => handleFieldChange("study_plan", e.target.value)}
              placeholder="Study plan..."
              className="resize-none"
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Notes (Internal)</Label>
            </div>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this application..."
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default function EditIndividualApplicationPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <PageContainer title="Edit Application">
      <EditIndividualApplicationContent />
    </PageContainer>
  )
}