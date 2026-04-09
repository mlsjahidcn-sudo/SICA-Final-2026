"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Languages,
  FileText,
  Sparkles,
  ExternalLink,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  preview_url: string;
  created_at: string;
}

interface StatusHistory {
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

interface Report {
  id: string;
  report_content: string;
  generated_at: string;
}

interface Assessment {
  id: string;
  tracking_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  country: string;
  date_of_birth: string | null;
  current_education_level: string | null;
  gpa: string | null;
  target_degree: string | null;
  target_major: string | null;
  preferred_universities: string | null;
  english_proficiency: string | null;
  english_score: string | null;
  budget_range: string | null;
  additional_notes: string | null;
  admin_notes: string | null;
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  documents: Document[];
  status_history: StatusHistory[];
  report: Report | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending Review", color: "bg-yellow-500", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-500", icon: FileText },
  document_request: { label: "Documents Requested", color: "bg-orange-500", icon: AlertCircle },
  report_ready: { label: "Report Ready", color: "bg-green-500", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertCircle },
};

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`);
      const data = await response.json();

      if (data.success) {
        setAssessment(data.assessment);
        setNewStatus(data.assessment.status);
        setAdminNotes(data.assessment.admin_notes || "");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}/report`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        fetchAssessment();
      } else {
        alert(data.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        fetchAssessment();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1 text-white`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12" />
        <p>Assessment not found</p>
        <Button variant="outline" asChild>
          <Link href="/admin/assessments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>
    );
  }

  const whatsappLink = assessment.whatsapp_number
    ? `https://wa.me/${assessment.whatsapp_number.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/assessments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-sm text-muted-foreground">{assessment.tracking_code}</p>
              {getStatusBadge(assessment.status)}
            </div>
            <h1 className="text-2xl font-bold">
              {assessment.full_name}
            </h1>
            <p className="text-muted-foreground">{assessment.country}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`mailto:${assessment.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          </Button>
          {whatsappLink && (
            <Button variant="outline" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{assessment.email}</p>
                  </div>
                </div>
                {assessment.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{assessment.phone}</p>
                    </div>
                  </div>
                )}
                {assessment.whatsapp_number && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="text-sm">{assessment.whatsapp_number}</p>
                    </div>
                  </div>
                )}
                {assessment.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-sm">{assessment.date_of_birth}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current Education Level</p>
                  <p className="font-medium">{assessment.current_education_level || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Degree</p>
                  <p className="font-medium">{assessment.target_degree || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Major</p>
                  <p className="font-medium">{assessment.target_major || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-medium">{assessment.gpa || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Universities</p>
                  <p className="font-medium">{assessment.preferred_universities || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Proficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-muted-foreground">English</p>
                <p className="mt-1 text-lg font-semibold">
                  {assessment.english_proficiency || "Not specified"}
                </p>
                {assessment.english_score && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Score: {assessment.english_score}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-xs text-muted-foreground">Budget Range</p>
                <p className="font-medium">{assessment.budget_range || "Not specified"}</p>
              </div>
              {assessment.additional_notes && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">Additional Notes</p>
                  <p className="mt-1 text-sm">{assessment.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {assessment.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  {assessment.documents.length} document{assessment.documents.length !== 1 && "s"} uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.document_type} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.preview_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report */}
          {assessment.report && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  AI Assessment Report
                </CardTitle>
                <CardDescription>
                  Generated on {formatDate(assessment.report.generated_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                    {assessment.report.report_content.slice(0, 2000)}...
                  </pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" asChild>
                    <a
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(assessment.report.report_content)}`}
                      download={`assessment-report-${assessment.tracking_code}.md`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="mt-1">{getStatusBadge(assessment.status)}</div>
              </div>
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <Button className="w-full" onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generate Report */}
          {!assessment.report && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate AI Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Generate a comprehensive AI-powered assessment report with personalized recommendations.
                </p>
                <Button className="w-full" onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessment.status_history.map((history, index) => (
                  <div key={index} className="relative pl-6">
                    <div className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <div className="h-2 w-2 rounded-full bg-background" />
                    </div>
                    {index < assessment.status_history.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-full w-0.5 bg-border" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {history.old_status
                          ? `${statusConfig[history.old_status]?.label || history.old_status}`
                          : "Submitted"} → {statusConfig[history.new_status]?.label || history.new_status}
                      </p>
                      {history.notes && (
                        <p className="text-xs text-muted-foreground">{history.notes}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(history.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{formatDate(assessment.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(assessment.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{assessment.documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report</span>
                  <span>{assessment.report ? "Generated" : "Pending"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
