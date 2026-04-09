"use client"

import { useEffect, useState, useCallback } from "react"
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
  IconCalendar,
  IconClock,
  IconVideo,
  IconUser,
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconMail,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconPlus
} from "@tabler/icons-react"

interface Meeting {
  id: string
  title: string
  scheduled_at: string
  duration_minutes: number
  status: string
  meeting_url?: string
  meeting_platform?: string
  student_id: string
  admin_id: string
  notes?: string
  student: {
    id: string
    full_name: string
    email: string
  } | null
  admin: {
    id: string
    full_name: string
  } | null
}

interface Stats {
  total: number
  upcoming: number
  completed: number
  cancelled: number
}

const ITEMS_PER_PAGE = 15

export default function MeetingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('sica_auth_token')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/meetings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
        setTotalCount(data.total || 0)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load meetings')
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast.error('Failed to load meetings')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchMeetings()
    }
  }, [fetchMeetings, user])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; bgColor: string; icon: typeof IconCalendar }> = {
      scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: IconCalendar },
      completed: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: IconCircleCheck },
      cancelled: { color: 'text-red-600', bgColor: 'bg-red-500/10', icon: IconCircleX },
    }
    const c = config[status] || config.scheduled
    return (
      <Badge className={`${c.bgColor} ${c.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

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
          <SiteHeader title="Meetings" />
          <div className="flex flex-col gap-6 p-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
                  <p className="text-xs text-muted-foreground">Scheduled meetings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <IconCircleX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Meetings Table */}
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No meetings found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Meeting</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meetings.map((meeting) => (
                        <TableRow key={meeting.id}>
                          <TableCell>
                            <div className="font-medium">{meeting.title}</div>
                            {meeting.notes && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {meeting.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {meeting.student ? (
                              <div>
                                <div className="font-medium">{meeting.student.full_name}</div>
                                <div className="text-xs text-muted-foreground">{meeting.student.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDateTime(meeting.scheduled_at)}</TableCell>
                          <TableCell>{meeting.duration_minutes} min</TableCell>
                          <TableCell>
                            {meeting.meeting_platform ? (
                              <Badge variant="secondary">{meeting.meeting_platform}</Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <IconDotsVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {meeting.meeting_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                      <IconVideo className="mr-2 h-4 w-4" />
                                      Join Meeting
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                {meeting.student && (
                                  <DropdownMenuItem asChild>
                                    <a href={`mailto:${meeting.student.email}`}>
                                      <IconMail className="mr-2 h-4 w-4" />
                                      Email Student
                                    </a>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                      {totalCount} meetings
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
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
