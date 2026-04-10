'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import {
  User,
  GraduationCap,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Send,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  passport_number: string;
  passport_first_name: string;
  passport_last_name: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  current_address: string;
  permanent_address: string;
  highest_degree: string;
  graduation_school: string;
  graduation_date: string;
  gpa: string;
  chinese_level: string;
  chinese_test_score: string;
  chinese_test_date: string;
  english_level: string;
  english_test_type: string;
  english_test_score: string;
  english_test_date: string;
  study_plan: string;
  research_interest: string;
  career_goals: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  programs: {
    id: string;
    name: string;
    name_cn: string | null;
    degree_type: string;
    universities: {
      id: string;
      name_en: string;
      name_cn: string | null;
      city: string;
      province: string;
    };
  };
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface StatusHistory {
  id: string;
  status: string;
  comment: string | null;
  created_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: 'bg-gray-500/10 text-gray-600', icon: FileText, label: 'Draft' },
  submitted: { color: 'bg-blue-500/10 text-blue-600', icon: Send, label: 'Submitted' },
  under_review: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Under Review' },
  document_request: { color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle, label: 'Document Request' },
  interview_scheduled: { color: 'bg-purple-500/10 text-purple-600', icon: Calendar, label: 'Interview' },
  accepted: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, label: 'Accepted' },
  rejected: { color: 'bg-red-500/10 text-red-600', icon: XCircle, label: 'Rejected' },
  withdrawn: { color: 'bg-gray-500/10 text-gray-500', icon: XCircle, label: 'Withdrawn' },
};

export default function AdminApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplication = useCallback(async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
        setStatusHistory(data.status_history || []);
      } else {
        toast.error('Application not found');
        router.push('/admin/applications');
      }
    } catch {
      toast.error('Failed to load application');
      router.push('/admin/applications');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin' && applicationId) {
      fetchApplication();
    }
  }, [user, applicationId, fetchApplication]);

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment,
        }),
      });

      if (response.ok) {
        toast.success('Application updated successfully');
        fetchApplication();
        setNewStatus('');
        setComment('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update application');
      }
    } catch {
      toast.error('Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} text-base px-4 py-1`}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  if (authLoading || !user || user.role !== 'admin' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/applications">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {application.passport_first_name} {application.passport_last_name}
              </h1>
              <p className="text-muted-foreground">
                {application.email} • {application.nationality}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {application.programs.name} at {application.programs.universities.name_en}
                </span>
              </div>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status History */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((item, index) => {
                      const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
                      const Icon = config.icon;
                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`h-10 w-10 rounded-full ${config.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            {index < statusHistory.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border my-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{config.label}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(item.created_at)}
                              </span>
                            </div>
                            {item.comment && (
                              <p className="text-sm text-muted-foreground mt-1">{item.comment}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              by {item.users.full_name || item.users.email} ({item.users.role})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{application.passport_first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{application.passport_last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passport Number</p>
                    <p className="font-medium">{application.passport_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{application.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{formatDate(application.date_of_birth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{application.gender}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{application.email}</span>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{application.phone}</span>
                    </div>
                  )}
                </div>
                {application.current_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{application.current_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education Background */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Highest Degree</p>
                    <p className="font-medium">{application.highest_degree}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Graduation Date</p>
                    <p className="font-medium">{application.graduation_date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Graduation School</p>
                  <p className="font-medium">{application.graduation_school}</p>
                </div>
                {application.gpa && (
                  <div>
                    <p className="text-sm text-muted-foreground">GPA</p>
                    <p className="font-medium">{application.gpa}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Language Proficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language Proficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Chinese Level</p>
                    <p className="font-medium">{application.chinese_level || 'Not specified'}</p>
                  </div>
                  {application.chinese_test_score && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">HSK Score</p>
                        <p className="font-medium">{application.chinese_test_score}</p>
                      </div>
                      {application.chinese_test_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Test Date</p>
                          <p className="font-medium">{formatDate(application.chinese_test_date)}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">English Level</p>
                    <p className="font-medium">{application.english_level || 'Not specified'}</p>
                  </div>
                  {application.english_test_type && application.english_test_type !== 'None' && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Test Type / Score</p>
                        <p className="font-medium">{application.english_test_type} - {application.english_test_score}</p>
                      </div>
                      {application.english_test_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Test Date</p>
                          <p className="font-medium">{formatDate(application.english_test_date)}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Study Plan & Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Study Plan</p>
                  <p className="whitespace-pre-wrap text-sm">{application.study_plan}</p>
                </div>
                {application.research_interest && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Research Interest</p>
                    <p className="whitespace-pre-wrap text-sm">{application.research_interest}</p>
                  </div>
                )}
                {application.career_goals && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Career Goals</p>
                    <p className="whitespace-pre-wrap text-sm">{application.career_goals}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Status Update */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
                <CardDescription>
                  Change the application status and add comments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="document_request">Request Documents</SelectItem>
                      <SelectItem value="interview_scheduled">Schedule Interview</SelectItem>
                      <SelectItem value="accepted">Accept</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment for the student..."
                    rows={4}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting || !newStatus}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Update Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(application.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{application.submitted_at ? formatDate(application.submitted_at) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(application.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
