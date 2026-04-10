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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  FileText,
  Image,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  File,
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  document_type: string;
  file_key: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  verified_at?: string;
}

interface Application {
  id: string;
  status: string;
  passport_first_name: string;
  passport_last_name: string;
  email: string;
  programs: {
    name: string;
    universities: {
      name_en: string;
    };
  };
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  diploma: 'Diploma/Certificate',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  other: 'Other Document',
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof File; label: string }> = {
  pending: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: AlertCircle, label: 'Pending Review' },
  verified: { color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2, label: 'Verified' },
  rejected: { color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle, label: 'Rejected' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image;
  return FileText;
}

export default function AdminDocumentReviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplicationAndDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // Fetch application
      const appResponse = await fetch(`/api/admin/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (appResponse.ok) {
        const data = await appResponse.json();
        setApplication(data.application);
      }

      // Fetch documents
      const docsResponse = await fetch(`/api/documents?application_id=${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (docsResponse.ok) {
        const data = await docsResponse.json();
        setDocuments(data.documents || []);
      }
    } catch {
      toast.error('Failed to load data');
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
      fetchApplicationAndDocuments();
    }
  }, [user, applicationId, fetchApplicationAndDocuments]);

  const handleVerify = async (docId: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'verified' }),
      });

      if (response.ok) {
        toast.success('Document verified');
        fetchApplicationAndDocuments();
      } else {
        toast.error('Failed to verify document');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      });

      if (response.ok) {
        toast.success('Document rejected');
        setRejectDialog(false);
        fetchApplicationAndDocuments();
      } else {
        toast.error('Failed to reject document');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const urlResponse = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get download URL');
      }

      const { url } = await urlResponse.json();
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = doc.file_name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const urlResponse = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get view URL');
      }

      const { url } = await urlResponse.json();
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to generate preview URL');
    }
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

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const verifiedDocs = documents.filter(d => d.status === 'verified');
  const rejectedDocs = documents.filter(d => d.status === 'rejected');

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

          <h1 className="text-3xl font-bold mb-2">Document Review</h1>
          {application && (
            <p className="text-muted-foreground">
              {application.passport_first_name} {application.passport_last_name} • {application.email}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{pendingDocs.length}</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{verifiedDocs.length}</div>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{rejectedDocs.length}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No Documents Uploaded</h3>
              <p className="text-muted-foreground">
                The student has not uploaded any documents yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Review and verify uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc, index) => {
                  const statusConfig = STATUS_CONFIG[doc.status];
                  const StatusIcon = statusConfig.icon;
                  const FileIcon = getFileIcon(doc.content_type);

                  return (
                    <div key={doc.id}>
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                              </h4>
                              <Badge variant="outline" className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {doc.file_name} • {formatFileSize(doc.file_size)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                <strong>Rejection Reason:</strong> {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(doc)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {doc.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(doc.id)}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openRejectDialog(doc)}
                                disabled={isSubmitting}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Info */}
        {application && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Application Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Program:</span>
                  <p className="font-medium">{application.programs.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">University:</span>
                  <p className="font-medium">{application.programs.universities.name_en}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Applicant:</span>
                  <p className="font-medium">{application.passport_first_name} {application.passport_last_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{application.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
