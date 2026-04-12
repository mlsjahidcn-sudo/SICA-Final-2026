"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { 
  IconSearch, 
  IconUsers, 
  IconUserCheck, 
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconMail,
  IconFileText,
  IconUser,
  IconUserPlus,
  IconEdit,
  IconTrash
} from "@tabler/icons-react"
import { DeleteStudentDialog } from "@/components/admin/delete-student-dialog"
import { ExportStudentsButton } from "@/components/admin/export-students-button"
import { ClaimInvitationDialog } from "@/components/admin/claim-invitation-dialog"

interface ReferredByPartner {
  full_name: string
  email: string
  company_name?: string
}

interface Student {
  id: string
  email: string | null
  full_name: string
  phone?: string | null
  nationality?: string | null
  avatar_url?: string | null
  is_active?: boolean
  created_at: string
  updated_at?: string
  referred_by_partner_id?: string | null
  source: 'individual' | 'partner_referred' | 'orphan'
  referred_by_partner: ReferredByPartner | null
  has_user_account?: boolean
  students?: {
    id: string
    first_name: string
    last_name: string
    passport_number?: string
    date_of_birth?: string
    gender?: string
    current_address?: string
    wechat_id?: string
  } | null
  applications?: {
    total: number
    pending: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  total: number
  individual: number
  partnerReferred: number
  orphan: number
  active: number
  newThisMonth: number
  withApplications: number
}

const ITEMS_PER_PAGE = 20

function StudentsListContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, individual: 0, partnerReferred: 0, orphan: 0, active: 0, newThisMonth: 0, withApplications: 0 })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  })

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [nationalityFilter, setNationalityFilter] = useState(searchParams.get('nationality') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || 'all')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))

  const nationalities = ['China', 'Nigeria', 'Pakistan', 'India', 'Bangladesh', 'Indonesia', 'Thailand', 'Vietnam', 'Russia', 'Kazakhstan']

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(nationalityFilter !== 'all' && { nationality: nationalityFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
      })

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        setPagination(data.pagination)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, nationalityFilter, statusFilter, sourceFilter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individual</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.individual}</div>
            <p className="text-xs text-muted-foreground">
              Self-registered students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner-Referred</CardTitle>
            <IconUserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partnerReferred}</div>
            <p className="text-xs text-muted-foreground">
              Added by partners
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphan Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orphan}</div>
            <p className="text-xs text-muted-foreground">
              Pending account claim
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <IconUserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100 || 0).toFixed(1)}% active rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Applications</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withApplications}</div>
            <p className="text-xs text-muted-foreground">
              Applied for programs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="partner_referred">Partner-Referred</SelectItem>
                  <SelectItem value="orphan">Orphan (Pending)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nationalities</SelectItem>
                  {nationalities.map((nat) => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <ExportStudentsButton search={searchQuery} source={sourceFilter} />
              <Button asChild>
                <Link href="/admin/v2/students/new">
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar_url ?? undefined} />
                          <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          {student.phone && (
                            <div className="text-xs text-muted-foreground">{student.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.email ? (
                        student.email
                      ) : (
                        <span className="text-muted-foreground italic">No account</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.nationality && (
                        <Badge variant="secondary">{student.nationality}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.source === 'individual' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1 cursor-default">
                              <IconUser className="h-3 w-3" />
                              Individual
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Self-registered student</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : student.source === 'partner_referred' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1 cursor-default border-primary/30 bg-primary/5 text-primary">
                              <IconUserPlus className="h-3 w-3" />
                              {student.referred_by_partner?.company_name || student.referred_by_partner?.full_name || 'Partner'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">Referred by Partner</p>
                              {student.referred_by_partner?.full_name && (
                                <p className="text-xs">{student.referred_by_partner.full_name}</p>
                              )}
                              {student.referred_by_partner?.company_name && (
                                <p className="text-xs text-muted-foreground">{student.referred_by_partner.company_name}</p>
                              )}
                              {student.referred_by_partner?.email && (
                                <p className="text-xs text-muted-foreground">{student.referred_by_partner.email}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1 cursor-default border-amber-500/30 bg-amber-50 text-amber-700">
                              <IconUser className="h-3 w-3" />
                              Orphan
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">Admin-Created (No Account)</p>
                              <p className="text-xs text-muted-foreground">Pending account claim</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.applications?.total || 0}</span>
                        {student.applications && student.applications.pending > 0 && (
                          <Badge variant="outline" className="text-amber-600">
                            {student.applications.pending} pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(student.created_at)}</TableCell>
                    <TableCell>
                      {student.source === 'orphan' ? (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-amber-700">
                          Pending Claim
                        </Badge>
                      ) : (
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
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
                            <Link href={`/admin/v2/students/${student.id}`}>
                              <IconEye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/v2/students/${student.id}/edit`}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {student.source === 'orphan' ? (
                            <ClaimInvitationDialog
                              studentId={student.id}
                              studentName={student.full_name}
                              onInvitationSent={fetchStudents}
                              trigger={
                                <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                  <IconMail className="mr-2 h-4 w-4" />
                                  Send Claim Invitation
                                </button>
                              }
                            />
                          ) : (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${student.email}`}>
                                <IconMail className="mr-2 h-4 w-4" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                            <DeleteStudentDialog 
                              studentId={student.id}
                              studentName={student.full_name}
                              hasApplications={(student.applications?.total || 0) > 0}
                              onStudentDeleted={fetchStudents}
                              trigger={
                                <button className="flex w-full items-center px-2 py-1.5 text-sm text-destructive">
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Delete
                                </button>
                              }
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} students
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={pagination.page === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={pagination.page === pagination.totalPages}
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

export default function StudentsPage() {
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
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <StudentsListContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
