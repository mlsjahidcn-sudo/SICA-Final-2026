"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { 
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconSchool,
  IconLanguage,
  IconFileText,
  IconSparkles,
  IconExternalLink,
  IconDownload,
  IconSend,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconMessageCircle
} from "@tabler/icons-react"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_size: number
  mime_type: string
  preview_url: string
  created_at: string
}

interface StatusHistory {
  old_status: string | null
  new_status: string
  notes: string | null
  created_at: string
}

interface Report {
  id: string
  report_content: string
  generated_at: string
}

interface Assessment {
  id: string
  tracking_code: string
  full_name: string
  email: string
  phone: string | null
  whatsapp_number: string | null
  country: string
  date_of_birth: string | null
  current_education_level: string | null
  gpa: string | null
  target_degree: string | null
  target_major: string | null
  preferred_universities: string | null
  english_proficiency: string | null
  english_score: string | null
  budget_range: string | null
  additional_notes: string | null
  admin_notes: string | null
  status: string
  submitted_at: string
  created_at: string
  updated_at: string
  documents: Document[]
  status_history: StatusHistory[]
  report: Report | null
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: typeof IconClock; label: string }> = {
  pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', icon: IconClock, label: 'Pending Review' },
  under_review: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: IconFileText, label: 'Under Review' },
  document_request: { color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: IconAlertCircle, label: 'Documents Requested' },
  report_ready: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: IconCircleCheck, label: 'Report Ready' },
  completed: { color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', icon: IconCircleCheck, label: 'Completed' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: IconAlertCircle, label: 'Cancelled' },
}

function AssessmentDetailContent() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  const fetchAssessment = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`)
      const data = await response.json()

      if (data.success) {
        setAssessment(data.assessment)
        setNewStatus(data.assessment.status)
        setAdminNotes(data.assessment.admin_notes || "")
      } else {
        toast.error('Assessment not found')
        router.push('/admin/v2/assessments')
      }
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to load assessment')
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId, router])

  useEffect(() => {
    fetchAssessment()
  }, [fetchAssessment])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}/report`, {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Report generated successfully!')
        fetchAssessment()
      } else {
        toast.error(data.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
        }),
      })

      if (response.ok) {
        toast.success('Status updated successfully')
        fetchAssessment()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <IconAlertCircle className="h-12 w-12" />
        <p>Assessment not found</p>
        <Button variant="outline" asChild>
          <Link href="/admin/v2/assessments">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.pending
  const StatusIcon = statusConfig.icon

  const whatsappLink = assessment.whatsapp_number
    ? `https://wa.me/${assessment.whatsapp_number.replace(/[^0-9]/g, "")}`
    : null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/v2/assessments">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-muted-foreground">{assessment.tracking_code}</span>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{assessment.full_name}</h1>
            <p className="text-muted-foreground">{assessment.country}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`mailto:${assessment.email}`}>
              <IconMail className="mr-2 h-4 w-4" />
              Email
            </a>
          </Button>
          {whatsappLink && (
            <Button variant="outline" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <IconMessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{assessment.email}</p>
                  </div>
                </div>
                {assessment.phone && (
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{assessment.phone}</p>
                    </div>
                  </div>
                )}
                {assessment.whatsapp_number && (
                  <div className="flex items-center gap-2">
                    <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="text-sm">{assessment.whatsapp_number}</p>
                    </div>
                  </div>
                )}
                {assessment.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-sm">{assessment.date_of_birth}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSchool className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current Education Level</p>
                  <p className="font-medium">{assessment.current_education_level || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Degree</p>
                  <p className="font-medium">{assessment.target_degree || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Major</p>
                  <p className="font-medium">{assessment.target_major || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-medium">{assessment.gpa || "Not provided"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Preferred Universities</p>
                  <p className="font-medium">{assessment.preferred_universities || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Proficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLanguage className="h-5 w-5" />
                Language Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-muted-foreground">English</p>
                <p className="mt-1 text-lg font-semibold">
                  {assessment.english_proficiency || "Not specified"}
                </p>
                {assessment.english_score && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Score: {assessment.english_score}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-xs text-muted-foreground">Budget Range</p>
                <p className="font-medium">{assessment.budget_range || "Not specified"}</p>
              </div>
              {assessment.additional_notes && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">Additional Notes</p>
                  <p className="mt-1 text-sm">{assessment.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {assessment.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  {assessment.documents.length} document{assessment.documents.length !== 1 && "s"} uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <IconFileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.document_type} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.preview_url} target="_blank" rel="noopener noreferrer">
                          <IconExternalLink className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report */}
          {assessment.report && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <IconSparkles className="h-5 w-5" />
                  AI Assessment Report
                </CardTitle>
                <CardDescription>
                  Generated on {formatDate(assessment.report.generated_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none rounded-lg bg-muted/30 p-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-3">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground mb-3">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-muted-foreground">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>
                      ),
                    }}
                  >
                    {assessment.report.report_content}
                  </ReactMarkdown>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(assessment.report.report_content)}`}
                      download={`assessment-report-${assessment.tracking_code}.md`}
                    >
                      <IconDownload className="mr-2 h-4 w-4" />
                      Download Report
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="mt-1">
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <Button className="w-full" onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <IconSend className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generate Report */}
          {!assessment.report && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSparkles className="h-5 w-5" />
                  Generate AI Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Generate a comprehensive AI-powered assessment report with personalized recommendations.
                </p>
                <Button className="w-full" onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessment.status_history.map((history, index) => {
                  const oldConfig = history.old_status ? STATUS_CONFIG[history.old_status] : null
                  const newConfig = STATUS_CONFIG[history.new_status] || STATUS_CONFIG.pending
                  
                  return (
                    <div key={index} className="relative pl-6">
                      <div className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <div className="h-2 w-2 rounded-full bg-background" />
                      </div>
                      {index < assessment.status_history.length - 1 && (
                        <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {oldConfig ? oldConfig.label : "Submitted"} → {newConfig.label}
                        </p>
                        {history.notes && (
                          <p className="text-xs text-muted-foreground">{history.notes}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(history.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{formatDate(assessment.created_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(assessment.updated_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{assessment.documents.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report</span>
                  <span>{assessment.report ? "Generated" : "Pending"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Assessment Details" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <AssessmentDetailContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
