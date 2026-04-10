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
  IconTrophy
} from "@tabler/icons-react"

interface UniversityDetail {
  id: string
  name_en: string
  name_cn: string | null
  short_name: string | null
  logo_url: string | null
  province: string
  city: string
  type: string | string[]
  category: string | null
  ranking_national: number | null
  website?: string
  description?: string
  scholarship_available: boolean
  is_active: boolean
  view_count: number
  created_at: string
  programs?: Array<{
    id: string
    name_en: string
    degree_level: string
    status: string
    _count?: { applications: number }
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
        <Button asChild>
          <Link href={`/admin/v2/universities/${university.id}/edit`}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit University
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* University Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                        #{university.ranking_national}
                      </Badge>
                    )}
                  </div>
                  {university.name_cn && (
                    <p className="text-lg text-muted-foreground">{university.name_cn}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4" />
                      {university.city}, {university.province}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconEye className="h-4 w-4" />
                      {university.view_count} views
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Short Name</div>
                  <div className="font-medium">{university.short_name || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">
                    {Array.isArray(university.type) ? university.type.join(', ') : university.type || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{university.category || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={university.is_active ? 'default' : 'secondary'}>
                    {university.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {university.website && (
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Website</div>
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <IconWorld className="h-4 w-4" />
                      {university.website}
                    </a>
                  </div>
                )}
              </div>
              {university.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Description</div>
                    <p className="text-sm">{university.description}</p>
                  </div>
                </>
              )}
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
                  <Link href={`/admin/v2/programs?university=${university.id}`}>
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
                        <div className="font-medium">{program.name_en}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {program.degree_level}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {program._count?.applications || 0} applications
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
                  <div className="text-2xl font-bold">{university.view_count}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
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
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/v2/programs/new?university=${university.id}`}>
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="University Details" />
          <UniversityDetailContent universityId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
