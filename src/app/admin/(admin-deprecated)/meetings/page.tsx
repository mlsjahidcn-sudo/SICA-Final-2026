'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Video,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  MoreHorizontal,
  Mail,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url?: string;
  meeting_platform?: string;
  student_id: string;
  admin_id: string;
  notes?: string;
  student: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  admin: {
    id: string;
    full_name: string;
  } | null;
}

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

const ITEMS_PER_PAGE = 15;

function MeetingsListContent() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: viewMode === 'calendar' ? '100' : ITEMS_PER_PAGE.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/meetings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error('Failed to load meetings');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, currentPage, viewMode]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: typeof Clock; label: string }> = {
      scheduled: { color: 'text-blue-600 bg-blue-500/10', icon: Clock, label: 'Scheduled' },
      completed: { color: 'text-green-600 bg-green-500/10', icon: CheckCircle2, label: 'Completed' },
      cancelled: { color: 'text-red-600 bg-red-500/10', icon: XCircle, label: 'Cancelled' },
    };
    const config = configs[status] || { color: '', icon: Clock, label: status };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn(config.color)}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const isUpcoming = (dateString: string, status: string) => {
    return status === 'scheduled' && new Date(dateString) > new Date();
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'zoom':
        return <Video className="h-4 w-4" />;
      case 'google meet':
        return <Video className="h-4 w-4" />;
      case 'teams':
        return <Video className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const getMeetingsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return (
        meetingDate.getFullYear() === year &&
        meetingDate.getMonth() === month &&
        meetingDate.getDate() === day
      );
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/30" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayMeetings = getMeetingsForDay(day);
      const isToday = (() => {
        const today = new Date();
        return (
          today.getDate() === day &&
          today.getMonth() === currentMonth.getMonth() &&
          today.getFullYear() === currentMonth.getFullYear()
        );
      })();

      days.push(
        <div
          key={day}
          className={cn(
            'h-24 border-t p-1 overflow-hidden',
            isToday && 'bg-primary/5'
          )}
        >
          <div className={cn(
            'text-sm font-medium mb-1',
            isToday && 'text-primary'
          )}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayMeetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="text-xs truncate px-1 py-0.5 rounded cursor-pointer hover:bg-muted"
                onClick={() => router.push(`/admin/meetings/${meeting.id}`)}
              >
                <span className="font-medium">{formatTime(meeting.scheduled_at)}</span>{' '}
                <span className="text-muted-foreground truncate">{meeting.title}</span>
              </div>
            ))}
            {dayMeetings.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayMeetings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium py-2 border-t">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Manage interviews and meetings with students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation or Filters */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
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
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'calendar' ? (
        renderCalendar()
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No meetings found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'all' ? 'Try adjusting your filters' : 'Meetings will appear here once scheduled'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting</TableHead>
                  <TableHead className="hidden md:table-cell">Student</TableHead>
                  <TableHead className="hidden lg:table-cell">Date & Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow
                    key={meeting.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/meetings/${meeting.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-9 w-9 rounded-lg flex items-center justify-center',
                          isUpcoming(meeting.scheduled_at, meeting.status)
                            ? 'bg-blue-500/10'
                            : 'bg-muted'
                        )}>
                          {getPlatformIcon(meeting.meeting_platform)}
                        </div>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 md:hidden">
                            <Calendar className="h-3 w-3" />
                            {formatDate(meeting.scheduled_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="font-medium">{meeting.student?.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {meeting.student?.email || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatDateTime(meeting.scheduled_at)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {meeting.duration_minutes || 30} min
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(meeting.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/meetings/${meeting.id}`}>
                              <User className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {meeting.meeting_url && meeting.status === 'scheduled' && (
                            <DropdownMenuItem asChild>
                              <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Join Meeting
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
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} meetings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminMeetingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <MeetingsListContent />
    </Suspense>
  );
}
