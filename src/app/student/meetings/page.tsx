'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Loader2,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_type: string;
  platform: string | null;
  meeting_url: string | null;
  meeting_id_external: string | null;
  meeting_password: string | null;
  status: string;
  notes: string | null;
  applications: {
    id: string;
    status: string;
    programs: {
      name_en: string;
      degree_type: string;
      universities: {
        name_en: string;
        city: string;
      };
    };
  };
}

export default function StudentMeetingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/meetings?user_id=${user?.id}`, {
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
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilMeeting = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const now = new Date();
    const diffMs = meetingDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Past';
    if (diffMins < 60) return `In ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return null;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: typeof Calendar; label: string }> = {
      scheduled: { color: 'bg-blue-500/10 text-blue-600', icon: Calendar, label: 'Scheduled' },
      completed: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, label: 'Completed' },
      cancelled: { color: 'bg-red-500/10 text-red-600', icon: XCircle, label: 'Cancelled' },
      rescheduled: { color: 'bg-amber-500/10 text-amber-600', icon: AlertCircle, label: 'Rescheduled' },
    };
    const config = configs[status] || configs.scheduled;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && new Date(m.meeting_date) > new Date()
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === 'completed' || new Date(m.meeting_date) <= new Date()
  );
  const cancelledMeetings = meetings.filter((m) => m.status === 'cancelled');

  // Calendar view helpers
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((m) => {
      const meetingDate = new Date(m.meeting_date);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderMeetingCard = (meeting: Meeting) => {
    const timeUntil = getTimeUntilMeeting(meeting.meeting_date);
    const isUpcoming = meeting.status === 'scheduled' && new Date(meeting.meeting_date) > new Date();
    
    return (
      <Card key={meeting.id} className={isUpcoming ? 'border-primary/50' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{meeting.title}</h3>
              <p className="text-sm text-muted-foreground">
                {meeting.applications.programs.name_en} • {meeting.applications.programs.universities.name_en}
              </p>
            </div>
            {getStatusBadge(meeting.status)}
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDateTime(meeting.meeting_date)}
              {timeUntil && timeUntil !== 'Past' && (
                <Badge variant="outline" className="ml-2">
                  {timeUntil}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {meeting.duration_minutes} minutes
            </div>

            {meeting.meeting_type === 'video' && meeting.meeting_url && (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{meeting.platform?.replace('_', ' ')}</span>
                {isUpcoming && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(meeting.meeting_url!)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <a
                      href={meeting.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="h-6">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Join Now
                      </Button>
                    </a>
                  </>
                )}
              </div>
            )}

            {meeting.meeting_type === 'in_person' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                In-person meeting
              </div>
            )}

            {(meeting.meeting_id_external || meeting.meeting_password) && isUpcoming && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                {meeting.meeting_id_external && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Meeting ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{meeting.meeting_id_external}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1"
                        onClick={() => copyToClipboard(meeting.meeting_id_external!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {meeting.meeting_password && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{meeting.meeting_password}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1"
                        onClick={() => copyToClipboard(meeting.meeting_password!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {meeting.description && (
              <p className="mt-2 text-muted-foreground">{meeting.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Meetings</h1>
          <p className="text-muted-foreground mt-1">
            View your scheduled interviews and consultations
          </p>
        </div>

        {/* Quick Stats */}
        {upcomingMeetings.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Upcoming meeting{upcomingMeetings.length > 1 ? 's' : ''}
                  </p>
                </div>
                {upcomingMeetings[0] && (
                  <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground">Next meeting</p>
                    <p className="font-medium">{formatDateShort(upcomingMeetings[0].meeting_date)}</p>
                    <p className="text-sm text-primary">{formatTime(upcomingMeetings[0].meeting_date)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meetings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Upcoming Meetings</h3>
                  <p className="text-sm text-muted-foreground">
                    You don&apos;t have any scheduled meetings at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingMeetings.map(renderMeetingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Past Meetings</h3>
                  <p className="text-sm text-muted-foreground">
                    Your completed meetings will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastMeetings.map(renderMeetingCard)
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Cancelled Meetings</h3>
                  <p className="text-sm text-muted-foreground">
                    Cancelled meetings will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              cancelledMeetings.map(renderMeetingCard)
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you need to reschedule or have questions about your meeting, please contact us at{' '}
              <a href="mailto:info@studyinchina.academy" className="text-primary hover:underline">
                info@studyinchina.academy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
