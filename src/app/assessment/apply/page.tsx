"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  Languages,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
  X,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

const steps = [
  { id: 1, title: "Personal Info", icon: User, description: "Your contact details" },
  { id: 2, title: "Academic", icon: GraduationCap, description: "Education background" },
  { id: 3, title: "Language", icon: Languages, description: "Proficiency level" },
  { id: 4, title: "Preferences", icon: FileText, description: "Study preferences" },
  { id: 5, title: "Review", icon: CheckCircle2, description: "Confirm & submit" },
];

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba",
  "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia",
  "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lithuania", "Madagascar", "Malaysia", "Maldives", "Mali", "Mexico",
  "Moldova", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Nigeria", "North Korea", "Norway", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Senegal", "Serbia",
  "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const educationLevels = [
  "High School Graduate",
  "High School Student (Final Year)",
  "Bachelor's Degree",
  "Bachelor's Student (Final Year)",
  "Master's Degree",
  "Master's Student",
  "Doctoral Degree",
  "Doctoral Student",
  "Other",
];

const programTypes = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD/Doctorate",
  "Chinese Language Program",
  "Short-term Program",
  "Exchange Program",
];

const languageProficiencies = ["Native", "Advanced", "Intermediate", "Basic", "Beginner"];

const budgetRanges = [
  "Under $2,000/year",
  "$2,000 - $5,000/year",
  "$5,000 - $10,000/year",
  "$10,000 - $20,000/year",
  "$20,000+/year",
  "Not sure yet",
];

const documentTypes = [
  { id: "passport", label: "Passport Copy", description: "Valid passport photo page" },
  { id: "diploma", label: "Diploma/Certificate", description: "Highest degree certificate" },
  { id: "transcript", label: "Academic Transcript", description: "Official academic records" },
  { id: "language_certificate", label: "Language Certificate", description: "IELTS, TOEFL, HSK, etc." },
  { id: "photo", label: "Passport Photo", description: "Recent passport-sized photo" },
];

interface UploadedFile {
  file: File;
  documentType: string;
  preview?: string;
}

interface UploadStatus {
  documentType: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  country: string;
  date_of_birth: string;
  current_education_level: string;
  gpa: string;
  target_degree: string;
  target_major: string;
  preferred_universities: string;
  english_proficiency: string;
  english_score: string;
  budget_range: string;
  additional_notes: string;
}

const initialFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  whatsapp_number: "",
  country: "",
  date_of_birth: "",
  current_education_level: "",
  gpa: "",
  target_degree: "",
  target_major: "",
  preferred_universities: "",
  english_proficiency: "",
  english_score: "",
  budget_range: "",
  additional_notes: "",
};

export default function AssessmentApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [submissionStage, setSubmissionStage] = useState<'form' | 'documents' | 'complete'>('form');

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.email && formData.country);
      case 2:
        return !!(formData.current_education_level && formData.target_degree);
      default:
        return true;
    }
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      setError("");
    } else {
      setError("Please fill in all required fields.");
    }
  }, [currentStep, validateStep]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleFileSelect = useCallback((documentType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      // Check if this document type already has a file
      setUploadedFiles((prev) => {
        const filtered = prev.filter((f) => f.documentType !== documentType);
        const newFile: UploadedFile = {
          file,
          documentType,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        };
        return [...filtered, newFile];
      });
    }
    // Reset input
    e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback((documentType: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.documentType === documentType);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.documentType !== documentType);
    });
  }, []);

  const uploadDocuments = async (assessmentId: string): Promise<UploadStatus[]> => {
    // Initialize upload statuses
    const initialStatuses: UploadStatus[] = uploadedFiles.map((file) => ({
      documentType: file.documentType,
      fileName: file.file.name,
      status: 'pending' as const,
    }));
    setUploadStatuses(initialStatuses);

    // Upload all documents in parallel using Promise.allSettled
    const uploadPromises = uploadedFiles.map(async (uploadedFile, index) => {
      // Update status to uploading
      setUploadStatuses((prev) =>
        prev.map((status, i) =>
          i === index ? { ...status, status: 'uploading' as const } : status
        )
      );

      const formDataObj = new FormData();
      formDataObj.append("assessment_id", assessmentId);
      formDataObj.append("document_type", uploadedFile.documentType);
      formDataObj.append("file", uploadedFile.file);

      try {
        const response = await fetch("/api/assessment/upload", {
          method: "POST",
          body: formDataObj,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update status to success
          setUploadStatuses((prev) =>
            prev.map((status, i) =>
              i === index ? { ...status, status: 'success' as const } : status
            )
          );
          return { success: true, documentType: uploadedFile.documentType };
        } else {
          // Update status to error
          const errorMsg = data.error || "Upload failed";
          setUploadStatuses((prev) =>
            prev.map((status, i) =>
              i === index ? { ...status, status: 'error' as const, error: errorMsg } : status
            )
          );
          return { success: false, documentType: uploadedFile.documentType, error: errorMsg };
        }
      } catch (err) {
        // Update status to error
        const errorMsg = err instanceof Error ? err.message : "Network error";
        setUploadStatuses((prev) =>
          prev.map((status, i) =>
            i === index ? { ...status, status: 'error' as const, error: errorMsg } : status
          )
        );
        return { success: false, documentType: uploadedFile.documentType, error: errorMsg };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.allSettled(uploadPromises);
    
    // Return final statuses
    return initialStatuses.map((status, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        return {
          ...status,
          status: result.value.success ? 'success' as const : 'error' as const,
          error: result.value.error,
        };
      }
      return {
        ...status,
        status: 'error' as const,
        error: 'Upload failed',
      };
    });
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError("");
    setSubmissionStage('form');

    try {
      // Step 1: Submit form data
      const response = await fetch("/api/assessment/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Step 2: Upload documents if any
        if (uploadedFiles.length > 0 && data.application_id) {
          setSubmissionStage('documents');
          toast("Submitting application...", {
            description: `Uploading ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''}...`,
          });

          const finalStatuses = await uploadDocuments(data.application_id);
          setUploadStatuses(finalStatuses);

          // Check if any uploads failed
          const failedUploads = finalStatuses.filter((s) => s.status === 'error');
          if (failedUploads.length > 0) {
            toast.error(`${failedUploads.length} document${failedUploads.length > 1 ? 's' : ''} failed to upload`, {
              description: "You can upload them later from the tracking page.",
            });
          } else {
            toast.success("All documents uploaded successfully", {
              description: "Your application has been submitted with all documents.",
            });
          }
        }

        setTrackingCode(data.tracking_code);
        setSubmitted(true);
        setSubmissionStage('complete');
      } else {
        setError(data.error || "Failed to submit application. Please try again.");
        toast.error("Submission failed", {
          description: data.error || "Failed to submit application. Please try again.",
        });
      }
    } catch {
      setError("An error occurred. Please check your connection and try again.");
      toast.error("Network error", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedFiles, toast]);

  if (submitted) {
    const successfulUploads = uploadStatuses.filter((s) => s.status === 'success');
    const failedUploads = uploadStatuses.filter((s) => s.status === 'error');
    const hasDocuments = uploadedFiles.length > 0;

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-xl">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Application Submitted!</h1>
              <p className="mb-6 text-muted-foreground">
                Your assessment request has been received. Our team will review your profile and generate a personalized
                report within 24-48 hours.
              </p>
              <div className="mb-6 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Your Tracking Code</p>
                <p className="mt-1 text-2xl font-mono font-bold text-primary">{trackingCode}</p>
              </div>

              {/* Document Upload Status Summary */}
              {hasDocuments && (
                <div className="mb-6 rounded-lg border p-4 text-left">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <FileIcon className="h-4 w-4" />
                    Document Upload Status
                  </h3>
                  <div className="space-y-2">
                    {uploadStatuses.map((status) => {
                      const docType = documentTypes.find((d) => d.id === status.documentType);
                      return (
                        <div
                          key={status.documentType}
                          className="flex items-center justify-between rounded border bg-card p-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {status.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : status.status === 'error' ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <div>
                              <p className="font-medium">{docType?.label || status.documentType}</p>
                              <p className="text-xs text-muted-foreground">{status.fileName}</p>
                            </div>
                          </div>
                          {status.status === 'error' && status.error && (
                            <span className="text-xs text-destructive">{status.error}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {failedUploads.length > 0 && (
                    <div className="mt-3 rounded border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950">
                      <p className="font-medium text-orange-700 dark:text-orange-400">
                        {failedUploads.length} document{failedUploads.length > 1 ? 's' : ''} failed to upload
                      </p>
                      <p className="mt-1 text-orange-600 dark:text-orange-300">
                        You can upload these documents later from the tracking page.
                      </p>
                    </div>
                  )}

                  {successfulUploads.length > 0 && failedUploads.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      ✓ All {successfulUploads.length} document{successfulUploads.length > 1 ? 's' : ''} uploaded successfully
                    </p>
                  )}
                </div>
              )}

              <p className="mb-6 text-sm text-muted-foreground">
                Please save this tracking code. You can use it along with your email to check your application status.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link href={`/assessment/track?code=${trackingCode}`}>Track Application</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Free Assessment Application</h1>
            <p className="mt-2 text-muted-foreground">
              Complete this form to receive your personalized study plan for China
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium">Step {currentStep} of {steps.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="mt-6 grid grid-cols-5 gap-2">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-colors ${
                    step.id === currentStep
                      ? "bg-primary/10"
                      : step.id < currentStep
                      ? "bg-muted hover:bg-muted/80 cursor-pointer"
                      : "opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep >= step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${currentStep === step.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader className="border-b pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                  {(() => {
                    const StepIcon = steps[currentStep - 1].icon;
                    return <StepIcon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">{steps[currentStep - 1].title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{steps[currentStep - 1].description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp_number}
                        onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.country} onValueChange={(v) => handleInputChange("country", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academic Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="education_level">
                        Current Education Level <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.current_education_level}
                        onValueChange={(v) => handleInputChange("current_education_level", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your education level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target_degree">
                        Target Degree <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.target_degree}
                        onValueChange={(v) => handleInputChange("target_degree", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program type" />
                        </SelectTrigger>
                        <SelectContent>
                          {programTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="major">Target Major/Field of Study</Label>
                      <Input
                        id="major"
                        value={formData.target_major}
                        onChange={(e) => handleInputChange("target_major", e.target.value)}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gpa">Current GPA</Label>
                      <Input
                        id="gpa"
                        value={formData.gpa}
                        onChange={(e) => handleInputChange("gpa", e.target.value)}
                        placeholder="e.g., 3.5/4.0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_universities">Preferred Universities (Optional)</Label>
                    <Input
                      id="preferred_universities"
                      value={formData.preferred_universities}
                      onChange={(e) => handleInputChange("preferred_universities", e.target.value)}
                      placeholder="e.g., Tsinghua University, Peking University"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Language Proficiency */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-semibold">English Proficiency</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="eng_prof">Proficiency Level</Label>
                        <Select
                          value={formData.english_proficiency}
                          onValueChange={(v) => handleInputChange("english_proficiency", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {languageProficiencies.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eng_score">Test Score (if applicable)</Label>
                        <Input
                          id="eng_score"
                          value={formData.english_score}
                          onChange={(e) => handleInputChange("english_score", e.target.value)}
                          placeholder="e.g., IELTS 7.0, TOEFL 100"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    If you have taken any English proficiency tests (IELTS, TOEFL, Duolingo, etc.), please provide your
                    scores. This helps us recommend the most suitable programs for you.
                  </p>
                </div>
              )}

              {/* Step 4: Preferences */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range (per year)</Label>
                    <Select value={formData.budget_range} onValueChange={(v) => handleInputChange("budget_range", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="What is your budget?" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.additional_notes}
                      onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                      placeholder="Any specific requirements, questions, or information you would like to share..."
                      rows={4}
                    />
                  </div>

                  {/* Optional Document Upload */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Documents (Optional)</Label>
                      <p className="text-sm text-muted-foreground">
                        Upload supporting documents to help us provide better recommendations. You can also upload these later.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {documentTypes.map((docType) => {
                        const uploadedFile = uploadedFiles.find((f) => f.documentType === docType.id);
                        return (
                          <div key={docType.id} className="relative">
                            <div
                              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                                uploadedFile
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-dashed hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              {uploadedFile ? (
                                <>
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    {uploadedFile.preview ? (
                                      <ImageIcon className="h-5 w-5 text-primary" />
                                    ) : (
                                      <FileIcon className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{uploadedFile.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => handleRemoveFile(docType.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{docType.label}</p>
                                    <p className="text-xs text-muted-foreground">{docType.description}</p>
                                  </div>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              onChange={handleFileSelect(docType.id)}
                              disabled={!!uploadedFile}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} selected
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="font-medium">What happens next?</p>
                        <p className="mt-1 text-muted-foreground">
                          After submission, our AI will analyze your profile and generate a personalized report within
                          24-48 hours. You&apos;ll receive an email notification when your report is ready.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Personal Information</h3>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                        Edit
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        <span className="font-medium">{formData.full_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        <span className="font-medium">{formData.phone || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WhatsApp:</span>{" "}
                        <span className="font-medium">{formData.whatsapp_number || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Country:</span>{" "}
                        <span className="font-medium">{formData.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Academic Information</h3>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                        Edit
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Education Level:</span>{" "}
                        <span className="font-medium">{formData.current_education_level}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Degree:</span>{" "}
                        <span className="font-medium">{formData.target_degree}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Major:</span>{" "}
                        <span className="font-medium">{formData.target_major || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">GPA:</span>{" "}
                        <span className="font-medium">{formData.gpa || "Not provided"}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Preferred Universities:</span>{" "}
                        <span className="font-medium">{formData.preferred_universities || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Language Proficiency */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Language Proficiency</h3>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                        Edit
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">English:</span>{" "}
                        <span className="font-medium">
                          {formData.english_proficiency || "Not specified"}
                          {formData.english_score && ` (${formData.english_score})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Preferences</h3>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                        Edit
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Budget:</span>{" "}
                        <span className="font-medium">{formData.budget_range || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Notes:</span>{" "}
                        <span className="font-medium">{formData.additional_notes || "None"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Documents</h3>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                          Edit
                        </Button>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        {uploadedFiles.map((uf) => {
                          const docType = documentTypes.find((d) => d.id === uf.documentType);
                          return (
                            <div key={uf.documentType} className="flex items-center gap-2 text-sm">
                              <FileIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{docType?.label || uf.documentType}:</span>
                              <span className="text-muted-foreground">{uf.file.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      By submitting this application, you agree to receive email communications regarding your
                      assessment and study opportunities in China.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep < steps.length ? (
                  <Button onClick={handleNext} className="gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {submissionStage === 'form'
                          ? "Submitting..."
                          : submissionStage === 'documents'
                          ? "Uploading Documents..."
                          : "Completing..."}
                      </>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
