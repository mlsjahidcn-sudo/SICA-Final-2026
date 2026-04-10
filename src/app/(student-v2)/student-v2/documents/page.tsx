"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  IconFiles,
  IconUpload,
  IconFile,
  IconCheck,
  IconX,
  IconClock,
  IconDownload,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconSchool,
  IconPlus
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
  applications?: {
    id: string
    programs?: {
      id: string
      name: string
      universities?: {
        id: string
        name_en: string
      }
    }
  }
}

interface Application {
  id: string
  status: string
  programs?: {
    id: string
    name: string
    universities?: {
      id: string
      name_en: string
    }
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [applications, setApplications] = React.useState<Application[]>([])
  const [stats, setStats] = React.useState({ total: 0, verified: 0, pending: 0, rejected: 0 })
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState("all")
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState("")
  const [selectedDocType, setSelectedDocType] = React.useState("")

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true)
    
    try {
      const token = localStorage.getItem('sica_auth_token')
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append('status', filter)
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setStats(data.stats || { total: 0, verified: 0, pending: 0, rejected: 0 })
      } else {
        const data = await response.json().catch(() => ({}))
        console.error("Failed to fetch documents:", data.error || response.statusText)
        setDocuments([])
        setStats({ total: 0, verified: 0, pending: 0, rejected: 0 })
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocuments([])
      setStats({ total: 0, verified: 0, pending: 0, rejected: 0 })
    }
    
    setLoading(false)
  }, [filter])

  const fetchApplications = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch('/api/student/applications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        console.error("Failed to fetch applications")
        setApplications([])
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
      setApplications([])
    }
  }, [])

  React.useEffect(() => {
    fetchDocuments()
    fetchApplications()
  }, [fetchDocuments, fetchApplications])

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
      pending: { icon: <IconClock className="h-3 w-3 mr-1" />, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      rejected: { icon: <IconX className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    }
    const c = config[status] || config.pending
    return <Badge className={c.className}>{c.icon}{c.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id))
        toast.success("Document deleted successfully")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete document")
      }
    } catch {
      toast.error("Failed to delete document")
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/documents/${documentId}/url`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Use fetch + blob for cross-origin download
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

  const handleUpload = async (file: File) => {
    if (!selectedApplication || !selectedDocType) {
      toast.error("Please select an application and document type")
      return
    }

    const token = localStorage.getItem('sica_auth_token')
    const formData = new FormData()
    formData.append('application_id', selectedApplication)
    formData.append('document_type', selectedDocType)
    formData.append('file', file)

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (response.ok) {
      toast.success("Document uploaded successfully")
      setUploadDialogOpen(false)
      setSelectedApplication("")
      setSelectedDocType("")
      fetchDocuments()
    } else {
      const data = await response.json()
      throw new Error(data.error || "Upload failed")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Library</h1>
          <p className="text-muted-foreground">Manage your application documents</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Select an application and document type, then upload your file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Application</label>
                <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.programs?.name || 'Unknown Program'}
                        {app.programs?.universities && ` - ${app.programs.universities.name_en}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <DocumentTypeSelect 
                  value={selectedDocType} 
                  onChange={setSelectedDocType}
                  disabled={!selectedApplication}
                />
              </div>
              
              {selectedApplication && selectedDocType && (
                <FileUpload 
                  onUpload={handleUpload}
                  documentType={getDocumentTypeLabel(selectedDocType)}
                  maxSize={10}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconFiles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Verified</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => { setLoading(true); fetchDocuments(); }}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({documents.length})</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing ${documents.length} documents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <IconFiles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                Upload documents to support your applications
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <IconUpload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      doc.status === 'verified' ? 'bg-green-100 dark:bg-green-900/30' :
                      doc.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      <IconFile className={`h-6 w-6 ${
                        doc.status === 'verified' ? 'text-green-600' :
                        doc.status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{getDocumentTypeLabel(doc.document_type)}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {doc.file_name} • {formatFileSize(doc.file_size)}
                      </p>
                      {doc.applications?.programs && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <IconSchool className="h-4 w-4" />
                          <span>{doc.applications.programs.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Uploaded: {formatDate(doc.created_at)}</span>
                      </div>
                      {doc.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-2">
                          <IconAlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{doc.rejection_reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                    >
                      <IconDownload className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {doc.status === 'rejected' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student-v2/applications/${doc.application_id}/documents`}>
                          <IconUpload className="h-4 w-4 mr-1" />
                          Re-upload
                        </Link>
                      </Button>
                    )}
                    {doc.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
