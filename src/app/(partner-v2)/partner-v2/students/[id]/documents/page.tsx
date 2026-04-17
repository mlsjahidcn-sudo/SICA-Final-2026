'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
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
  IconTrash,
} from '@tabler/icons-react';
import { toast } from "sonner";


interface Student {
  id: string;
  student_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  nationality?: string;
}

interface Document {
  id: string;
  student_id: string;
  application_id?: string;
  type: string;
  file_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  url?: string;
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

export default function StudentDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchStudentAndDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      // Fetch student details
      const studentResponse = await fetch(`/api/partner/students/${resolvedParams.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (studentResponse.status === 403) {
        toast.error('You do not have access to view this student');
        return;
      }

      if (!studentResponse.ok) {
        toast.error('Student not found');
        return;
      }

      const studentData = await studentResponse.json();
      setStudent(studentData.student);

      // Fetch documents via partner API with student_id filter
      // studentData.student.student_id is the students table ID
      const studentRecordId = studentData.student?.student_id;
      
      if (studentRecordId) {
        const docsResponse = await fetch(`/api/partner/documents?student_id=${studentRecordId}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          setDocuments(docsData.documents || []);
        }
      } else {
        // No student record found, show empty documents
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

  const handleFileUpload = async () => {
    if (!selectedDocType || !selectedFile) {
      toast.error('Please select document type and file');
      return;
    }

    if (!student) {
      toast.error('Student data not loaded. Please refresh the page.');
      return;
    }

    setIsUploading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      // Use student_id from the already loaded student data (students table ID)
      const studentRecordId = (student as Student & { student_id?: string })?.student_id;
      
      if (!studentRecordId) {
        toast.error('Student record not found');
        return;
      }

      const formData = new FormData();
      formData.append('student_id', studentRecordId);
      formData.append('type', selectedDocType);
      formData.append('file', selectedFile);

      const response = await fetch('/api/partner/documents', {
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
        await fetchStudentAndDocuments();
      } else {
        const responseText = await response.text();
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

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setIsDeleting(docId);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewExternal = async (doc: Document) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const response = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to get document URL');
        return;
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Failed to open document');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const response = await fetch(`/api/documents/${doc.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to get document URL');
        return;
      }

      const data = await response.json();

      // Download the file
      const fileResponse = await fetch(data.url);
      const blob = await fileResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = data.file_name || doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  useEffect(() => {
    if (user?.role === 'partner' || user?.role === 'partner_team_member') {
      fetchStudentAndDocuments();
    }
  }, [user, fetchStudentAndDocuments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/partner-v2/students/${resolvedParams.id}`}>
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Documents</h1>
            <p className="text-muted-foreground text-sm">
              {student.full_name} • {student.email}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 pb-6 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUpload className="h-4 w-4" />
              Upload New Document
            </CardTitle>
            <CardDescription>
              Upload documents for this student. Maximum file size: 10MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <input
                  id="file"
                  type="file"
                  className="w-full"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
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
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <IconFile className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload documents using the form above
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(getFileType(doc.mime_type));
              
              return (
                <Card key={doc.id} className="overflow-hidden group">
                  {/* Preview Area */}
                  <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                    {getFileType(doc.mime_type) === 'image' && doc.url ? (
                      <Image
                        src={doc.url}
                        alt={ALLOWED_DOCUMENT_TYPES[doc.type] || doc.type}
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
                    
                    {/* Action Buttons - Always Visible */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 opacity-100 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setSelectedDocument(doc)}
                        className="h-7 w-7"
                        title="View"
                      >
                        <IconZoomIn className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleViewExternal(doc)}
                        className="h-7 w-7"
                        title="Open in new tab"
                      >
                        <IconExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDownload(doc)}
                        className="h-7 w-7"
                        title="Download"
                      >
                        <IconDownload className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id)}
                        disabled={isDeleting === doc.id}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        {isDeleting === doc.id ? (
                          <IconLoader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <IconTrash className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {ALLOWED_DOCUMENT_TYPES[doc.type] || doc.type}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_size / 1024 / 1024 < 1 
                        ? `${(doc.file_size / 1024).toFixed(1)} KB` 
                        : `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                      } • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-500">
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
      {selectedDocument && selectedDocument.url && (
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
          <Image
            src={selectedDocument.url}
            alt={ALLOWED_DOCUMENT_TYPES[selectedDocument.type] || selectedDocument.type}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
            fill
            unoptimized
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Badge variant="secondary">
              {ALLOWED_DOCUMENT_TYPES[selectedDocument.type] || selectedDocument.type}
            </Badge>
          </div>
        </div>
      )}
    </>
  );
}
