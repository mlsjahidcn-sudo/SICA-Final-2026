'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconCalendar,
  IconCalendarMonth,
  IconVideo,
  IconUser,
  IconSchool,
  IconRefresh,
  IconSearch,
  IconEye,
  IconExternalLink,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  platform: string | null;
  meeting_url: string | null;
  student_name: string;
  student_email: string;
  program_name: string;
  university_name: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  scheduled: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Completed' },
  cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Cancelled' },
  rescheduled: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Rescheduled' },
};

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  teams: 'Microsoft Teams',
  other: 'Video Call',
};

export default function MeetingsListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/partner/meetings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      } else {
        toast.error('Failed to load meetings');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        meeting.title.toLowerCase().includes(query) ||
        meeting.student_name?.toLowerCase().includes(query) ||
        meeting.program_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && meeting.status !== statusFilter) {
      return false;
    }

    // Time filter
    const meetingDate = new Date(meeting.meeting_date);
    if (timeFilter === 'past' && !isPast(meetingDate)) return false;
    if (timeFilter === 'today' && !isToday(meetingDate)) return false;
    if (timeFilter === 'upcoming' && !isFuture(meetingDate)) return false;

    return true;
  });

  // Group meetings by date
  const groupedMeetings = filteredMeetings.reduce((groups, meeting) => {
    const date = format(new Date(meeting.meeting_date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meeting);
    return groups;
  }, {} as Record<string, Meeting[]>);

  const sortedDates = Object.keys(groupedMeetings).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Meetings</h1>
          <p className="text-muted-foreground text-sm">
            View and manage your scheduled meetings
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => fetchMeetings()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/partner-v2/meetings/calendar">
              <IconCalendarMonth className="h-4 w-4 mr-2" />
              Calendar View
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Meetings List */}
      <div className="px-4 lg:px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IconCalendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium">No meetings found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No meetings scheduled yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  {isToday(new Date(date)) && (
                    <Badge variant="outline" className="ml-2">Today</Badge>
                  )}
                </h3>
                <div className="space-y-3">
                  {groupedMeetings[date].map(meeting => {
                    const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
                    const meetingDate = new Date(meeting.meeting_date);
                    const isUpcoming = isFuture(meetingDate);

                    return (
                      <Card key={meeting.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Time indicator */}
                            <div className={`
                              w-24 flex-shrink-0 flex flex-col items-center justify-center p-4
                              ${meeting.status === 'cancelled' ? 'bg-muted/50' : 'bg-primary/5'}
                            `}>
                              <span className="text-lg font-semibold">
                                {format(meetingDate, 'h:mm')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(meetingDate, 'a')}
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                {meeting.duration_minutes} min
                              </span>
                            </div>

                            {/* Meeting details */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{meeting.title}</h4>
                                    <Badge variant="outline" className={statusConfig.color}>
                                      {statusConfig.label}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <IconUser className="h-4 w-4" />
                                      <span>{meeting.student_name}</span>
                                      <span className="text-muted-foreground/50">•</span>
                                      <span>{meeting.student_email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <IconSchool className="h-4 w-4" />
                                      <span>{meeting.program_name} - {meeting.university_name}</span>
                                    </div>
                                    {meeting.platform && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <IconVideo className="h-4 w-4" />
                                        <span>{PLATFORM_LABELS[meeting.platform] || meeting.platform}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {meeting.meeting_url && isUpcoming && meeting.status === 'scheduled' && (
                                    <Button size="sm" asChild>
                                      <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                        <IconExternalLink className="h-4 w-4 mr-1" />
                                        Join
                                      </a>
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/partner-v2/meetings/${meeting.id}`}>
                                      <IconEye className="h-4 w-4 mr-1" />
                                      Details
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
