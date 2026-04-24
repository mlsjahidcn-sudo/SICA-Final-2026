"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, ArrowLeft, Edit, Copy, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface InternalApplication {
  id: string
  student_name: string
  passport: string | null
  nationality: string | null
  degree: string | null
  major: string | null
  university_choice: string | null
  overview: string | null
  missing_docs: string[]
  remarks_for_university: string | null
  status: string
  user_id: string | null
  email: string | null
  portal_link: string | null
  portal_username: string | null
  portal_password: string | null
  partner: string | null
  note: string | null
  application_date: string | null
  follow_up_date: string | null
  comments: string | null
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Pending' },
  processing: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Processing' },
  submitted: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Submitted' },
  accepted: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Accepted' },
  rejected: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Rejected' },
  withdrawn: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Withdrawn' },
  follow_up: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Follow Up' },
}

const MISSING_DOC_LABELS: Record<string, string> = {
  passport: 'Passport',
  degree_certificate: 'Degree Certificate',
  transcripts: 'Transcripts',
  language_test: 'Language Test (IELTS/TOEFL/HSK)',
  recommendation_letters: 'Recommendation Letters',
  financial_guarantee: 'Financial Guarantee',
  health_certificate: 'Health Certificate',
  photos: 'Photos',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  other: 'Other',
}

function InternalAppDetailContent() {
  const router = useRouter()
  const params = useParams()
  const appId = params.id as string

  const [application, setApplication] = useState<InternalApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const { getValidToken } = await import('@/lib/auth-token')
        const token = await getValidToken()
        
        const response = await fetch(`/api/admin/internal-apps/${appId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setApplication(data.data)
        } else {
          toast.error('Failed to load application')
          router.push('/admin/v2/internal-apps')
        }
      } catch (error) {
        console.error('Error fetching application:', error)
        toast.error('Failed to load application')
        router.push('/admin/v2/internal-apps')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [appId, router])

  const handleDelete = async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch(`/api/admin/internal-apps/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Application deleted successfully')
        router.push('/admin/v2/internal-apps')
      } else {
        toast.error('Failed to delete application')
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
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
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/v2/internal-apps">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.student_name}</h1>
            <p className="text-muted-foreground">
              {application.degree && application.major 
                ? `${application.degree} - ${application.major}`
                : application.degree || application.major || 'No academic info'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/v2/internal-apps/${appId}/copy`}>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Another University
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/v2/internal-apps/${appId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <Badge 
          variant="secondary"
          className={`${STATUS_CONFIG[application.status]?.bgColor || 'bg-gray-100'} ${STATUS_CONFIG[application.status]?.color || 'text-gray-700'} text-base px-4 py-1`}
        >
          {STATUS_CONFIG[application.status]?.label || application.status}
        </Badge>
        {application.university_choice && (
          <span className="text-muted-foreground">
            {application.university_choice}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Passport</p>
                <p className="font-mono">{application.passport || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nationality</p>
                <p>{application.nationality || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{application.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{application.user_id || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">University</p>
                <p>{application.university_choice || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partner</p>
                <p>{application.partner || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Application Date</p>
                <p>{formatDate(application.application_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Follow Up Date</p>
                <p>{formatDate(application.follow_up_date)}</p>
              </div>
            </div>
            {application.portal_link && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Portal Link</p>
                  <a 
                    href={application.portal_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {application.portal_link}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {application.portal_username && (
                  <div>
                    <p className="text-sm text-muted-foreground">Portal Username</p>
                    <p className="font-mono">{application.portal_username}</p>
                  </div>
                )}
                {application.portal_password && (
                  <div>
                    <p className="text-sm text-muted-foreground">Portal Password</p>
                    <p className="font-mono">••••••••</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Missing Documents */}
      {application.missing_docs && application.missing_docs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {application.missing_docs.map((doc) => (
                <Badge key={doc} variant="outline">
                  {MISSING_DOC_LABELS[doc] || doc}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview */}
      {application.overview && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{application.overview}</p>
          </CardContent>
        </Card>
      )}

      {/* Remarks for University */}
      {application.remarks_for_university && (
        <Card>
          <CardHeader>
            <CardTitle>Remarks for University</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{application.remarks_for_university}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes & Comments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {application.note && (
          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{application.note}</p>
            </CardContent>
          </Card>
        )}
        {application.comments && (
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{application.comments}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{formatDateTime(application.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p>{formatDateTime(application.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the application for {application.student_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function InternalAppDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/signin')
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
          <SiteHeader title="Internal Application Details" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <InternalAppDetailContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
