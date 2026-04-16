"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, ArrowLeft, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  partner: string | null
  note: string | null
  application_date: string | null
  follow_up_date: string | null
  comments: string | null
}

function CopyInternalAppContent() {
  const router = useRouter()
  const params = useParams()
  const sourceId = params.id as string

  const [sourceApplication, setSourceApplication] = useState<InternalApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newUniversity, setNewUniversity] = useState('')

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const { getValidToken } = await import('@/lib/auth-token')
        const token = await getValidToken()
        
        const response = await fetch(`/api/admin/internal-apps/${sourceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setSourceApplication(data.data)
        } else {
          toast.error('Failed to load source application')
          router.push('/admin/v2/internal-apps')
        }
      } catch (error) {
        console.error('Error fetching application:', error)
        toast.error('Failed to load source application')
        router.push('/admin/v2/internal-apps')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [sourceId, router])

  const handleCopy = async () => {
    if (!sourceApplication) return
    
    if (!newUniversity.trim()) {
      toast.error('Please enter a university name')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create a new application with the same student data but new university
      const newApplication = {
        student_name: sourceApplication.student_name,
        passport: sourceApplication.passport,
        nationality: sourceApplication.nationality,
        degree: sourceApplication.degree,
        major: sourceApplication.major,
        university_choice: newUniversity,
        overview: sourceApplication.overview,
        missing_docs: sourceApplication.missing_docs,
        remarks_for_university: '', // Clear remarks for new university
        status: 'pending', // Reset status to pending
        user_id: sourceApplication.user_id,
        email: sourceApplication.email,
        portal_link: sourceApplication.portal_link,
        partner: sourceApplication.partner,
        note: sourceApplication.note,
        application_date: null, // Clear date for new application
        follow_up_date: null,
        comments: sourceApplication.comments,
      }

      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch('/api/admin/internal-apps', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newApplication)
      })

      if (response.ok) {
        toast.success('Application copied successfully')
        router.push('/admin/v2/internal-apps')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to copy application')
      }
    } catch (error) {
      console.error('Error copying application:', error)
      toast.error('Failed to copy application')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!sourceApplication) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/v2/internal-apps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Copy to Another University</h1>
          <p className="text-muted-foreground">Create a new application with the same student data</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Copy className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Copy to Another University</CardTitle>
              <CardDescription>
                Create a new application with the same student data for a different university
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Application Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Source Application</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Student:</span>{' '}
                <span className="font-medium">{sourceApplication.student_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Passport:</span>{' '}
                <span className="font-mono">{sourceApplication.passport || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Degree:</span>{' '}
                <span>{sourceApplication.degree || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Major:</span>{' '}
                <span>{sourceApplication.major || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Current University:</span>{' '}
                <span className="font-medium text-blue-600">
                  {sourceApplication.university_choice || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              The following data will be copied to the new application:
              <ul className="mt-2 list-disc list-inside text-sm">
                <li>Student name, passport, nationality, email</li>
                <li>Degree and major</li>
                <li>Missing documents</li>
                <li>Partner and user ID</li>
                <li>Portal link</li>
                <li>Notes and comments</li>
              </ul>
              <br />
              The following fields will be reset for the new application:
              <ul className="mt-2 list-disc list-inside text-sm">
                <li>Status (will be set to &quot;Pending&quot;)</li>
                <li>Application date (will be empty)</li>
                <li>Follow-up date (will be empty)</li>
                <li>Remarks for university (will be empty)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* New University Input */}
          <div className="space-y-2">
            <Label htmlFor="new_university">New University *</Label>
            <Input
              id="new_university"
              value={newUniversity}
              onChange={(e) => setNewUniversity(e.target.value)}
              placeholder="Enter the new university name"
            />
            <p className="text-sm text-muted-foreground">
              Enter the name of the university for this new application
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/v2/internal-apps">Cancel</Link>
            </Button>
            <Button onClick={handleCopy} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Copy className="mr-2 h-4 w-4" />
              Create Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CopyInternalAppPage() {
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
          <SiteHeader title="Copy Internal Application" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <CopyInternalAppContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
