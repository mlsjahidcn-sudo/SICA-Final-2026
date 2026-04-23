"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { 
  FileText, Search, MoreHorizontal, Check, X, 
  Eye, Download, RefreshCw, FilterX, User
} from "lucide-react"
import { DocumentStatusBadge, formatFileSize } from "@/components/ui/document-status-badge"
import { DOCUMENT_TYPE_LABELS } from "@/components/document-upload"

interface Document {
  id: string
  student_id: string
  application_id: string | null
  type: string
  document_type_label: string
  file_name: string
  file_size: number
  status: 'pending' | 'verified' | 'rejected'
  rejection_reason?: string | null
  uploaded_at: string
  student?: {
    id: string
    name: string
    email: string
  }
  partner?: {
    id: string
    name: string
    email: string
  }
  is_partner_document?: boolean
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort_by: "uploaded_at",
        sort_order: "desc"
      })

      if (searchQuery) queryParams.append('search', searchQuery)
      if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter)
      if (typeFilter && typeFilter !== 'all') queryParams.append('type', typeFilter)
      if (sourceFilter && sourceFilter !== 'all') queryParams.append('source', sourceFilter)

      const response = await fetch(`/api/admin/documents?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.total || 0)
      } else {
        toast.error("Failed to fetch documents")
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast.error("An error occurred while loading documents")
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, statusFilter, typeFilter, sourceFilter])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchDocuments()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchDocuments])

  const handleStatusChange = async (docId: string, newStatus: 'verified' | 'rejected', reason?: string) => {
    if (newStatus === 'rejected' && !reason) {
      const promptReason = window.prompt("Please provide a reason for rejection:");
      if (promptReason === null) return; // User cancelled
      reason = promptReason;
    }

    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch(`/api/admin/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, rejection_reason: reason })
      })

      if (response.ok) {
        toast.success(`Document marked as ${newStatus}`)
        fetchDocuments()
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to mark document as ${newStatus}`)
      }
    } catch (error) {
      console.error("Error updating document status:", error)
      toast.error("An error occurred")
    }
  }

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch(`/api/documents/${docId}/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const { url } = await response.json()
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        toast.error("Failed to get download link")
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      toast.error("An error occurred")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
    setSourceFilter("all")
    setPage(1)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto bg-muted/10">
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                <p className="text-muted-foreground text-sm">
                  Manage and verify all student documents
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchDocuments()}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student or file name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="partner">Partner Applications</SelectItem>
                        <SelectItem value="individual">Individual Applications</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all') && (
                      <Button variant="ghost" onClick={resetFilters} className="px-2">
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document List */}
            <Card>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                          Loading documents...
                        </TableCell>
                      </TableRow>
                    ) : documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          No documents found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex flex-col max-w-[200px] lg:max-w-[300px]">
                                <span className="font-medium truncate" title={doc.file_name}>
                                  {doc.file_name || doc.type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.file_size || 0)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {doc.student ? (
                              <div className="flex flex-col">
                                <Link 
                                  href={`/admin/v2/students/${doc.student.id}`}
                                  className="font-medium hover:underline text-primary"
                                >
                                  {doc.student.name}
                                </Link>
                                <span className="text-xs text-muted-foreground">{doc.student.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> Unknown
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.partner ? (
                              <div className="flex flex-col">
                                <Link
                                  href={`/admin/v2/partners/${doc.partner.id}`}
                                  className="font-medium hover:underline text-violet-600"
                                >
                                  {doc.partner.name}
                                </Link>
                                <span className="text-xs text-muted-foreground">{doc.partner.email}</span>
                              </div>
                            ) : doc.is_partner_document ? (
                              <span className="text-muted-foreground text-xs">Partner doc</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{doc.document_type_label || doc.type}</span>
                          </TableCell>
                          <TableCell>
                            <DocumentStatusBadge status={doc.status} />
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={doc.rejection_reason}>
                                {doc.rejection_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.file_name || doc.type)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download / View
                                </DropdownMenuItem>
                                
                                {doc.application_id && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/v2/applications/${doc.application_id}/documents`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View in Application
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                {doc.status !== 'verified' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(doc.id, 'verified')}
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Verified
                                  </DropdownMenuItem>
                                )}
                                
                                {doc.status !== 'rejected' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(doc.id, 'rejected')}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject Document
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 flex items-center justify-between border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, totalItems)}</span> of <span className="font-medium">{totalItems}</span> documents
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}