"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getValidToken } from "@/lib/auth-token";
import { formatDate } from "@/lib/utils";
import {
  IconAlertTriangle,
  IconClock,
  IconFile,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";

interface ExpiringDocument {
  id: string;
  type: string;
  file_name: string;
  expires_at: string;
  days_until_expiry: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export function DocumentExpiryAlerts() {
  const [expiringDocs, setExpiringDocs] = React.useState<ExpiringDocument[]>([]);
  const [expiredDocs, setExpiredDocs] = React.useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchExpiryData = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;

        // Fetch expiring documents
        const expiringResponse = await fetch("/api/partner/documents?is_expiring=true&limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (expiringResponse.ok) {
          const data = await expiringResponse.json();
          setExpiringDocs(data.documents || []);
        }

        // Fetch expired documents
        const expiredResponse = await fetch("/api/partner/documents?is_expired=true&limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (expiredResponse.ok) {
          const data = await expiredResponse.json();
          setExpiredDocs(data.documents || []);
        }
      } catch (error) {
        console.error("Error fetching expiry data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiryData();
  }, []);

  if (loading) {
    return (
      <Alert>
        <IconLoader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Loading expiry alerts...</AlertTitle>
      </Alert>
    );
  }

  const hasAlerts = expiringDocs.length > 0 || expiredDocs.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <>
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <IconAlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-700 dark:text-orange-300">Document Expiry Alerts</AlertTitle>
        <AlertDescription className="text-orange-600 dark:text-orange-400">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              {expiredDocs.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <IconAlertTriangle className="h-3 w-3" />
                  {expiredDocs.length} Expired
                </Badge>
              )}
              {expiringDocs.length > 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-600 flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  {expiringDocs.length} Expiring Soon
                </Badge>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-orange-500 text-orange-600 hover:bg-orange-100">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Document Expiry Alerts</DialogTitle>
                  <DialogDescription>
                    Documents that are expiring or have already expired
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Expired Documents */}
                  {expiredDocs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
                        <IconAlertTriangle className="h-4 w-4" />
                        Expired Documents ({expiredDocs.length})
                      </h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Document</TableHead>
                              <TableHead>Expired</TableHead>
                              <TableHead>Days Overdue</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expiredDocs.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {doc.first_name} {doc.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {doc.email}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{doc.type}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                                      {doc.file_name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-destructive">
                                  {formatDate(doc.expires_at)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="destructive">
                                    {Math.abs(doc.days_until_expiry)} days
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Expiring Documents */}
                  {expiringDocs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-orange-600 mb-3 flex items-center gap-2">
                        <IconClock className="h-4 w-4" />
                        Expiring Soon ({expiringDocs.length})
                      </h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Document</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead>Days Left</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expiringDocs.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {doc.first_name} {doc.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {doc.email}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{doc.type}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                                      {doc.file_name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-orange-600">
                                  {formatDate(doc.expires_at)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                                    {doc.days_until_expiry} days
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Close
                  </Button>
                  <Button asChild>
                    <Link href="/partner-v2/students">
                      View Students
                    </Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </AlertDescription>
      </Alert>
    </>
  );
}
