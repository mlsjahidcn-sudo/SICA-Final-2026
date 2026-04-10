'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  File,
  FileImage,
  FileCheck,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  document_type: string;
  file_key: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  url?: string;
  created_at: string;
  verified_at?: string;
  application_id: string;
  applications: {
    id: string;
    status: string;
    programs: {
      id: string;
      name: string;
      universities: {
        id: string;
        name_en: string;
      };
    };
  };
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  photo: 'Passport Photo',
  diploma: 'Diploma/Certificate',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  recommendation: 'Recommendation Letter',
  other: 'Other Document',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  verified: { label: 'Verified', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
};

const FILE_ICONS: Record<string, typeof File> = {
  'application/pdf': FileText,
  'image/jpeg': FileImage,
  'image/png': FileImage,
};

export default function DocumentCenterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // Fetch all applications for the user, then fetch documents
      const appsResponse = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!appsResponse.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const appsData = await appsResponse.json();
      const applications = appsData.applications || [];
      
      // Fetch documents for each application
      const documentsPromises = applications.map((app: { id: string }) =>
        fetch(`/api/documents?application_id=${app.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json())
      );
      
      const documentsResults = await Promise.all(documentsPromises);
      
      // Combine all documents with application info
      const allDocuments: Document[] = [];
      applications.forEach((app: { id: string; status: string; programs: { id: string; name: string; universities: { id: string; name_en: string } } }, index: number) => {
        const docs = documentsResults[index]?.documents || [];
        docs.forEach((doc: Document) => {
          allDocuments.push({
            ...doc,
            applications: {
              id: app.id,
              status: app.status,
              programs: app.programs,
            },
          });
        });
      });
      
      // Sort by created_at desc
      allDocuments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  const handleDownload = async (doc: Document) => {
    try {
      if (doc.url) {
        // Use fetch to download with blob
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.file_name;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch(`/api/documents?id=${doc.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Document deleted');
        fetchDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.status === filter;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    verified: documents.filter(d => d.status === 'verified').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
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
      <div className="container px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Document Center</h1>
              <p className="text-muted-foreground mt-1">
                Manage all your uploaded documents in one place
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Documents</CardTitle>
                <CardDescription>
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="verified">Verified</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="py-16 text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No documents uploaded yet' : `No ${filter} documents`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Documents will appear here when you upload them for your applications
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => {
                  const statusConfig = STATUS_CONFIG[doc.status];
                  const StatusIcon = statusConfig.icon;
                  const FileIcon = FILE_ICONS[doc.content_type] || File;
                  
                  return (
                    <div
                      key={doc.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* File Icon */}
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-6 w-6 text-primary" />
                      </div>
                      
                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium truncate">{doc.file_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                            </p>
                          </div>
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {/* Application Info */}
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Application: </span>
                          <Link
                            href={`/student/applications/${doc.application_id}`}
                            className="text-primary hover:underline"
                          >
                            {doc.applications?.programs?.name || 'Unknown Program'}
                            <ExternalLink className="h-3 w-3 inline ml-1" />
                          </Link>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span>{doc.applications?.programs?.universities?.name_en || 'Unknown University'}</span>
                        </div>
                        
                        {/* File Details */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>Uploaded {formatDate(doc.created_at)}</span>
                          {doc.verified_at && (
                            <span>Verified {formatDate(doc.verified_at)}</span>
                          )}
                        </div>
                        
                        {/* Rejection Reason */}
                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <div className="mt-2 p-2 rounded bg-red-500/10 text-sm text-red-600">
                            <strong>Rejection Reason:</strong> {doc.rejection_reason}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(doc)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {doc.status === 'rejected' && (
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(doc)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedDoc?.file_name}</DialogTitle>
              <DialogDescription>
                {DOCUMENT_TYPE_LABELS[selectedDoc?.document_type || ''] || selectedDoc?.document_type}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {selectedDoc?.content_type.startsWith('image/') ? (
                <img
                  src={selectedDoc.url}
                  alt={selectedDoc.file_name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : selectedDoc?.content_type === 'application/pdf' ? (
                <iframe
                  src={selectedDoc.url}
                  className="w-full h-[60vh]"
                  title={selectedDoc.file_name}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Preview not available for this file type
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              <Button onClick={() => selectedDoc && handleDownload(selectedDoc)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
