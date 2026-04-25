"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { toast } from "sonner"

const MISSING_DOC_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'degree_certificate', label: 'Degree Certificate' },
  { value: 'transcripts', label: 'Transcripts' },
  { value: 'language_test', label: 'Language Test (IELTS/TOEFL/HSK)' },
  { value: 'recommendation_letters', label: 'Recommendation Letters' },
  { value: 'financial_guarantee', label: 'Financial Guarantee' },
  { value: 'health_certificate', label: 'Health Certificate' },
  { value: 'photos', label: 'Photos' },
  { value: 'cv', label: 'CV/Resume' },
  { value: 'study_plan', label: 'Study Plan' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'follow_up', label: 'Follow Up' },
]

function EditInternalAppContent() {
  const router = useRouter()
  const params = useParams()
  const appId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    student_name: '',
    passport: '',
    nationality: '',
    degree: '',
    major: '',
    university_choice: '',
    overview: '',
    missing_docs: [] as string[],
    remarks_for_university: '',
    status: 'pending',
    user_id: '',
    email: '',
    portal_link: '',
    portal_username: '',
    portal_password: '',
    partner: '',
    note: '',
    application_date: '',
    follow_up_date: '',
    comments: '',
  })

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
          const app = data.data
          
          setFormData({
            student_name: app.student_name || '',
            passport: app.passport || '',
            nationality: app.nationality || '',
            degree: app.degree || '',
            major: app.major || '',
            university_choice: app.university_choice || '',
            overview: app.overview || '',
            missing_docs: app.missing_docs || [],
            remarks_for_university: app.remarks_for_university || '',
            status: app.status || 'pending',
            user_id: app.user_id || '',
            email: app.email || '',
            portal_link: app.portal_link || '',
            portal_username: app.portal_username || '',
            portal_password: app.portal_password || '',
            partner: app.partner || '',
            note: app.note || '',
            application_date: app.application_date || '',
            follow_up_date: app.follow_up_date || '',
            comments: app.comments || '',
          })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.student_name.trim()) {
      toast.error('Student name is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch(`/api/admin/internal-apps/${appId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Application updated successfully')
        router.push('/admin/v2/internal-apps')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application')
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Application</h1>
          <p className="text-muted-foreground">Update application details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Basic student details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">Student Name *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport">Passport Number</Label>
                <Input
                  id="passport"
                  value={formData.passport}
                  onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                  placeholder="Enter passport number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Enter nationality"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Degree and major details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g., Bachelor, Master, PhD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Enter major/field of study"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>University choice and application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university_choice">University Choice</Label>
                <Input
                  id="university_choice"
                  value={formData.university_choice}
                  onChange={(e) => setFormData({ ...formData, university_choice: e.target.value })}
                  placeholder="Enter university name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_date">Application Date</Label>
                <Input
                  id="application_date"
                  type="date"
                  value={formData.application_date}
                  onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow Up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Missing Documents</Label>
              <MultiSelect
                options={MISSING_DOC_OPTIONS}
                selected={formData.missing_docs}
                onChange={(values) => setFormData({ ...formData, missing_docs: values })}
                placeholder="Select missing documents"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Comments</CardTitle>
            <CardDescription>Additional information and remarks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="overview">Overview</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                placeholder="Enter general overview about the student/application"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks_for_university">Remarks for University</Label>
              <Textarea
                id="remarks_for_university"
                value={formData.remarks_for_university}
                onChange={(e) => setFormData({ ...formData, remarks_for_university: e.target.value })}
                placeholder="Enter remarks specific to the university"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Enter internal notes"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Enter additional comments"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reference Information */}
        <Card>
          <CardHeader>
            <CardTitle>Reference Information</CardTitle>
            <CardDescription>Partner and portal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner">Partner</Label>
                <Input
                  id="partner"
                  value={formData.partner}
                  onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                  placeholder="Enter partner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  placeholder="Enter user ID (if applicable)"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="portal_link">Portal Link</Label>
                <Input
                  id="portal_link"
                  type="url"
                  value={formData.portal_link}
                  onChange={(e) => setFormData({ ...formData, portal_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal_username">Portal Username</Label>
                <Input
                  id="portal_username"
                  value={formData.portal_username}
                  onChange={(e) => setFormData({ ...formData, portal_username: e.target.value })}
                  placeholder="Enter portal username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal_password">Portal Password</Label>
                <Input
                  id="portal_password"
                  type="password"
                  value={formData.portal_password}
                  onChange={(e) => setFormData({ ...formData, portal_password: e.target.value })}
                  placeholder="Enter portal password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

      <Card className="border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/v2/internal-apps">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Application
            </Button>
          </div>
        </CardContent>
      </Card>
      </form>
    </div>
  )
}

export default function EditInternalAppPage() {
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
          <SiteHeader title="Edit Internal Application" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <EditInternalAppContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
