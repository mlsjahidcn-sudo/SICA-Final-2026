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
import { getDocumentTypeOptions, getDocumentTypeLabel } from "@/lib/document-types";
import { getValidToken } from "@/lib/auth-token";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { formatDate } from "@/lib/utils";

interface Document {
  id: string;
  type: string;
  expires_at?: string;
  file_name: string;
}

interface DocumentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onSuccess: () => void;
}

export function DocumentEditDialog({
  open,
  onOpenChange,
  document,
  onSuccess,
}: DocumentEditDialogProps) {
  const [documentType, setDocumentType] = React.useState<string>("");
  const [expiresAt, setExpiresAt] = React.useState<string>("");
  const [updating, setUpdating] = React.useState(false);

  const documentTypes = getDocumentTypeOptions();

  // Reset form when document changes
  React.useEffect(() => {
    if (document) {
      setDocumentType(document.type);
      setExpiresAt(
        document.expires_at
          ? new Date(document.expires_at).toISOString().split("T")[0]
          : ""
      );
    }
  }, [document]);

  const handleUpdate = async () => {
    if (!document) return;

    try {
      setUpdating(true);
      const token = await getValidToken();
      if (!token) return;

      const response = await fetch(`/api/partner/documents/${document.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: documentType,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update document");
      }

      toast.success("Document updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update document"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document type and expiration date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Document Type */}
          <div className="grid gap-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiration Date */}
          <div className="grid gap-2">
            <Label htmlFor="expires-at">Expiration Date</Label>
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

          {/* Current File Info */}
          <div className="grid gap-2">
            <Label>Current File</Label>
            <div className="text-sm p-3 bg-muted rounded-md">
              <p className="font-medium truncate">{document.file_name}</p>
              {document.expires_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {formatDate(document.expires_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
