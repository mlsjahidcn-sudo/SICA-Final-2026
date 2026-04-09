"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Languages,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Application {
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
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    created_at: string;
  }>;
  status_history: Array<{
    old_status: string | null;
    new_status: string;
    notes: string | null;
    created_at: string;
  }>;
  report: {
    id: string;
    report_content: string;
    generated_at: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending Review", color: "bg-yellow-500", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-500", icon: FileText },
  document_request: { label: "Documents Requested", color: "bg-orange-500", icon: AlertCircle },
  report_ready: { label: "Report Ready", color: "bg-green-500", icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertCircle },
};

export default function AssessmentTrackPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<Application | null>(null);

  const handleSearch = useCallback(async () => {
    if (!trackingCode || !email) {
      setError("Please enter both tracking code and email address.");
      return;
    }

    setIsLoading(true);
    setError("");
    setApplication(null);

    try {
      const response = await fetch(
        `/api/assessment/track?tracking_code=${encodeURIComponent(trackingCode)}&email=${encodeURIComponent(email)}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setApplication(data.application);
      } else {
        setError(data.error || "Application not found. Please check your tracking code and email.");
      }
    } catch {
      setError("An error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [trackingCode, email]);

  const getStatusBadge = useCallback((status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1 text-white`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Track Your Assessment</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your tracking code and email to check your application status
          </p>
        </div>

        {/* Search Form */}
        {!application && (
          <Card className="mx-auto max-w-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tracking_code">Tracking Code</Label>
                  <Input
                    id="tracking_code"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    placeholder="SICA-XXXX-XXXX"
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="The email you used for your application"
                    className="mt-1.5"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <Button className="w-full" onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track Application
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Details */}
        {application && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Status Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm text-muted-foreground">{application.tracking_code}</p>
                      {getStatusBadge(application.status)}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">
                      {application.full_name}
                    </h2>
                    <p className="text-muted-foreground">{application.country}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Submitted: {formatDate(application.submitted_at)}</p>
                    <p>Last Updated: {formatDate(application.updated_at || application.submitted_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4">
                  {application.status_history.map((history, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        {index < application.status_history.length - 1 && (
                          <div className="h-full w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium">
                          {history.old_status ? `${statusConfig[history.old_status]?.label || history.old_status}` : "Submitted"} → {statusConfig[history.new_status]?.label || history.new_status}
                        </p>
                        {history.notes && <p className="text-sm text-muted-foreground">{history.notes}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(history.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    <span className="text-sm">{application.email}</span>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{application.phone}</span>
                    </div>
                  )}
                  {application.whatsapp_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">WhatsApp: {application.whatsapp_number}</span>
                    </div>
                  )}
                  {application.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">DOB: {application.date_of_birth}</span>
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
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Education:</span>
                    <span>{application.current_education_level || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Degree:</span>
                    <span>{application.target_degree || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Major:</span>
                    <span>{application.target_major || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA:</span>
                    <span>{application.gpa || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred Universities:</span>
                    <span>{application.preferred_universities || "Not specified"}</span>
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
                  <p className="text-sm font-medium">English</p>
                  <p className="mt-1 text-lg">{application.english_proficiency || "Not specified"}</p>
                  {application.english_score && (
                    <p className="text-sm text-muted-foreground">
                      Score: {application.english_score}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {application.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
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
            {application.report && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    Your Assessment Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none rounded-lg bg-muted/30 p-6">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-medium text-foreground mt-4 mb-2">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-3">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground mb-3">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-muted-foreground">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">{children}</strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-border rounded-lg">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-border px-4 py-2 text-muted-foreground">{children}</td>
                        ),
                        hr: () => (
                          <hr className="my-6 border-border" />
                        ),
                      }}
                    >
                      {application.report.report_content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setApplication(null)}>
                Track Another Application
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
