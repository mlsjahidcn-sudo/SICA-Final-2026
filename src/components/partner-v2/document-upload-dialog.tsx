"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { getDocumentTypeOptions } from "@/lib/document-types";
import { getValidToken } from "@/lib/auth-token";
import { toast } from "sonner";
import { IconLoader2, IconSearch } from "@tabler/icons-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStudent, setSelectedStudent] = React.useState<string>("");
  const [documentType, setDocumentType] = React.useState<string>("");
  const [expiresAt, setExpiresAt] = React.useState<string>("");
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const documentTypes = getDocumentTypeOptions();

  // Fetch students on mount
  React.useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;

      const response = await fetch("/api/partner/students?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch students");

      const data = await response.json();
      setStudents(
        (data.students || []).map((s: any) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          email: s.email,
        }))
      );
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  // Filter students by search query
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!selectedStudent || !documentType || !file) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setUploading(true);
      const token = await getValidToken();
      if (!token) return;

      // Create form data
      const formData = new FormData();
      formData.append("student_id", selectedStudent);
      formData.append("type", documentType);
      formData.append("file", file);
      if (expiresAt) {
        formData.append("expires_at", new Date(expiresAt).toISOString());
      }

      const response = await fetch("/api/partner/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }

      toast.success("Document uploaded successfully");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent("");
    setDocumentType("");
    setExpiresAt("");
    setFile(null);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for a student. All fields are required except
            expiration date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Student Selection */}
          <div className="grid gap-2">
            <Label htmlFor="student">Student *</Label>
            <div className="relative">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="student-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) setSelectedStudent("");
                }}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    No students found
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(student.id);
                        setSearchQuery(student.name);
                      }}
                      className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                        selectedStudent === student.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.email}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="grid gap-2">
            <Label htmlFor="document-type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="grid gap-2">
            <Label>File *</Label>
            <FileUpload
              onUpload={handleFileSelect}
              documentType={documentType}
              maxSize={10}
            />
          </div>

          {/* Expiration Date (Optional) */}
          <div className="grid gap-2">
            <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <p className="text-xs text-muted-foreground">
              For time-sensitive documents like passport, visa, medical exams,
              etc.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedStudent || !documentType || !file}
          >
            {uploading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
