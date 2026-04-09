'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Loader2,
  ArrowLeft,
  Save,
  ExternalLink,
  Trash2,
  Plus,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  passport_first_name: string;
  passport_last_name: string;
  email: string;
  nationality: string;
  student_id: string;
  programs: {
    id: string;
    name_en: string;
    degree_type: string;
    universities: {
      id: string;
      name_en: string;
      city: string;
    };
  };
}

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
}

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Other' },
];

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const MEETING_TEMPLATES = [
  'Initial Interview',
  'Document Review',
  'Program Consultation',
  'Final Interview',
  'Follow-up Discussion',
];

export default function AdminMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New meeting form
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [meetingType, setMeetingType] = useState('video');
  const [platform, setPlatform] = useState('zoom');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchApplicationAndMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // Fetch application details
      const appResponse = await fetch(`/api/admin/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (appResponse.ok) {
        const data = await appResponse.json();
        setApplication(data.application);
      } else {
        toast.error('Failed to load application');
        router.push('/admin/applications');
        return;
      }
      
      // Fetch meetings for this application
      const meetingsResponse = await fetch(`/api/admin/meetings?application_id=${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (meetingsResponse.ok) {
        const data = await meetingsResponse.json();
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchApplicationAndMeetings();
    }
  }, [user, fetchApplicationAndMeetings]);

  const handleScheduleMeeting = async () => {
    if (!meetingTitle || !meetingDate || !meetingTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (meetingType === 'video' && !meetingUrl) {
      toast.error('Please enter a meeting URL for video meetings');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
      
      const response = await fetch('/api/admin/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          student_id: application?.student_id,
          scheduled_by: user?.id,
          title: meetingTitle,
          description: meetingDescription,
          meeting_date: meetingDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          meeting_type: meetingType,
          platform: meetingType === 'video' ? platform : null,
          meeting_url: meetingType === 'video' ? meetingUrl : null,
          meeting_id_external: meetingId || null,
          meeting_password: meetingPassword || null,
          notes: meetingNotes || null,
        }),
      });
      
      if (response.ok) {
        toast.success('Meeting scheduled successfully');
        setShowScheduleDialog(false);
        resetForm();
        fetchApplicationAndMeetings();
        
        // Send notification email
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: application?.email,
            template: 'meeting_scheduled',
            data: {
              student_name: `${application?.passport_first_name} ${application?.passport_last_name}`,
              meeting_title: meetingTitle,
              meeting_date: meetingDateTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              meeting_time: meetingDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              duration: `${duration} minutes`,
              meeting_url: meetingUrl,
              platform: platform,
            },
          }),
        });
      } else {
        toast.error('Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!meetingToCancel) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/admin/meetings/${meetingToCancel}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancelled_by: user?.id,
          reason: cancelReason,
        }),
      });
      
      if (response.ok) {
        toast.success('Meeting cancelled');
        setShowCancelDialog(false);
        setMeetingToCancel(null);
        setCancelReason('');
        fetchApplicationAndMeetings();
      } else {
        toast.error('Failed to cancel meeting');
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast.error('Failed to cancel meeting');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setMeetingTitle('');
    setMeetingDescription('');
    setMeetingDate('');
    setMeetingTime('');
    setDuration('30');
    setMeetingType('video');
    setPlatform('zoom');
    setMeetingUrl('');
    setMeetingId('');
    setMeetingPassword('');
    setMeetingNotes('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      scheduled: { color: 'bg-blue-500/10 text-blue-600', label: 'Scheduled' },
      completed: { color: 'bg-green-500/10 text-green-600', label: 'Completed' },
      cancelled: { color: 'bg-red-500/10 text-red-600', label: 'Cancelled' },
      rescheduled: { color: 'bg-amber-500/10 text-amber-600', label: 'Rescheduled' },
    };
    const config = configs[status] || configs.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (authLoading || !user || user.role !== 'admin' || isLoading) {
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
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/admin/applications/${applicationId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Application
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold">Meeting Schedule</h1>
          <p className="text-muted-foreground mt-1">
            {application?.passport_first_name} {application?.passport_last_name} • {application?.programs?.name_en}
          </p>
        </div>

        {/* Schedule New Meeting Button */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Schedule a Meeting</h3>
                <p className="text-sm text-muted-foreground">
                  Set up an interview or consultation with the applicant
                </p>
              </div>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Meetings</CardTitle>
            <CardDescription>
              All meetings for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meetings scheduled yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{meeting.title}</h4>
                          {getStatusBadge(meeting.status)}
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(meeting.meeting_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {meeting.duration_minutes} minutes
                          </div>
                          {meeting.meeting_type === 'video' && meeting.meeting_url && (
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              <span className="capitalize">{meeting.platform?.replace('_', ' ')}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => copyToClipboard(meeting.meeting_url!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              {meeting.status === 'scheduled' && (
                                <a
                                  href={meeting.meeting_url!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Join
                                </a>
                              )}
                            </div>
                          )}
                          {meeting.meeting_type === 'in_person' && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              In-person meeting
                            </div>
                          )}
                          {meeting.description && (
                            <p className="mt-2">{meeting.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {meeting.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setMeetingToCancel(meeting.id);
                            setShowCancelDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Meeting Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription>
                Schedule an interview or consultation with {application?.passport_first_name} {application?.passport_last_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Meeting Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Initial Interview"
                  />
                  <Select onValueChange={setMeetingTitle}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TEMPLATES.map((template) => (
                        <SelectItem key={template} value={template}>
                          {template}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="What will be discussed in this meeting?"
                  rows={2}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    min={getMinDate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={meetingType === 'video' ? 'default' : 'outline'}
                    onClick={() => setMeetingType('video')}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                  <Button
                    type="button"
                    variant={meetingType === 'in_person' ? 'default' : 'outline'}
                    onClick={() => setMeetingType('in_person')}
                    className="flex-1"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    In Person
                  </Button>
                </div>
              </div>

              {/* Video Meeting Details */}
              {meetingType === 'video' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">Meeting URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meetingId">Meeting ID</Label>
                      <Input
                        id="meetingId"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="123 456 7890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        value={meetingPassword}
                        onChange={(e) => setMeetingPassword(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Notes visible only to admins"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleMeeting} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Meeting Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Meeting</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this meeting? The student will be notified.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Rescheduling to a later date"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Meeting
              </Button>
              <Button variant="destructive" onClick={handleCancelMeeting} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Cancel Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
