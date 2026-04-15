'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export interface Document {
  id: string;
  document_type: string;
  file_key: string;
  file_name: string;
  file_size: number;
  content_type: string;
  status: string;
  rejection_reason?: string;
  url?: string;
  created_at: string;
  verified_at?: string;
}

interface DocumentUploadProps {
  applicationId?: string; // Optional - for linking to application
  studentId: string; // Required - documents belong to student
  documentType: string;
  label: string;
  description: string;
  acceptedTypes: string[];
  existingDocument?: Document | null;
  onUploadSuccess?: (document: Document) => void;
  onDeleteSuccess?: () => void;
  readOnly?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  diploma: 'Diploma/Certificate',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Certificate (HSK/IELTS/TOEFL)',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  other: 'Other Document',
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof File; label: string }> = {
  pending: { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: AlertCircle, label: 'Pending Review' },
  verified: { color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2, label: 'Verified' },
  rejected: { color: 'bg-red-500/10 text-red-600 border-red-200', icon: X, label: 'Rejected' },
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

export function DocumentUpload({
  applicationId,
  studentId,
  documentType,
  label,
  description,
  acceptedTypes,
  existingDocument,
  onUploadSuccess,
  onDeleteSuccess,
  readOnly = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(existingDocument || null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [readOnly]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const formData = new FormData();
      formData.append('student_id', studentId); // Primary identifier
      if (applicationId) {
        formData.append('application_id', applicationId); // Optional link
      }
      formData.append('document_type', documentType);
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setCurrentDoc(data.document);
        toast.success('Document uploaded successfully');
        onUploadSuccess?.(data.document);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload document');
      }
    } catch {
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentDoc || readOnly) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch(`/api/documents?id=${currentDoc.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCurrentDoc(null);
        toast.success('Document deleted');
        onDeleteSuccess?.();
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleDownload = async () => {
    if (!currentDoc?.url) return;

    try {
      const response = await fetch(currentDoc.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = currentDoc.file_name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleView = () => {
    if (currentDoc?.url) {
      window.open(currentDoc.url, '_blank');
    }
  };

  const statusConfig = currentDoc ? STATUS_CONFIG[currentDoc.status] : null;
  const StatusIcon = statusConfig?.icon || File;
  const FileIcon = currentDoc ? getFileIcon(currentDoc.content_type) : Upload;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {currentDoc && statusConfig && (
          <Badge variant="outline" className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        )}
      </div>

      {currentDoc ? (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px]">{currentDoc.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(currentDoc.file_size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              {!readOnly && currentDoc.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {currentDoc.status === 'rejected' && currentDoc.rejection_reason && (
            <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-600">
              <strong>Rejection Reason:</strong> {currentDoc.rejection_reason}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !readOnly && window.document.getElementById(`file-input-${documentType}`)?.click()}
        >
          <input
            id={`file-input-${documentType}`}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={readOnly}
          />
          
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">
                {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-sm text-muted-foreground">
                Accepted: {acceptedTypes.map(t => t.split('/')[1]?.toUpperCase() || t).join(', ')} (max 10MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { DOCUMENT_TYPE_LABELS };
