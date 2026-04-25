"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconFile,
  IconCheck,
  IconX,
  IconClock,
  IconUpload,
  IconAlertCircle,
  IconChevronRight
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface DocumentChecklistItem {
  document_type: string
  label_en: string
  label_zh: string
  description: string
  is_required: boolean
  is_uploaded: boolean
  status: 'verified' | 'pending' | 'rejected' | 'not_uploaded'
  file_name: string | null
  uploaded_at: string | null
  document_id: string | null
}

interface DocumentChecklistProps {
  applicationId: string
  showUploadButton?: boolean
  compact?: boolean
}

export function DocumentChecklist({ 
  applicationId, 
  showUploadButton = true,
  compact = false 
}: DocumentChecklistProps) {
  const [loading, setLoading] = React.useState(true)
  const [checklist, setChecklist] = React.useState<DocumentChecklistItem[]>([])
  const [summary, setSummary] = React.useState({
    total_required: 0,
    uploaded_count: 0,
    verified_count: 0,
    missing_count: 0,
    completion_percentage: 0,
    can_submit: false,
    missing_types: [] as string[],
  })

  const fetchChecklist = React.useCallback(async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      const response = await fetch(`/api/student/applications/${applicationId}/documents/checklist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setChecklist(data.checklist)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error fetching checklist:", error)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  React.useEffect(() => {
    fetchChecklist()
  }, [fetchChecklist])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <IconCheck className="h-4 w-4 text-green-500" />
      case 'pending':
        return <IconClock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <IconX className="h-4 w-4 text-red-500" />
      default:
        return <IconAlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      verified: { label: 'Verified', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      not_uploaded: { label: 'Not Uploaded', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
    }
    const c = config[status] || config.not_uploaded
    return <Badge className={c.className}>{c.label}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents</CardTitle>
            <Badge variant={summary.missing_count === 0 ? "default" : "secondary"}>
              {summary.uploaded_count}/{summary.total_required}
            </Badge>
          </div>
          <Progress value={summary.completion_percentage} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="pt-0">
          {summary.missing_count > 0 ? (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <IconAlertCircle className="h-4 w-4" />
              <span>{summary.missing_count} document(s) missing</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <IconCheck className="h-4 w-4" />
              <span>All documents uploaded</span>
            </div>
          )}
          {showUploadButton && (
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link href={`/student-v2/applications/${applicationId}/documents`}>
                <IconUpload className="h-4 w-4 mr-2" />
                Manage Documents
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Required Documents</CardTitle>
            <CardDescription>
              Upload all required documents before submitting your application
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{summary.completion_percentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
        <Progress value={summary.completion_percentage} className="h-2 mt-3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.document_type}
              className={cn(
                "flex items-start justify-between p-3 rounded-lg border transition-colors",
                item.is_uploaded 
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                  : "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  item.is_uploaded ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"
                )}>
                  {getStatusIcon(item.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label_en}</span>
                    {!item.is_required && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.label_zh}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
                  {item.file_name && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                      📎 {item.file_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(item.status)}
                {!item.is_uploaded && showUploadButton && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/student-v2/applications/${applicationId}/documents?upload=${item.document_type}`}>
                      <IconUpload className="h-3 w-3 mr-1" />
                      Upload
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.verified_count}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{summary.uploaded_count - summary.verified_count}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.missing_count}</div>
              <div className="text-xs text-muted-foreground">Missing</div>
            </div>
          </div>
        </div>

        {/* Action */}
        {showUploadButton && (
          <Button className="w-full mt-4" asChild>
            <Link href={`/student-v2/applications/${applicationId}/documents`}>
              Manage All Documents
              <IconChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
