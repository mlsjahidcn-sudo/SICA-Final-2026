'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  IconFile,
  IconFiles,
  IconCheck,
  IconX,
  IconClock,
  IconDownload,
  IconUpload,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconCalendarDue,
  IconAlertCircle,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { FileUpload, DocumentTypeSelect } from '@/components/ui/file-upload';
import { getDocumentTypeLabel, denormalizeDocumentType } from '@/lib/document-types';

interface PartnerDocument {
  id: string;
  type: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  status: string;
  rejection_reason?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  uploaded_at?: string | null;
  url?: string;
  student_id?: string | null;
  application_id?: string | null;
}

export function PartnerProfileDocumentsTab() {
  const [documents, setDocuments] = React.useState<PartnerDocument[]>([]);
  const [stats, setStats] = React.useState({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [selectedDocType, setSelectedDocType] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/partner/profile/documents?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setStats(data.stats || { total: 0, verified: 0, pending: 0, rejected: 0 });
      } else {
        const data = await response.json().catch(() => ({}));
        console.error('Failed to fetch partner documents:', data.error || response.statusText);
        setDocuments([]);
        setStats({ total: 0, verified: 0, pending: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Error fetching partner documents:', error);
      setDocuments([]);
      setStats({ total: 0, verified: 0, pending: 0, rejected: 0 });
    }

    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
      verified: { icon: <IconCheck className="h-3 w-3 mr-1" />, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Verified' },
      pending: { icon: <IconClock className="h-3 w-3 mr-1" />, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
      rejected: { icon: <IconX className="h-3 w-3 mr-1" />, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
    };
    const c = config[status] || config.pending;
    return <Badge className={c.className}>{c.icon}{c.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExpiryInfo = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { label: 'Expired', days: Math.abs(daysLeft), variant: 'destructive' as const };
    } else if (daysLeft <= 30) {
      return { label: `${daysLeft}d left`, days: daysLeft, variant: 'warning' as const };
    }
    return { label: formatDate(expiresAt), days: daysLeft, variant: 'normal' as const };
  };

  const handleDelete = async (id: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/partner/profile/documents/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        toast.success('Document deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete document');
      }
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const response = await fetch(`/api/documents/${documentId}/url`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        const fileResponse = await fetch(data.url);
        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        toast.error('Failed to get download link');
      }
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleUpload = async (file: File) => {
    if (!selectedDocType) {
      toast.error('Please select a document type');
      return;
    }

    setUploading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const formData = new FormData();
      formData.append('type', selectedDocType);
      formData.append('file', file);

      const response = await fetch('/api/partner/profile/documents', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setUploadDialogOpen(false);
        setSelectedDocType('');
        fetchDocuments();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">My Documents</h2>
          <p className="text-sm text-muted-foreground">Manage your organization documents and certificates</p>
        </div>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Select a document type and upload your file. Documents will be reviewed by our team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <DocumentTypeSelect
                  value={selectedDocType}
                  onChange={setSelectedDocType}
                />
              </div>

              {selectedDocType && (
                <FileUpload
                  onUpload={handleUpload}
                  documentType={getDocumentTypeLabel(selectedDocType)}
                  maxSize={10}
                  disabled={uploading}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconFiles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Verified</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => { setLoading(true); fetchDocuments(); }}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({documents.length})</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${documents.length} documents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <IconFiles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                Upload your business certificates, licenses, and other documents
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <IconUpload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const expiryInfo = getExpiryInfo(doc.expires_at);
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        doc.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30' :
                        doc.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        <IconFile className={`h-6 w-6 ${
                          doc.status === 'verified' ? 'text-green-600' :
                          doc.status === 'rejected' ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {getDocumentTypeLabel(denormalizeDocumentType(doc.type))}
                          </h3>
                          {getStatusBadge(doc.status)}
                          {expiryInfo && (
                            <Badge
                              variant={expiryInfo.variant === 'destructive' ? 'destructive' : 'outline'}
                              className={
                                expiryInfo.variant === 'warning'
                                  ? 'border-orange-300 text-orange-700 bg-orange-50'
                                  : ''
                              }
                            >
                              <IconCalendarDue className="h-3 w-3 mr-1" />
                              {expiryInfo.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {doc.file_name} &middot; {formatFileSize(doc.file_size)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Uploaded: {formatDate(doc.uploaded_at || doc.created_at)}</span>
                          {doc.content_type && (
                            <span>&middot; {doc.content_type.split('/')[1]?.toUpperCase() || doc.content_type}</span>
                          )}
                        </div>
                        {doc.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-2">
                            <IconAlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
                              <p className="text-sm text-red-600 dark:text-red-300">{doc.rejection_reason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                      >
                        <IconDownload className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {doc.status === 'rejected' && (
                        <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                          <IconUpload className="h-4 w-4 mr-1" />
                          Re-upload
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{doc.file_name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
