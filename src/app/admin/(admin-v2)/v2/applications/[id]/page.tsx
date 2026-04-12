"use client"

import { useEffect, useState, use } from "react"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconUser,
  IconSchool,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconSend,
  IconDownload,
  IconMessage,
  IconBuilding,
  IconVideo,
  IconCheck,
  IconX,
  IconLoader2,
  IconExternalLink,
  IconEdit
} from "@tabler/icons-react"

interface Document {
  id: string
  document_type: string
  file_key: string
  file_name: string
  file_size: number
  content_type: string
  status: string
  rejection_reason: string | null
  uploaded_at: string
  created_at: string
}

interface Meeting {
  id: string
  title: string
  meeting_date: string
  duration_minutes: number
  platform: string
  meeting_link: string | null
  meeting_id: string | null
  password: string | null
  status: string
  notes: string | null
  created_at: string
}

interface StatusHistory {
  id: string
  old_status: string | null
  new_status: string
  notes: string | null
  changed_by: string | null
  changed_by_name: string | null
  created_at: string
}

interface ApplicationDetail {
  id: string
  student_id: string
  program_id: string
  partner_id: string | null
  status: string
  priority: number | null
  notes: string | null
  profile_snapshot: Record<string, unknown> | null
  personal_statement: string | null
  study_plan: string | null
  intake: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  students: {
    id: string
    user_id: string
    first_name: string | null
    last_name: string | null
    nationality: string | null
    gender: string | null
    highest_education: string | null
    current_address: string | null
    wechat_id: string | null
    users: {
      id: string
      full_name: string
      email: string
      phone: string
    } | null
  } | null
  programs: {
    id: string
    name: string
    degree_level: string
    language: string
    tuition_fee_per_year: number | null
    currency: string
    duration_years: number | null
    scholarship_types: string | null
    universities: {
      id: string
      name_en: string
      name_cn: string | null
      city: string
      province: string
      logo_url?: string | null
    } | null
  } | null
  partner: {
    id: string
    full_name: string
    email: string
    company_name?: string
  } | null
  reviewer: {
    id: string
    full_name: string
  } | null
  status_history: StatusHistory[]
  documents: Document[]
  meetings: Meeting[]
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Draft' },
  submitted: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Submitted' },
  under_review: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Under Review' },
  document_request: { color: 'text-orange-600', bgColor: 'bg-orange-500/10', label: 'Document Request' },
  interview_scheduled: { color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Interview' },
  accepted: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Accepted' },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Rejected' },
  withdrawn: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Withdrawn' },
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Proof',
  medical_exam: 'Medical Exam',
  police_clearance: 'Police Clearance',
  other: 'Other',
}

const DOCUMENT_STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: typeof IconClock }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Pending', icon: IconClock },
  verified: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Verified', icon: IconCheck },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Rejected', icon: IconX },
}

const MEETING_STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Scheduled' },
  completed: { color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Completed' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Cancelled' },
  rescheduled: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Rescheduled' },
}

function ApplicationDetailContent({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function fetchApplication() {
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
        const response = await fetch(`/api/admin/applications/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const appData = data.application || data
          setApplication(appData)
          setNewStatus(appData.status)
        } else {
          toast.error('Failed to load application details')
          router.push('/admin/v2/applications')
        }
      } catch (error) {
        console.error('Error fetching application:', error)
        toast.error('Failed to load application details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId, router])

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === application?.status) return

    setIsUpdating(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment: comment || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Application status updated')
        // Refresh application data
        const data = await response.json()
        setApplication(data.application || application)
        setComment('')
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

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Use fetch + blob for cross-origin download
          const fileResponse = await fetch(data.url);
          const blob = await fileResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.file_name;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      } else {
        toast.error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Application not found
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.draft

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/admin/v2/applications">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/v2/applications/${applicationId}/edit`}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {application.priority !== null && application.priority > 0 && (
            <Badge variant={application.priority >= 2 ? 'destructive' : 'secondary'}>
              {application.priority === 1 ? 'Low' : application.priority === 2 ? 'High' : 'Urgent'} Priority
            </Badge>
          )}
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-sm`}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4">
        {application.programs?.universities?.logo_url ? (
          <Avatar className="h-12 w-12 rounded-lg border">
            <AvatarImage src={application.programs.universities.logo_url} alt="" className="object-contain p-1" />
            <AvatarFallback className="rounded-lg"><IconBuilding className="h-6 w-6" /></AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border">
            <IconBuilding className="h-6 w-6 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">
            {application.students?.users?.full_name || 
              `${application.students?.first_name || ''} ${application.students?.last_name || ''}`.trim() || 'Unknown Applicant'}
          </h1>
          <p className="text-muted-foreground">
            {application.programs?.name || 'Unknown Program'} · {application.programs?.universities?.name_en || 'Unknown University'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">
                Documents
                {application.documents.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{application.documents.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Status History</TabsTrigger>
              <TabsTrigger value="meetings">
                Meetings
                {application.meetings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{application.meetings.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Applicant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconUser className="h-4 w-4" />
                    Applicant Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Full Name</div>
                      <div className="font-medium">
                        {application.students?.users?.full_name || 
                          `${application.students?.first_name || ''} ${application.students?.last_name || ''}`.trim() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{application.students?.users?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nationality</div>
                      <div className="font-medium">{application.students?.nationality || 'N/A'}</div>
                    </div>
                    {application.students?.gender && (
                      <div>
                        <div className="text-sm text-muted-foreground">Gender</div>
                        <div className="font-medium capitalize">{application.students.gender}</div>
                      </div>
                    )}
                    {application.students?.users?.phone && (
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{application.students.users.phone}</div>
                      </div>
                    )}
                    {application.students?.highest_education && (
                      <div>
                        <div className="text-sm text-muted-foreground">Education</div>
                        <div className="font-medium">{application.students.highest_education}</div>
                      </div>
                    )}
                    {application.students?.wechat_id && (
                      <div>
                        <div className="text-sm text-muted-foreground">WeChat ID</div>
                        <div className="font-medium">{application.students.wechat_id}</div>
                      </div>
                    )}
                    {application.intake && (
                      <div>
                        <div className="text-sm text-muted-foreground">Intake</div>
                        <div className="font-medium">{application.intake}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Program Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconSchool className="h-4 w-4" />
                    Program Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-lg">{application.programs?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <IconMapPin className="h-3 w-3" />
                          {application.programs?.universities?.name_en || 'N/A'}, {application.programs?.universities?.city || ''}
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {application.programs?.degree_level || 'N/A'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-3">
                      {application.programs?.duration_years && (
                        <div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="font-medium">{application.programs.duration_years} years</div>
                        </div>
                      )}
                      {application.programs?.tuition_fee_per_year && (
                        <div>
                          <div className="text-sm text-muted-foreground">Tuition</div>
                          <div className="font-medium">
                            {application.programs.currency || 'CNY'} {application.programs.tuition_fee_per_year.toLocaleString()}/year
                          </div>
                        </div>
                      )}
                      {application.programs?.language && (
                        <div>
                          <div className="text-sm text-muted-foreground">Language</div>
                          <div className="font-medium capitalize">{application.programs.language}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Partner Info */}
              {application.partner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconBuilding className="h-4 w-4" />
                      Partner Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Partner Name</div>
                        <div className="font-medium">{application.partner.full_name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{application.partner.email || 'N/A'}</div>
                      </div>
                      {application.partner.company_name && (
                        <div>
                          <div className="text-sm text-muted-foreground">Company</div>
                          <div className="font-medium">{application.partner.company_name}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Personal Statement */}
              {application.personal_statement && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconFileText className="h-4 w-4" />
                      Personal Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{application.personal_statement}</p>
                    <p className="text-xs text-muted-foreground mt-2">{application.personal_statement.length} characters</p>
                  </CardContent>
                </Card>
              )}

              {/* Study Plan */}
              {application.study_plan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconFileText className="h-4 w-4" />
                      Study Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{application.study_plan}</p>
                    <p className="text-xs text-muted-foreground mt-2">{application.study_plan.length} characters</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {application.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconMessage className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Application Documents</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/v2/applications/${applicationId}/documents`}>
                        Manage Documents
                      </Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Documents submitted with this application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {application.documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {application.documents.map((doc) => {
                        const docStatus = DOCUMENT_STATUS_CONFIG[doc.status] || DOCUMENT_STATUS_CONFIG.pending
                        const StatusIcon = docStatus.icon
                        return (
                          <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconFileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                                <Badge className={`${docStatus.bgColor} ${docStatus.color} text-xs`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {docStatus.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {doc.file_name} · {formatFileSize(doc.file_size)}
                              </p>
                              {doc.rejection_reason && (
                                <p className="text-xs text-red-500 mt-1">Reason: {doc.rejection_reason}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)}>
                              <IconDownload className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Status History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconClock className="h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {application.status_history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No status changes recorded</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {application.status_history.map((history, index) => (
                        <div key={history.id} className="flex gap-4 pb-6 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            {index < application.status_history.length - 1 && (
                              <div className="flex-1 w-0.5 bg-border" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${STATUS_CONFIG[history.new_status]?.bgColor || 'bg-gray-500/10'} ${STATUS_CONFIG[history.new_status]?.color || 'text-gray-600'}`}>
                                {STATUS_CONFIG[history.new_status]?.label || history.new_status}
                              </Badge>
                              {history.old_status && (
                                <>
                                  <span className="text-xs text-muted-foreground">from</span>
                                  <span className="text-xs text-muted-foreground">
                                    {STATUS_CONFIG[history.old_status]?.label || history.old_status}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <IconClock className="h-3 w-3" />
                              {formatDateTime(history.created_at)}
                              {history.changed_by_name && (
                                <>
                                  <span>·</span>
                                  <span>by {history.changed_by_name}</span>
                                </>
                              )}
                            </div>
                            {history.notes && (
                              <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                                {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meetings Tab */}
            <TabsContent value="meetings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Scheduled Meetings</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/v2/applications/${applicationId}/meeting`}>
                        <IconCalendar className="mr-2 h-4 w-4" />
                        Schedule Meeting
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {application.meetings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No meetings scheduled</p>
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <Link href={`/admin/v2/applications/${applicationId}/meeting`}>
                          Schedule a Meeting
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {application.meetings.map((meeting) => {
                        const meetingStatus = MEETING_STATUS_CONFIG[meeting.status] || MEETING_STATUS_CONFIG.scheduled
                        return (
                          <div key={meeting.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconVideo className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{meeting.title}</p>
                                <Badge className={`${meetingStatus.bgColor} ${meetingStatus.color} text-xs`}>
                                  {meetingStatus.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(meeting.meeting_date)} · {meeting.duration_minutes} min · {meeting.platform}
                              </p>
                              {meeting.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{meeting.notes}</p>
                              )}
                            </div>
                            {meeting.meeting_link && meeting.status === 'scheduled' && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                  <IconExternalLink className="h-4 w-4 mr-1" />
                                  Join
                                </a>
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Add a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Button 
                className="w-full" 
                onClick={handleUpdateStatus}
                disabled={isUpdating || newStatus === application.status}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(application.created_at)}</span>
              </div>
              {application.submitted_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{formatDate(application.submitted_at)}</span>
                </div>
              )}
              {application.reviewed_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span>{formatDate(application.reviewed_at)}</span>
                </div>
              )}
              {application.reviewer && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reviewer</span>
                  <span>{application.reviewer.full_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${application.students?.users?.email || ''}`}>
                  <IconSend className="mr-2 h-4 w-4" />
                  Send Email
                </a>
              </Button>
              {application.students?.user_id && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/v2/students/${application.students.user_id}`}>
                    <IconUser className="mr-2 h-4 w-4" />
                    View Student Profile
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/v2/applications/${applicationId}/documents`}>
                  <IconFileText className="mr-2 h-4 w-4" />
                  Manage Documents
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/v2/applications/${applicationId}/meeting`}>
                  <IconCalendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
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
          <SiteHeader />
          <ApplicationDetailContent applicationId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
