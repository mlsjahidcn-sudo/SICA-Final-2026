"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconUser,
  IconSchool,
  IconFileText,
  IconUpload,
  IconDownload,
  IconEye,
  IconTrash,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX
} from "@tabler/icons-react"
import { DocumentUpload, type Document } from "@/components/document-upload"
import { 
  DOCUMENT_TYPES, 
  getDocumentTypeLabel, 
  getDocumentTypeDescription,
  getAllowedMimeTypes 
} from "@/lib/document-types"

interface ApplicationInfo {
  id: string
  student_id: string
  status: string
  students: {
    id: string
    first_name: string | null
    last_name: string | null
    users: {
      id: string
      full_name: string
      email: string
    } | null
  } | null
  programs: {
    id: string
    name: string
    degree_level: string
    universities: {
      id: string
      name_en: string
    } | null
  } | null
}

const DOCUMENT_STATUS_CONFIG: Record<string, { 
  color: string; 
  bgColor: string; 
  icon: typeof IconFileText; 
  label: string 
}> = {
  pending: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500/10', 
    icon: IconAlertCircle, 
    label: 'Pending' 
  },
  verified: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-500/10', 
    icon: IconCircleCheck, 
    label: 'Verified' 
  },
  rejected: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-500/10', 
    icon: IconCircleX, 
    label: 'Rejected' 
  },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsContent({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationInfo | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingTypes, setUploadingTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [applicationId])

  async function fetchData() {
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      // Fetch application info
      const appResponse = await fetch(`/api/admin/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (appResponse.ok) {
        const appData = await appResponse.json()
        setApplication(appData.application || appData)
      } else {
        toast.error('Failed to load application')
        router.push('/admin/v2/applications')
        return
      }

      // Fetch documents
      const docsResponse = await fetch(`/api/documents?application_id=${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData.documents || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => {
      const existing = prev.findIndex(d => d.document_type === document.document_type)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = document
        return updated
      }
      return [...prev, document]
    })
    setUploadingTypes(prev => {
      const next = new Set(prev)
      next.delete(document.document_type)
      return next
    })
  }

  const handleDeleteSuccess = () => {
    fetchData()
  }

  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.url) return
    
    try {
      const response = await fetch(doc.url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = blobUrl
      link.download = doc.file_name
      link.click()
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Failed to download file')
    }
  }

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Application not found
      </div>
    )
  }

  const studentName = application.students?.users?.full_name || 
    `${application.students?.first_name || ''} ${application.students?.last_name || ''}`.trim() ||
    'Unknown Student'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" asChild className="h-7 gap-1">
              <Link href={`/admin/v2/applications/${applicationId}`}>
                <IconArrowLeft className="h-4 w-4" />
                Back to Application
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Manage documents for {studentName}'s application
          </p>
        </div>
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconSchool className="h-5 w-5" />
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Student</div>
              <div className="font-medium flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                {studentName}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Program</div>
              <div className="font-medium">{application.programs?.name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">University</div>
              <div className="font-medium">
                {application.programs?.universities?.name_en || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={DOCUMENT_STATUS_CONFIG[application.status]?.bgColor || 'bg-gray-500/10'}>
                {application.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconUpload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload documents on behalf of the student. All uploaded documents will be marked as "Pending Review" initially.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(DOCUMENT_TYPES).map(([docType, config]) => {
              const existingDoc = documents.find(d => d.document_type === docType)
              
              return (
                <div key={docType} className="space-y-2">
                  <DocumentUpload
                    applicationId={applicationId}
                    studentId={application.student_id}
                    documentType={docType}
                    label={config.en}
                    description={config.description}
                    acceptedTypes={config.mimeTypes}
                    existingDocument={existingDoc}
                    onUploadSuccess={handleUploadSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                    readOnly={false}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconFileText className="h-5 w-5" />
            All Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const docStatus = DOCUMENT_STATUS_CONFIG[doc.status] || DOCUMENT_STATUS_CONFIG.pending
                const StatusIcon = docStatus.icon
                
                return (
                  <div key={doc.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconFileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {getDocumentTypeLabel(doc.document_type)}
                        </p>
                        <Badge className={`${docStatus.bgColor} ${docStatus.color} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {docStatus.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.file_name} · {formatFileSize(doc.file_size)}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDocument(doc)}
                        disabled={!doc.url}
                      >
                        <IconEye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownloadDocument(doc)}
                        disabled={!doc.url}
                      >
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-auto">
            <DocumentsContent applicationId={resolvedParams.id} />
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}
