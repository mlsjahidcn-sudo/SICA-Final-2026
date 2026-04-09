"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  IconArrowLeft,
  IconUpload,
  IconFile,
  IconCheck,
  IconX,
  IconClock,
  IconDownload,
  IconTrash,
  IconFileTypePdf,
  IconPhoto,
  IconFileText,
  IconAlertCircle
} from "@tabler/icons-react"
import { FileUpload, DocumentTypeSelect } from "@/components/ui/file-upload"
import { toast } from "sonner"

interface Document {
  id: string
  application_id: string
  document_type: string
  file_name: string
  file_size: number
  content_type: string
  status: string
  rejection_reason?: string
  created_at: string
  url?: string
}

interface Application {
  id: string
  status: string
  programs?: {
    id: string
    name_en: string
    universities?: {
      id: string
      name_en: string
    }
  }
  required_documents?: string[]
}

export default function ApplicationDocumentsPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [documents, setDocuments] = React.useState<Document[]>([])
  const [application, setApplication] = React.useState<Application | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [uploadingType, setUploadingType] = React.useState<string | null>(null)

  const fetchApplication = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      } else {
        // Mock data
        setApplication({
          id: applicationId,
          status: 'under_review',
          programs: {
            id: 'prog1',
            name_en: 'Computer Science',
            universities: { id: 'uni1', name_en: 'Tsinghua University' }
          },
          required_documents: ['passport', 'diploma', 'transcript', 'language_certificate', 'photo', 'recommendation']
        })
      }
    } catch (error) {
      console.error("Error fetching application:", error)
    }
  }, [applicationId])

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/documents?application_id=${applicationId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        // Mock data
        setDocuments([
          { id: "1", application_id: applicationId, document_type: "passport", file_name: "passport.pdf", file_size: 1024000, content_type: "application/pdf", status: "verified", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "2", application_id: applicationId, document_type: "transcript", file_name: "transcript.pdf", file_size: 2048000, content_type: "application/pdf", status: "verified", created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "3", application_id: applicationId, document_type: "diploma", file_name: "degree.pdf", file_size: 3072000, content_type: "application/pdf", status: "pending", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "4", application_id: applicationId, document_type: "language_certificate", file_name: "ielts.pdf", file_size: 1536000, content_type: "application/pdf", status: "rejected", rejection_reason: "Document is not clear. Please upload a higher resolution scan.", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "5", application_id: applicationId, document_type: "photo", file_name: "photo.jpg", file_size: 512000, content_type: "image/jpeg", status: "pending", created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        ])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
    
    setLoading(false)
  }, [applicationId])

  React.useEffect(() => {
    fetchApplication()
    fetchDocuments()
  }, [fetchApplication, fetchDocuments])

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      passport: 'Passport',
      diploma: 'Diploma/Degree Certificate',
      transcript: 'Academic Transcript',
      language_certificate: 'Language Test Certificate',
      photo: 'Passport Photo',
      recommendation: 'Recommendation Letter',
      cv: 'CV/Resume',
      study_plan: 'Study Plan',
      financial_proof: 'Financial Support Proof',
      medical_exam: 'Medical Examination Report',
      police_clearance: 'Police Clearance Certificate',
      other: 'Other Document'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
      verified: { icon: <IconCheck className="h-3 w-3 mr-1" />, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Verified" },
      pending: { icon: <IconClock className="h-3 w-3 mr-1" />, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending Review" },
      rejected: { icon: <IconX className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    }
    const c = config[status] || config.pending
    return <Badge className={c.className}>{c.icon}{c.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (contentType: string) => {
    if (contentType?.startsWith('image/')) {
      return <IconPhoto className="h-5 w-5 text-blue-500" />
    }
    if (contentType === 'application/pdf') {
      return <IconFileTypePdf className="h-5 w-5 text-red-500" />
    }
    return <IconFileText className="h-5 w-5 text-gray-500" />
  }

  const handleUpload = async (documentType: string, file: File) => {
    setUploadingType(documentType)

    try {
      const formData = new FormData()
      formData.append('application_id', applicationId)
      formData.append('document_type', documentType)
      formData.append('file', file)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        toast.success("Document uploaded successfully")
        fetchDocuments()
      } else {
        const data = await response.json()
        toast.error(data.error || "Upload failed")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploadingType(null)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/url`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        const fileResponse = await fetch(data.url)
        const blob = await fileResponse.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(blobUrl)
      } else {
        toast.error("Failed to get download link")
      }
    } catch {
      toast.error("Failed to download file")
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        toast.success("Document deleted successfully")
        fetchDocuments()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete document")
      }
    } catch {
      toast.error("Failed to delete document")
    }
  }

  const stats = {
    total: documents.length,
    verified: documents.filter(d => d.status === "verified").length,
    pending: documents.filter(d => d.status === "pending").length,
    rejected: documents.filter(d => d.status === "rejected").length
  }

  const requiredDocs = application?.required_documents || ['passport', 'diploma', 'transcript', 'language_certificate', 'photo', 'recommendation']
  const completionPercentage = Math.round((stats.verified / requiredDocs.length) * 100)

  // Get documents grouped by type
  const documentMap = new Map(documents.map(d => [d.document_type, d]))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <IconArrowLeft className="h-4 w-4 mr-2" /> Back to Application
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Documents</h1>
          <p className="text-muted-foreground">
            {application?.programs?.name_en}
            {application?.programs?.universities && ` - ${application.programs.universities.name_en}`}
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Document Completion</span>
            <span className="text-sm text-muted-foreground">{stats.verified}/{requiredDocs.length} verified</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{completionPercentage}% complete</span>
            {stats.rejected > 0 && (
              <span className="text-red-500">{stats.rejected} need attention</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Uploaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Required Documents</CardTitle>
          <CardDescription>
            Upload all required documents for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {requiredDocs.map((docType) => {
                const existingDoc = documentMap.get(docType)
                const isUploading = uploadingType === docType

                return (
                  <div key={docType} className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className={`p-2 rounded-lg ${
                        existingDoc?.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30' :
                        existingDoc?.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                        existingDoc ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-muted'
                      }`}>
                        {existingDoc ? getFileIcon(existingDoc.content_type) : <IconFile className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{getDocumentTypeLabel(docType)}</h3>
                          {existingDoc && getStatusBadge(existingDoc.status)}
                        </div>
                        {existingDoc ? (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {existingDoc.file_name} • {formatFileSize(existingDoc.file_size)} • Uploaded {formatDate(existingDoc.created_at)}
                            </p>
                            {existingDoc.status === "rejected" && existingDoc.rejection_reason && (
                              <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                                <IconAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span><strong>Reason:</strong> {existingDoc.rejection_reason}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not uploaded yet</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {existingDoc ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(existingDoc.id, existingDoc.file_name)}
                            >
                              <IconDownload className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {(existingDoc.status === "rejected" || existingDoc.status === "pending") && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(existingDoc.id)}
                              >
                                <IconTrash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Upload section for missing or rejected documents */}
                    {(!existingDoc || existingDoc.status === "rejected") && (
                      <div className="pl-4">
                        <FileUpload
                          onUpload={(file) => handleUpload(docType, file)}
                          documentType={getDocumentTypeLabel(docType)}
                          maxSize={10}
                          disabled={isUploading}
                        />
                      </div>
                    )}

                    <Separator />
                  </div>
                )
              })}

              {/* Additional Documents */}
              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground">Additional Documents</h3>
                <div className="p-4 rounded-lg border border-dashed">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <IconUpload className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Upload Additional Document</p>
                      <p className="text-sm text-muted-foreground">
                        Upload any additional documents not listed above
                      </p>
                    </div>
                    <AdditionalDocumentUpload applicationId={applicationId} onUploadSuccess={fetchDocuments} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component for uploading additional documents
function AdditionalDocumentUpload({ 
  applicationId, 
  onUploadSuccess 
}: { 
  applicationId: string
  onUploadSuccess: () => void 
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState("")
  const [uploading, setUploading] = React.useState(false)

  const handleUpload = async (file: File) => {
    if (!selectedType) {
      toast.error("Please select a document type")
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('application_id', applicationId)
      formData.append('document_type', selectedType)
      formData.append('file', file)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        toast.success("Document uploaded successfully")
        setIsOpen(false)
        setSelectedType("")
        onUploadSuccess()
      } else {
        const data = await response.json()
        toast.error(data.error || "Upload failed")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <IconUpload className="h-4 w-4 mr-1" />
        Upload
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Upload Additional Document</CardTitle>
              <CardDescription>Select document type and upload your file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentTypeSelect 
                value={selectedType} 
                onChange={setSelectedType}
              />
              
              {selectedType && (
                <FileUpload
                  onUpload={handleUpload}
                  documentType={selectedType}
                  maxSize={10}
                  disabled={uploading}
                />
              )}
              
              <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
