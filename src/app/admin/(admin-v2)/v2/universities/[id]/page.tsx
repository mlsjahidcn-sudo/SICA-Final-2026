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
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconEdit,
  IconBuilding,
  IconMapPin,
  IconStar,
  IconSchool,
  IconWorld,
  IconEye,
  IconTrophy,
  IconCalendar,
  IconCurrencyDollar,
  IconTag,
} from "@tabler/icons-react"

// Interface matching actual database schema
interface UniversityDetail {
  id: string
  name_en: string
  name_cn: string | null
  slug: string | null
  logo_url: string | null
  cover_image_url: string | null
  province: string
  city: string
  country: string | null
  location: string | null
  type: string | string[]
  category: string | null
  tier: string | null
  ranking_national: number | null
  ranking_world: number | null
  established_year: number | null
  website_url: string | null
  description: string | null
  facilities: string | null
  accommodation_available: boolean | null
  scholarship_available: boolean
  scholarship_percentage: number | null
  tuition_min: number | null
  tuition_max: number | null
  tuition_currency: string | null
  default_tuition_per_year: number | null
  default_tuition_currency: string | null
  has_application_fee: boolean | null
  application_deadline: string | null
  intake_months: number[] | null
  csca_required: boolean | null
  is_active: boolean
  meta_title: string | null
  meta_description: string | null
  tags: string[] | null
  created_at: string
  updated_at: string | null
  programs?: Array<{
    id: string
    name: string
    degree_level: string
    is_active: boolean
  }>
  _count?: {
    programs: number
  }
}

function UniversityDetailContent({ universityId }: { universityId: string }) {
  const router = useRouter()
  const [university, setUniversity] = useState<UniversityDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUniversity() {
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
        const response = await fetch(`/api/admin/universities/${universityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUniversity(data.university || data)
        } else {
          toast.error('Failed to load university details')
          router.push('/admin/v2/universities')
        }
      } catch (error) {
        console.error('Error fetching university:', error)
        toast.error('Failed to load university details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUniversity()
  }, [universityId, router])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!university) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        University not found
      </div>
    )
  }

  const formatIntakeMonths = (months: number[] | null) => {
    if (!months || months.length === 0) return '—'
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map(m => monthNames[m] || m).join(', ')
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/admin/v2/universities">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Universities
          </Link>
        </Button>
        <div className="flex gap-2">
          {university.website_url && (
            <Button variant="outline" asChild>
              <a href={university.website_url} target="_blank" rel="noopener noreferrer">
                <IconWorld className="mr-2 h-4 w-4" />
                Visit Website
              </a>
            </Button>
          )}
          <Button asChild>
            <Link href={`/admin/v2/universities/${university.id}/edit`}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit University
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* University Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {university.logo_url ? (
                    <img src={university.logo_url} alt={university.name_en} className="h-16 w-16 object-contain" />
                  ) : (
                    <IconBuilding className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{university.name_en}</h1>
                    {university.ranking_national && (
                      <Badge variant="secondary">
                        <IconTrophy className="mr-1 h-3 w-3" />
                        #{university.ranking_national} National
                      </Badge>
                    )}
                    {university.ranking_world && (
                      <Badge variant="outline">
                        #{university.ranking_world} World
                      </Badge>
                    )}
                  </div>
                  {university.name_cn && (
                    <p className="text-lg text-muted-foreground">{university.name_cn}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4" />
                      {university.city}, {university.province}
                    </span>
                    {university.established_year && (
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4" />
                        Est. {university.established_year}
                      </span>
                    )}
                  </div>
                  {university.slug && (
                    <p className="text-xs text-muted-foreground mt-1">Slug: {university.slug}</p>
                  )}
                </div>
                <div>
                  <Badge variant={university.is_active ? 'default' : 'secondary'}>
                    {university.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">
                    {Array.isArray(university.type) ? university.type.join(', ') || '—' : university.type || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{university.category || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tier</div>
                  <div className="font-medium">{university.tier || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div className="font-medium">{university.country || 'China'}</div>
                </div>
                {university.website_url && (
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Website</div>
                    <a 
                      href={university.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <IconWorld className="h-4 w-4" />
                      {university.website_url}
                    </a>
                  </div>
                )}
              </div>
              {university.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Description</div>
                    <p className="text-sm whitespace-pre-wrap">{university.description}</p>
                  </div>
                </>
              )}
              {university.facilities && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Facilities</div>
                    <p className="text-sm whitespace-pre-wrap">{university.facilities}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tuition & Admissions */}
          <Card>
            <CardHeader>
              <CardTitle>Tuition & Admissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Tuition Range</div>
                  <div className="font-medium flex items-center gap-1">
                    <IconCurrencyDollar className="h-4 w-4" />
                    {university.tuition_min || university.tuition_max ? (
                      <>
                        {university.tuition_min?.toLocaleString() || '—'} - {university.tuition_max?.toLocaleString() || '—'} {university.tuition_currency || 'CNY'}
                      </>
                    ) : (
                      'Contact for details'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Default Tuition/Year</div>
                  <div className="font-medium">
                    {university.default_tuition_per_year 
                      ? `${university.default_tuition_per_year.toLocaleString()} ${university.default_tuition_currency || 'CNY'}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Application Deadline</div>
                  <div className="font-medium">
                    {university.application_deadline 
                      ? new Date(university.application_deadline).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Intake Months</div>
                  <div className="font-medium">{formatIntakeMonths(university.intake_months)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Has Application Fee</div>
                  <Badge variant={university.has_application_fee ? 'default' : 'secondary'}>
                    {university.has_application_fee ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CSCA Required</div>
                  <Badge variant={university.csca_required ? 'default' : 'secondary'}>
                    {university.csca_required ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <IconSchool className="h-5 w-5" />
                  Programs
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/v2/programs?university_id=${university.id}`}>
                    View All
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!university.programs || university.programs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No programs yet
                </div>
              ) : (
                <div className="space-y-3">
                  {university.programs.slice(0, 5).map((program) => (
                    <div key={program.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{program.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {program.degree_level}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={program.is_active ? 'default' : 'secondary'}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/v2/programs/${program.id}`}>
                            View
                          </Link>
                        </Button>
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
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{university._count?.programs || 0}</div>
                  <div className="text-xs text-muted-foreground">Programs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{university.scholarship_percentage || 0}%</div>
                  <div className="text-xs text-muted-foreground">Scholarship %</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Scholarship Available</span>
                {university.scholarship_available ? (
                  <Badge className="bg-green-500/10 text-green-600">
                    <IconStar className="mr-1 h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accommodation</span>
                {university.accommodation_available ? (
                  <Badge className="bg-green-500/10 text-green-600">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {university.tags && university.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {university.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEO Info */}
          {(university.meta_title || university.meta_description) && (
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {university.meta_title && (
                  <div>
                    <div className="text-muted-foreground">Meta Title</div>
                    <div className="font-medium">{university.meta_title}</div>
                  </div>
                )}
                {university.meta_description && (
                  <div>
                    <div className="text-muted-foreground">Meta Description</div>
                    <div className="text-muted-foreground line-clamp-3">{university.meta_description}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/v2/programs/new?university_id=${university.id}`}>
                  <IconSchool className="mr-2 h-4 w-4" />
                  Add Program
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          <UniversityDetailContent universityId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
