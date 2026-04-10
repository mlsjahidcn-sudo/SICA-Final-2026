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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { 
  IconSearch, 
  IconFileText,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconCalendar,
  IconSend,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconSchool,
  IconMapPin,
  IconFilter,
  IconList,
  IconLayoutGrid
} from "@tabler/icons-react"

interface Application {
  id: string
  status: string
  priority: string | null
  notes: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  program: {
    id: string
    name: string
    degree_level: string
    university: {
      id: string
      name_en: string
      city: string
      province: string
    } | null
  } | null
  student: {
    id: string
    user_id: string
    full_name: string | null
    email: string | null
    nationality: string | null
    gender: string | null
    highest_education: string | null
  }
}

interface Stats {
  total: number
  submitted: number
  under_review: number
  document_request: number
  interview_scheduled: number
  accepted: number
  rejected: number
}

interface University {
  id: string
  name_en: string
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: typeof IconClock; label: string }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-500/10', icon: IconFileText, label: 'Draft' },
  submitted: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: IconSend, label: 'Submitted' },
  under_review: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: IconClock, label: 'Under Review' },
  document_request: { color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: IconAlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'text-purple-600', bgColor: 'bg-purple-500/10', icon: IconCalendar, label: 'Interview' },
  accepted: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: IconCircleCheck, label: 'Accepted' },
  rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: IconCircleX, label: 'Rejected' },
  withdrawn: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: IconCircleX, label: 'Withdrawn' },
}

const ITEMS_PER_PAGE = 15

function ApplicationsListContent() {
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, under_review: 0, document_request: 0, interview_scheduled: 0, accepted: 0, rejected: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [universities, setUniversities] = useState<University[]>([])

  const fetchUniversities = useCallback(async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/universities?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities || [])
      }
    } catch (error) {
      console.error('Error fetching universities:', error)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (universityFilter !== 'all') params.append('university_id', universityFilter)
      if (degreeFilter !== 'all') params.append('degree_type', degreeFilter)
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', currentPage.toString())
      params.append('limit', ITEMS_PER_PAGE.toString())

      const response = await fetch(`/api/admin/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setTotalCount(data.total || 0)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, universityFilter, degreeFilter, searchQuery, currentPage])

  useEffect(() => {
    fetchUniversities()
  }, [fetchUniversities])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted + stats.under_review}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.accepted / stats.total) * 100 || 0).toFixed(1)}% acceptance rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interview_scheduled}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Badge>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = stats[status as keyof Stats] || 0
              if (count === 0 && status !== 'submitted' && status !== 'under_review') return null
              return (
                <Badge 
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  className={`cursor-pointer ${config.bgColor} ${config.color}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {config.label} ({count})
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>{uni.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Degrees</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="language">Language</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft
                  const StatusIcon = statusConfig.icon
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {app.student?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">{app.student?.email || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{app.program?.name || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconMapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{app.program?.university?.name_en || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {app.program?.degree_level || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.submitted_at ? formatDate(app.submitted_at) : 'Not submitted'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/v2/applications/${app.id}`}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/v2/applications/${app.id}/meeting`}>
                                <IconCalendar className="mr-2 h-4 w-4" />
                                Schedule Meeting
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                {totalCount} applications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ApplicationsPage() {
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
          <SiteHeader title="Applications" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <ApplicationsListContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
