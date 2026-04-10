'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  IconArrowLeft,
  IconCalendar,
  IconVideo,
  IconUser,
  IconSchool,
  IconFileText,
  IconExternalLink,
  IconLink,
  IconLock,
  IconRefresh,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format, isFuture } from 'date-fns';

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
  meeting_id_external: string | null;
  meeting_password: string | null;
  notes: string | null;
  student_id: string;
  student_name: string;
  student_email: string;
  application_id: string;
  program_name: string;
  degree_type: string;
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

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeeting = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      const response = await fetch(`/api/partner/meetings/${meetingId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
      } else {
        toast.error('Meeting not found');
        router.push('/partner-v2/meetings');
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast.error('Failed to load meeting');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, router]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  if (isLoading) {
    return (
      <div className="px-4 py-4 md:py-6 lg:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="px-4 py-4 md:py-6 lg:px-6">
        <p>Meeting not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
  const meetingDate = new Date(meeting.meeting_date);
  const isUpcoming = isFuture(meetingDate);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{meeting.title}</h1>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Meeting details and participant information
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchMeeting()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  Meeting Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(meetingDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {format(meetingDate, 'h:mm a')} ({meeting.duration_minutes} minutes)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{meeting.meeting_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium">
                      {meeting.platform ? PLATFORM_LABELS[meeting.platform] : 'Not specified'}
                    </p>
                  </div>
                </div>

                {meeting.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{meeting.description}</p>
                    </div>
                  </>
                )}

                {meeting.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm">{meeting.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Video Conference Details */}
            {meeting.platform && meeting.meeting_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconVideo className="h-5 w-5" />
                    Video Conference
                  </CardTitle>
                  <CardDescription>
                    Connection details for the online meeting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{PLATFORM_LABELS[meeting.platform]}</p>
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {meeting.meeting_url}
                        </p>
                      </div>
                      {isUpcoming && meeting.status === 'scheduled' && (
                        <Button asChild>
                          <a href={meeting.meeting_url!} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {meeting.meeting_id_external && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <IconLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Meeting ID</p>
                        <p className="font-mono text-sm">{meeting.meeting_id_external}</p>
                      </div>
                    </div>
                  )}

                  {meeting.meeting_password && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <IconLock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Password</p>
                        <p className="font-mono text-sm">{meeting.meeting_password}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUser className="h-5 w-5" />
                  Student
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {meeting.student_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{meeting.student_name}</p>
                    <p className="text-sm text-muted-foreground">{meeting.student_email}</p>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/partner-v2/students/${meeting.student_id}`}>
                    View Student Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconSchool className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{meeting.university_name}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{meeting.program_name}</p>
                    <p className="text-xs text-muted-foreground">{meeting.degree_type}</p>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/partner-v2/applications/${meeting.application_id}`}>
                    View Application
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/partner-v2/applications/${meeting.application_id}/documents`}>
                    <IconFileText className="h-4 w-4 mr-2" />
                    View Documents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
