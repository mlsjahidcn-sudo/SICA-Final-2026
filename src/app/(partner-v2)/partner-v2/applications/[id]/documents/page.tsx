'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { ApplicationStatusBadge } from '@/components/partner-v2/application-status-badge';
import { PageHeader, FormSection, FormGrid, FormField } from '@/components/admin';
import {
  IconArrowLeft,
  IconDownload,
  IconExternalLink,
  IconFile,
  IconFileText,
  IconPhoto,
  IconLoader2,
  IconZoomIn,
  IconX,
  IconUpload,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  programs: {
    id: string;
    name: string;
    universities: {
      id: string;
      name: string;
      name_en: string;
      name_cn: string;
      city: string;
    };
  };
  students: {
    id: string;
    first_name: string;
    last_name: string;
    nationality: string;
    email: string;
    users: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

interface Document {
  id: string;
  application_id: string;
  document_type: string;
  file_key: string;
  file_url: string;
  url: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  uploaded_at: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Proof',
  medical_exam: 'Medical Exam Report',
  police_clearance: 'Police Clearance',
  other: 'Other Document',
};

function getFileType(contentType: string): 'image' | 'pdf' | 'unknown' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'pdf';
  return 'unknown';
}

function getFileIcon(type: 'image' | 'pdf' | 'unknown') {
  switch (type) {
    case 'image':
      return IconPhoto;
    case 'pdf':
      return IconFileText;
    default:
      return IconFile;
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
  }
};

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchApplicationAndDocuments = async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      // Fetch application
      const appResponse = await fetch(`/api/applications/${resolvedParams.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!appResponse.ok) {
        toast.error('Application not found');
        return;
      }

      const appData = await appResponse.json();
      setApplication(appData.application);

      // Fetch documents
      const docsResponse = await fetch(`/api/documents?application_id=${resolvedParams.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedDocType || !selectedFile) {
      toast.error('Please select document type and file');
      return;
    }

    if (!application?.students?.id) {
      toast.error('Application data not loaded. Please refresh the page.');
      return;
    }

    setIsUploading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const formData = new FormData();
      formData.append('student_id', application.students.id);
      formData.append('application_id', resolvedParams.id);
      formData.append('document_type', selectedDocType);
      formData.append('file', selectedFile);

      console.log('[Document Upload] Uploading document:', {
        student_id: application.students.id,
        application_id: resolvedParams.id,
        document_type: selectedDocType,
        file_name: selectedFile.name,
        file_size: selectedFile.size
      });

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setSelectedDocType('');
        setSelectedFile(null);
        await fetchApplicationAndDocuments();
      } else {
        const responseText = await response.text();
        console.error('[Document Upload] Error response:', responseText);
        
        let errorMsg = 'Failed to upload document';
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.message || errorMsg;
          if (errorData.details) {
            errorMsg += `: ${errorData.details}`;
          }
        } catch {
          errorMsg = `Server error (${response.status}): ${responseText.substring(0, 100)}`;
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.file_name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  useEffect(() => {
    if (user?.role === 'partner' || user?.role === 'admin') {
      fetchApplicationAndDocuments();
    }
  }, [user, resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Application not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Documents"
        description={`${application.students.first_name || ''} ${application.students.last_name || ''}`.trim() + ` • ${application.programs.universities.name_en}`}
        backHref={`/partner-v2/applications/${application.id}`}
        backLabel="Back"
        actions={<ApplicationStatusBadge status={application.status} />}
      />

      <div className="px-4 lg:px-6 pb-6 space-y-6">
        {/* Upload Section */}
        <FormSection title="Upload New Document">
          <FormGrid columns={2}>
            <FormField label="Document Type">
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ALLOWED_DOCUMENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="File">
              <div className="space-y-2">
                <input
                  id="file"
                  type="file"
                  className="flex-1"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </FormField>
          </FormGrid>
          <div className="mt-4">
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedDocType || !selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </FormSection>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IconFile className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No documents uploaded</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(getFileType(doc.content_type));
              
              return (
                <Card key={doc.id} className="overflow-hidden group">
                  {/* Preview Area */}
                  <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                    {getFileType(doc.content_type) === 'image' ? (
                      <Image
                        src={doc.url}
                        alt={ALLOWED_DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase">
                          {doc.file_name.split('.').pop()}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {getFileType(doc.content_type) === 'image' && (
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <IconZoomIn className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="secondary" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <IconExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button size="icon" variant="secondary" onClick={() => handleDownload(doc)}>
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {ALLOWED_DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.file_name}
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Reason: {doc.rejection_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setSelectedDocument(null)}
          >
            <IconX className="h-6 w-6" />
          </Button>
          <img
            src={selectedDocument.url}
            alt={ALLOWED_DOCUMENT_TYPES[selectedDocument.document_type] || selectedDocument.document_type}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Badge variant="secondary">
              {ALLOWED_DOCUMENT_TYPES[selectedDocument.document_type] || selectedDocument.document_type}
            </Badge>
          </div>
        </div>
      )}
    </>
  );
}
