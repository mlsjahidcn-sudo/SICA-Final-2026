'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { ApplicationStatusBadge } from '@/components/partner-v2/application-status-badge';
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
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  passport_first_name: string;
  passport_last_name: string;
  passport_copy_url: string;
  diploma_url: string;
  transcript_url: string;
  recommendation_letter_1_url: string;
  recommendation_letter_2_url: string;
  language_certificate_url: string;
  study_plan_url: string;
  photo_url: string;
  medical_certificate_url: string;
  other_documents: string[];
  programs: {
    name_en: string;
    universities: {
      name_en: string;
    };
  };
}

interface Document {
  key: string;
  label: string;
  url: string;
  type: 'image' | 'pdf' | 'unknown';
}

const DOCUMENT_LABELS: Record<string, string> = {
  passport_copy_url: 'Passport Copy',
  diploma_url: 'Diploma',
  transcript_url: 'Transcript',
  recommendation_letter_1_url: 'Recommendation Letter 1',
  recommendation_letter_2_url: 'Recommendation Letter 2',
  language_certificate_url: 'Language Certificate',
  study_plan_url: 'Study Plan',
  photo_url: 'Photo',
  medical_certificate_url: 'Medical Certificate',
};

function getFileType(url: string): 'image' | 'pdf' | 'unknown' {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
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

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('sica_auth_token');
        
        const response = await fetch(`/api/applications/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setApplication(data.application);
        } else {
          toast.error('Application not found');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'partner') {
      fetchApplication();
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

  const documents: Document[] = Object.entries(DOCUMENT_LABELS)
    .filter(([key]) => {
      const appRecord = application as unknown as Record<string, unknown>;
      return appRecord[key];
    })
    .map(([key, label]) => {
      const url = (application as unknown as Record<string, string>)[key];
      return {
        key,
        label,
        url,
        type: getFileType(url),
      };
    });

  // Add other documents if any
  if (application.other_documents && application.other_documents.length > 0) {
    application.other_documents.forEach((url, index) => {
      documents.push({
        key: `other_${index}`,
        label: `Other Document ${index + 1}`,
        url,
        type: getFileType(url),
      });
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/partner-v2/applications/${application.id}`}>
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Documents</h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {application.passport_first_name} {application.passport_last_name} • {application.programs.universities.name_en}
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="px-4 lg:px-6 pb-6">
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
              const Icon = getFileIcon(doc.type);
              
              return (
                <Card key={doc.key} className="overflow-hidden group">
                  {/* Preview Area */}
                  <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                    {doc.type === 'image' ? (
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Icon className="h-12 w-12 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase">
                          {doc.url.split('.').pop()}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {doc.type === 'image' && (
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
                      <Button size="icon" variant="secondary" asChild>
                        <a href={doc.url} download>
                          <IconDownload className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{doc.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {doc.type.toUpperCase()}
                      </Badge>
                    </div>
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
            alt={selectedDocument.label}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Badge variant="secondary">{selectedDocument.label}</Badge>
          </div>
        </div>
      )}
    </>
  );
}
