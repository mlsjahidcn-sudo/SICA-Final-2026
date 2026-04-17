"use client";

import * as React from "react";
import { useDebouncedCallback } from "use-debounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getValidToken } from "@/lib/auth-token";
import { getDocumentTypeLabel, DOCUMENT_TYPES } from "@/lib/document-types";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  IconChevronDown,
  IconDownload,
  IconFile,
  IconLoader2,
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconUpload,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { DocumentUploadDialog } from "@/components/partner-v2/document-upload-dialog";
import { DocumentEditDialog } from "@/components/partner-v2/document-edit-dialog";

interface Document {
  id: string;
  student_id: string;
  type: string;
  document_type: string;
  document_type_label: string;
  file_name: string;
  file_size: number;
  status: string;
  rejection_reason?: string;
  expires_at?: string;
  expiry_status?: 'expired' | 'expiring' | 'valid';
  url?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function PartnerDocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [expiryFilter, setExpiryFilter] = React.useState("all");

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);

  // Sorting
  const sortBy = "created_at";
  const sortOrder = "desc";

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingDocument, setEditingDocument] = React.useState<Document | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Fetch documents
  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = await getValidToken();
      if (!token) {
        toast.error("Please log in to view documents");
        return;
      }

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      params.append("sort_by", sortBy);
      params.append("sort_order", sortOrder);

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (expiryFilter === "expiring") params.append("is_expiring", "true");
      if (expiryFilter === "expired") params.append("is_expired", "true");

      const response = await fetch(`/api/partner/documents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to fetch documents (${response.status})`;
        console.error("API Error:", errorMsg, "Status:", response.status);
        
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
        } else if (response.status === 403) {
          toast.error("You don't have permission to access this resource.");
        } else {
          toast.error(errorMsg);
        }
        return;
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0, total_pages: data.pagination?.total_pages || 0 }));
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, search, statusFilter, typeFilter, expiryFilter]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, 300);

  // Bulk actions
  const handleBulkAction = async (action: "verify" | "reject" | "download") => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one document");
      return;
    }

    // For reject action, prompt for rejection reason
    let rejectionReason;
    if (action === "reject") {
      rejectionReason = prompt("Please enter a rejection reason:");
      if (!rejectionReason) {
        toast.error("Rejection reason is required");
        return;
      }
    }

    try {
      setBulkActionLoading(true);
      const token = await getValidToken();
      if (!token) return;

      const body: Record<string, unknown> = {
        action,
        document_ids: Array.from(selectedIds),
      };

      if (action === "reject" && rejectionReason) {
        body.rejection_reason = rejectionReason;
      }

      const response = await fetch("/api/partner/documents/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} documents`);
      }

      const data = await response.json();
      
      toast.success(data.message);

      // Refresh documents
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast.error(`Failed to ${action} documents`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-500"><IconCheck className="h-3 w-3 mr-1" />Verified</Badge>;
      case "pending":
        return <Badge variant="secondary"><IconClock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><IconX className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Expiry badge
  const getExpiryBadge = (expiryStatus?: 'expired' | 'expiring' | 'valid') => {
    if (!expiryStatus) return null;

    switch (expiryStatus) {
      case "expired":
        return <Badge variant="destructive"><IconAlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "expiring":
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><IconClock className="h-3 w-3 mr-1" />Expiring Soon</Badge>;
      default:
        return null;
    }
  };

  // Handle edit
  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingDocumentId) return;

    try {
      setDeleting(true);
      const token = await getValidToken();
      if (!token) return;

      const response = await fetch(`/api/partner/documents/${deletingDocumentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingDocumentId(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload and manage student documents
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchDocuments}
      />

      {/* Edit Dialog */}
      <DocumentEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        document={editingDocument}
        onSuccess={fetchDocuments}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone. The file will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or document name..."
              className="pl-8"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(DOCUMENT_TYPES).map(type => (
                <SelectItem key={type} value={type}>
                  {getDocumentTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={expiryFilter} onValueChange={(value) => { setExpiryFilter(value); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("verify")}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("reject")}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconX className="h-4 w-4" />}
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("download")}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDownload className="h-4 w-4" />}
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === documents.length && documents.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <IconLoader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <span className="text-muted-foreground mt-2 block">Loading documents...</span>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <IconFile className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">No documents found</p>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={() => toggleSelection(doc.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.student?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{doc.student?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.document_type_label}</TableCell>
                  <TableCell className="max-w-xs truncate">{doc.file_name}</TableCell>
                  <TableCell>{formatBytes(doc.file_size)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(doc.status)}
                      {doc.rejection_reason && (
                        <span className="text-xs text-muted-foreground">{doc.rejection_reason}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.expires_at ? (
                      <div className="flex flex-col gap-1">
                        {getExpiryBadge(doc.expiry_status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.expires_at)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(doc.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(doc)}>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {doc.url && (
                          <DropdownMenuItem asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <IconDownload className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingDocumentId(doc.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
