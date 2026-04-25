'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_key: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  readOnly?: boolean;
}

function getFileIcon(contentType: string | null) {
  if (!contentType) return File;
  
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType === 'application/pdf') return FileText;
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return FileText;
  if (contentType.includes('document') || contentType.includes('word')) return FileText;
  
  return File;
}

export function TaskAttachments({
  taskId,
  attachments,
  onAttachmentsChange,
  readOnly = false,
}: TaskAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    []
  );

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const uploadUrlResponse = await fetch(`/api/admin/tasks/${taskId}/attachments/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileKey } = await uploadUrlResponse.json();

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Save attachment record
      const saveResponse = await fetch(`/api/admin/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          contentType: file.type,
        }),
      });

      if (saveResponse.ok) {
        const { attachment } = await saveResponse.json();
        onAttachmentsChange([...attachments, attachment]);
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch(
        `/api/admin/tasks/${taskId}/attachments/${attachment.id}/download-url`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { downloadUrl } = await response.json();
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get download URL:', error);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (attachment.content_type?.startsWith('image/')) {
      try {
        const { getValidToken } = await import('@/lib/auth-token');
        const token = await getValidToken();
        
        const response = await fetch(
          `/api/admin/tasks/${taskId}/attachments/${attachment.id}/download-url`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const { downloadUrl } = await response.json();
          setPreviewUrl(downloadUrl);
          setPreviewName(attachment.file_name);
        }
      } catch (error) {
        console.error('Failed to preview:', error);
      }
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch(
        `/api/admin/tasks/${taskId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        onAttachmentsChange(
          attachments.filter((a) => a.id !== attachmentId)
        );
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments
        </CardTitle>
        <CardDescription>{attachments.length} file(s)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* File List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.content_type);
              
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.file_size
                        ? formatBytes(attachment.file_size)
                        : 'Unknown size'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {attachment.content_type?.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Area */}
        {!readOnly && (
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Max file size: 10MB
                </p>
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  Select File
                </Button>
              </>
            )}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewName}</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={previewName}
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
