'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DocumentUpload, DOCUMENT_TYPE_LABELS } from '@/components/document-upload';
import { useAuth } from '@/contexts/auth-context';
import {
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
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
  url?: string;
  created_at: string;
}

interface Application {
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
}

// Document requirements configuration
const DOCUMENT_REQUIREMENTS = [
  {
    type: 'passport',
    label: 'Passport Copy',
    description: 'Upload a clear copy of your passport (photo page)',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    type: 'photo',
    label: 'Passport Photo',
    description: 'Recent passport-sized photo (white background)',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png'],
  },
  {
    type: 'diploma',
    label: 'Diploma/Certificate',
    description: 'Highest degree certificate',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    type: 'transcript',
    label: 'Academic Transcript',
    description: 'Official academic records',
    required: true,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    type: 'language_certificate',
    label: 'Language Certificate',
    description: 'HSK, IELTS, TOEFL or other language test results',
    required: false,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    type: 'recommendation',
    label: 'Recommendation Letter',
    description: 'Academic or professional recommendation',
    required: false,
    acceptedTypes: ['application/pdf'],
  },
];

export default function ApplicationDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/student/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'student' && applicationId) {
      fetchApplication();
      fetchDocuments();
    }
  }, [user, applicationId]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
      } else {
        toast.error('Application not found');
        router.push('/student/applications');
      }
    } catch {
      toast.error('Failed to load application');
      router.push('/student/applications');
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/documents?application_id=${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Convert array to object keyed by document_type
        const docsMap: Record<string, Document> = {};
        (data.documents || []).forEach((doc: Document) => {
          docsMap[doc.document_type] = doc;
        });
        setDocuments(docsMap);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = useCallback((doc: Document) => {
    setDocuments(prev => ({
      ...prev,
      [doc.document_type]: doc,
    }));
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    fetchDocuments();
  }, []);

  // Calculate completion progress
  const requiredDocs = DOCUMENT_REQUIREMENTS.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => documents[d.type]?.status !== undefined);
  const verifiedRequired = requiredDocs.filter(d => documents[d.type]?.status === 'verified');
  const progress = Math.round((uploadedRequired.length / requiredDocs.length) * 100);

  const allRequiredUploaded = requiredDocs.every(d => documents[d.type]);
  const canSubmit = allRequiredUploaded && application?.status === 'draft';

  const handleSubmitApplication = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        router.push('/student/applications');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit application');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/student/applications">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
          {application && (
            <p className="text-muted-foreground">
              {application.programs.name} at {application.programs.universities.name_en}
            </p>
          )}
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Document Upload Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {uploadedRequired.length} of {requiredDocs.length} required documents uploaded
                </p>
              </div>
              <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{verifiedRequired.length} verified</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>{uploadedRequired.length - verifiedRequired.length} pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Required Documents
            </CardTitle>
            <CardDescription>
              Please upload all required documents. Files must be PDF, JPG, or PNG format, max 10MB each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {DOCUMENT_REQUIREMENTS.filter(d => d.required).map((req, index) => (
              <div key={req.type}>
                {index > 0 && <Separator className="mb-6" />}
                <DocumentUpload
                  applicationId={applicationId}
                  documentType={req.type}
                  label={req.label}
                  description={req.description}
                  acceptedTypes={req.acceptedTypes}
                  existingDocument={documents[req.type] || null}
                  onUploadSuccess={handleUploadSuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                  readOnly={application?.status !== 'draft'}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optional Documents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Optional Documents
            </CardTitle>
            <CardDescription>
              Additional documents that may strengthen your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {DOCUMENT_REQUIREMENTS.filter(d => !d.required).map((req, index) => (
              <div key={req.type}>
                {index > 0 && <Separator className="mb-6" />}
                <DocumentUpload
                  applicationId={applicationId}
                  documentType={req.type}
                  label={req.label}
                  description={req.description}
                  acceptedTypes={req.acceptedTypes}
                  existingDocument={documents[req.type] || null}
                  onUploadSuccess={handleUploadSuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                  readOnly={application?.status !== 'draft'}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Section */}
        {application?.status === 'draft' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to Submit?</h3>
                  <p className="text-sm text-muted-foreground">
                    {allRequiredUploaded
                      ? 'All required documents uploaded. You can submit your application.'
                      : 'Please upload all required documents before submitting.'}
                  </p>
                </div>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={!canSubmit || isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Submit Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {application?.status !== 'draft' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  Application has been submitted. Document uploads are disabled.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
