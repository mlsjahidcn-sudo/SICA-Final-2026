"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconArrowLeft,
  IconSchool,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconCash,
  IconLanguage,
  IconEdit,
  IconSend,
  IconFileText,
  IconUser,
  IconMail,
  IconPhone,
  IconFile,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconLoader2
} from "@tabler/icons-react"
import { toast } from "sonner"
import { DocumentChecklist } from "@/components/student-v2/document-checklist"
import { ApplicationProgress } from "@/components/student-v2/application-progress"
import { ApplicationDeadline } from "@/components/student-v2/application-deadline"

interface ApplicationDetail {
  id: string
  status: string
  created_at: string
  updated_at: string
  intake: string | null
  personal_statement: string | null
  study_plan: string | null
  notes: string | null
  programs?: {
    id: string
    name: string
    degree_level: string
    discipline: string
    teaching_language: string
    duration_months: number
    tuition_per_year: number
    tuition_currency: string
    intake_months: string[]
    application_deadline_fall?: string
    application_deadline_spring?: string
    universities?: {
      id: string
      name_en: string
      city: string
      province: string
      logo_url: string | null
      website_url: string | null
    }
  }
  documents?: {
    id: string
    document_type: string
    status: string
    file_url: string
    created_at: string
  }[]
  timeline?: {
    status: string
    created_at: string
    notes: string | null
  }[]
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = React.useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false)

  const fetchApplication = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/student/applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      } else {
        // Mock data for development
        setApplication({
          id: applicationId,
          status: "under_review",
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          intake: "September 2025",
          personal_statement: "I am passionate about computer science and want to pursue advanced studies in this field...",
          study_plan: "My research interests include machine learning and artificial intelligence...",
          notes: null,
          programs: {
            id: "prog1",
            name: "Computer Science and Technology",
            degree_level: "Master",
            discipline: "Engineering",
            teaching_language: "English",
            duration_months: 24,
            tuition_per_year: 35000,
            tuition_currency: "CNY",
            intake_months: ["September"],
            universities: {
              id: "uni1",
              name_en: "Tsinghua University",
              city: "Beijing",
              province: "Beijing",
              logo_url: null,
              website_url: "https://www.tsinghua.edu.cn"
            }
          },
          documents: [
            { id: "d1", document_type: "Passport", status: "verified", file_url: "/files/passport.pdf", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { id: "d2", document_type: "Academic Transcript", status: "verified", file_url: "/files/transcript.pdf", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { id: "d3", document_type: "Degree Certificate", status: "pending", file_url: "/files/degree.pdf", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: "d4", document_type: "Language Test (IELTS)", status: "rejected", file_url: "/files/ielts.pdf", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          timeline: [
            { status: "draft", created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), notes: "Application created" },
            { status: "submitted", created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), notes: "Application submitted for review" },
            { status: "under_review", created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), notes: "Application is being reviewed by the university" }
          ]
        })
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  React.useEffect(() => {
    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId, fetchApplication])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/applications/${applicationId}/submit`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Application submitted successfully!')
        setShowSubmitDialog(false)
        fetchApplication() // Refresh data
      } else {
        toast.error(data.error || 'Failed to submit application')
        if (data.missingFields) {
          toast.error(`Missing fields: ${data.missingFields.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (appStatus: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
      under_review: { label: "Under Review", className: "bg-yellow-100 text-yellow-700" },
      interview_scheduled: { label: "Interview Scheduled", className: "bg-purple-100 text-purple-700" },
      accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    }
    const config = statusConfig[appStatus] || statusConfig.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getDocumentStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; className: string }> = {
      verified: { icon: <IconCheck className="h-3 w-3 mr-1" />, className: "bg-green-100 text-green-700" },
      pending: { icon: <IconClock className="h-3 w-3 mr-1" />, className: "bg-yellow-100 text-yellow-700" },
      rejected: { icon: <IconX className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-700" },
    }
    const c = config[status] || config.pending
    return <Badge className={c.className}>{c.icon}{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <IconAlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Application not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const canEdit = application.status === "draft"
  const canSubmit = application.status === "draft"

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {application.programs?.universities?.logo_url ? (
                <img 
                  src={application.programs.universities.logo_url}
                  alt={application.programs.universities.name_en}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconSchool className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">
                    {application.programs?.name}
                  </CardTitle>
                  {getStatusBadge(application.status)}
                </div>
                <CardDescription className="text-base">
                  {application.programs?.universities?.name_en}
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <IconMapPin className="h-4 w-4" />
                    {application.programs?.universities?.city}, {application.programs?.universities?.province}
                  </div>
                  <div>{application.programs?.degree_level}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" asChild>
                  <Link href={`/student-v2/applications/${applicationId}/edit`}>
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {canSubmit && (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <IconSend className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Created: {formatDate(application.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Updated: {formatDate(application.updated_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Intake: {application.intake || 'Not specified'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconCash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {application.programs?.tuition_currency} {application.programs?.tuition_per_year?.toLocaleString()}/year
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Progress */}
      <Card>
        <CardContent className="pt-6">
          <ApplicationProgress 
            status={application.status} 
            documentsComplete={!!application.documents?.length}
          />
        </CardContent>
      </Card>

      {/* Deadline Warning */}
      {application.intake && (
        <ApplicationDeadline
          intake={application.intake}
          deadlineFall={application.programs?.application_deadline_fall}
          deadlineSpring={application.programs?.application_deadline_spring}
          applicationStatus={application.status}
        />
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this application? Once submitted, you will not be able to make changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <p><strong>Program:</strong> {application.programs?.name}</p>
              <p><strong>University:</strong> {application.programs?.universities?.name_en}</p>
              <p><strong>Intake:</strong> {application.intake || 'Not specified'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({application.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Degree</span>
                  <span className="font-medium">{application.programs?.degree_level}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discipline</span>
                  <span className="font-medium">{application.programs?.discipline}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{application.programs?.duration_months} months</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intake</span>
                  <span className="font-medium">{application.programs?.intake_months?.join(", ")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">University</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <IconSchool className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{application.programs?.universities?.name_en}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{application.programs?.universities?.city}, {application.programs?.universities?.province}</span>
                </div>
                {application.programs?.universities?.website_url && (
                  <a 
                    href={application.programs.universities.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Website →
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {application.personal_statement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {application.personal_statement}
                </p>
              </CardContent>
            </Card>
          )}

          {application.study_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {application.study_plan}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentChecklist applicationId={applicationId} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {application.timeline && application.timeline.length > 0 ? (
                <div className="relative">
                  {application.timeline.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === application.timeline!.length - 1 
                            ? "bg-primary" 
                            : "bg-muted-foreground/30"
                        }`} />
                        {index < application.timeline!.length - 1 && (
                          <div className="w-0.5 h-full bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(item.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <IconClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No timeline available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
