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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconUser,
  IconId,
  IconSchool,
  IconFileText,
  IconClock,
  IconExternalLink,
  IconUserPlus
} from "@tabler/icons-react"

interface ReferredByPartner {
  id: string
  full_name: string
  email: string
  company_name?: string
}

interface StudentDetail {
  id: string
  email: string
  full_name: string
  phone?: string
  nationality?: string
  avatar_url?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
  source: 'individual' | 'partner_referred'
  referred_by_partner_id?: string | null
  referred_by_partner: ReferredByPartner | null
  students?: {
    id: string
    first_name: string
    last_name: string
    passport_number?: string
    date_of_birth?: string
    gender?: string
    current_address?: string
    wechat_id?: string
    nationality?: string
    highest_education?: string
    gpa?: string
    hsk_level?: string
    hsk_score?: string
    ielts_score?: string
    toefl_score?: string
  } | null
  applications: Array<{
    id: string
    status: string
    submitted_at: string | null
    created_at: string
    programs: {
      id: string
      name_en: string
      degree_type: string
      universities: {
        id: string
        name_en: string
        city: string
      }
    }
  }>
  documents: Array<{
    id: string
    document_type: string
    file_url: string
    uploaded_at: string
    verified: boolean
    application_id: string
  }>
  meetings: Array<{
    id: string
    title: string
    scheduled_at: string
    status: string
    meeting_url: string
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

function StudentDetailContent({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStudent() {
      try {
        const token = localStorage.getItem('sica_auth_token')
        const response = await fetch(`/api/admin/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStudent(data.student || data)
        } else {
          toast.error('Failed to load student details')
          router.push('/admin/v2/students')
        }
      } catch (error) {
        console.error('Error fetching student:', error)
        toast.error('Failed to load student details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudent()
  }, [studentId, router])

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Student not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/admin/v2/students">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={student.avatar_url} />
              <AvatarFallback className="text-2xl">{getInitials(student.full_name)}</AvatarFallback>
            </Avatar>
            <CardTitle>{student.full_name}</CardTitle>
            <CardDescription>{student.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-3 text-sm">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span>{student.phone}</span>
              </div>
            )}
            {(student.nationality || student.students?.nationality) && (
              <div className="flex items-center gap-3 text-sm">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <span>{student.nationality || student.students?.nationality}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDate(student.created_at)}</span>
            </div>
            {student.updated_at && (
              <div className="flex items-center gap-3 text-sm">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span>Last updated {formatDate(student.updated_at)}</span>
              </div>
            )}

            <Separator />

            {/* Source Info */}
            <div>
              <div className="text-sm font-medium mb-2">Registration Source</div>
              {student.source === 'individual' ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <IconUser className="h-3 w-3" />
                    Individual
                  </Badge>
                  <span className="text-xs text-muted-foreground">Self-registered</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                    <IconUserPlus className="h-3 w-3" />
                    Partner-Referred
                  </Badge>
                  {student.referred_by_partner && (
                    <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
                      {student.referred_by_partner.company_name && (
                        <div className="text-sm font-medium">{student.referred_by_partner.company_name}</div>
                      )}
                      <div className="text-sm text-muted-foreground">{student.referred_by_partner.full_name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconMail className="h-3 w-3" />
                        <a href={`mailto:${student.referred_by_partner.email}`} className="hover:underline text-primary">
                          {student.referred_by_partner.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{student.applications.length}</div>
                <div className="text-xs text-muted-foreground">Applications</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{student.documents.length}</div>
                <div className="text-xs text-muted-foreground">Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details & Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Passport Info */}
          {student.students && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconId className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">First Name</div>
                    <div className="font-medium">{student.students.first_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Name</div>
                    <div className="font-medium">{student.students.last_name}</div>
                  </div>
                  {student.students.passport_number && (
                    <div>
                      <div className="text-sm text-muted-foreground">Passport Number</div>
                      <div className="font-medium">{student.students.passport_number}</div>
                    </div>
                  )}
                  {student.students.date_of_birth && (
                    <div>
                      <div className="text-sm text-muted-foreground">Date of Birth</div>
                      <div className="font-medium">{formatDate(student.students.date_of_birth)}</div>
                    </div>
                  )}
                  {student.students.gender && (
                    <div>
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium capitalize">{student.students.gender}</div>
                    </div>
                  )}
                  {student.students.current_address && (
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{student.students.current_address}</div>
                    </div>
                  )}
                  {student.students.wechat_id && (
                    <div>
                      <div className="text-sm text-muted-foreground">WeChat ID</div>
                      <div className="font-medium">{student.students.wechat_id}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSchool className="h-5 w-5" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.applications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No applications yet
                </div>
              ) : (
                <div className="space-y-4">
                  {student.applications.map((app) => (
                    <div key={app.id} className="flex items-start justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <div className="font-medium">{app.programs.name_en}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.programs.universities.name_en} • {app.programs.degree_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Applied {formatDateTime(app.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_CONFIG[app.status]?.bgColor}>
                          {STATUS_CONFIG[app.status]?.label || app.status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/v2/applications/${app.id}`}>
                            <IconExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {student.documents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No documents uploaded
                </div>
              ) : (
                <div className="space-y-2">
                  {student.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <IconFileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{doc.document_type}</div>
                          <div className="text-xs text-muted-foreground">
                            Uploaded {formatDateTime(doc.uploaded_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.verified ? 'default' : 'secondary'}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </Badge>
                        {doc.file_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <IconExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          <SiteHeader title="Student Details" />
          <StudentDetailContent studentId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
