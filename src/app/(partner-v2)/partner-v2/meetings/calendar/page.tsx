'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconCalendar,
  IconList,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconVideo,
  IconUser,
  IconRefresh,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  platform: string;
  student_name: string;
  program_name: string;
  university_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  rescheduled: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const PLATFORM_ICONS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  teams: 'Teams',
  other: 'Video Call',
};

export default function MeetingsCalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
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

  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      isSameDay(new Date(meeting.meeting_date), date)
    );
  };

  // Get selected date meetings
  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get day of week names
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Meetings Calendar</h1>
          <p className="text-muted-foreground text-sm">
            View and manage your scheduled meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchMeetings()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/partner-v2/meetings">
              <IconList className="h-4 w-4 mr-2" />
              List View
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={goToPreviousMonth}>
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={goToNextMonth}>
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square p-1" />
                ))}

                {/* Days of month */}
                {days.map(day => {
                  const dayMeetings = getMeetingsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasMeetings = dayMeetings.length > 0;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-1 rounded-lg text-sm transition-colors relative
                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                        ${isToday(day) && !isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                        ${!isSelected && hasMeetings ? 'bg-muted/50 hover:bg-muted' : ''}
                        ${!isSelected && !hasMeetings ? 'hover:bg-muted/50' : ''}
                      `}
                    >
                      <span className={`${isToday(day) && !isSelected ? 'font-bold' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {hasMeetings && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayMeetings.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-1 rounded-full ${
                                isSelected ? 'bg-primary-foreground' : 'bg-primary'
                              }`}
                            />
                          ))}
                          {dayMeetings.length > 3 && (
                            <div className={`h-1 w-1 rounded-full ${
                              isSelected ? 'bg-primary-foreground/50' : 'bg-primary/50'
                            }`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Date'}
              </CardTitle>
              <CardDescription>
                {selectedDateMeetings.length} meeting{selectedDateMeetings.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : !selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconCalendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Click on a date to view meetings</p>
                </div>
              ) : selectedDateMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconClock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No meetings scheduled</p>
                  <p className="text-sm mt-1">for {format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateMeetings.map(meeting => (
                    <Link
                      key={meeting.id}
                      href={`/partner-v2/meetings/${meeting.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{meeting.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <IconClock className="h-3 w-3" />
                              <span>
                                {format(new Date(meeting.meeting_date), 'h:mm a')}
                                {' '}({meeting.duration_minutes} min)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <IconUser className="h-3 w-3" />
                              <span className="truncate">{meeting.student_name}</span>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={STATUS_COLORS[meeting.status] || ''}
                          >
                            {meeting.status}
                          </Badge>
                        </div>
                        {meeting.platform && (
                          <div className="mt-2 flex items-center gap-1">
                            <IconVideo className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {PLATFORM_ICONS[meeting.platform] || meeting.platform}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
