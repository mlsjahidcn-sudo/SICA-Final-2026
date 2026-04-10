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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
  IconMessage
} from "@tabler/icons-react"

interface ApplicationDetail {
  id: string
  student_id: string
  program_id: string
  partner_id: string | null
  status: string
  priority: string | null
  notes: string | null
  profile_snapshot: Record<string, unknown> | null
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
  status_history: Array<{
    id: string
    old_status: string | null
    new_status: string
    notes: string | null
    created_at: string
  }>
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
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/admin/v2/applications">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
        </Button>
        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-sm`}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
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
                {application.students?.current_address && (
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">{application.students.current_address}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSchool className="h-5 w-5" />
                Program Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-lg">{application.programs?.name || 'N/A'}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {application.programs?.degree_level || 'N/A'}
                  </Badge>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <IconSchool className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">University</div>
                      <div className="font-medium">{application.programs?.universities?.name_en || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Location</div>
                      <div className="font-medium">
                        {application.programs?.universities?.city || 'N/A'}, {application.programs?.universities?.province || ''}
                      </div>
                    </div>
                  </div>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                Documents available in the Documents tab
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(application.status_history?.length ?? 0) === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No status changes yet
                </div>
              ) : (
                <div className="space-y-4">
                  {(application.status_history || []).map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {index < (application.status_history?.length ?? 0) - 1 && (
                          <div className="h-full w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {STATUS_CONFIG[history.new_status]?.label || history.new_status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(history.created_at)}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

          {/* Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">Meetings</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/v2/applications/${applicationId}/meeting`}>
                    <IconCalendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground text-sm">
                No meetings scheduled
              </div>
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Application Details" />
          <ApplicationDetailContent applicationId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
