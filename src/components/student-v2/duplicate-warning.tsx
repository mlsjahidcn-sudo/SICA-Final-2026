"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconEye,
  IconX
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface ExistingApplication {
  id: string
  status: string
  intake: string
  created_at: string
  programs?: {
    id: string
    name_en: string
    universities?: {
      name_en: string
    }
  }
}

interface DuplicateWarningProps {
  programId: string
  universityId?: string
  intake?: string
  onDismiss?: () => void
  className?: string
}

export function DuplicateApplicationWarning({
  programId,
  universityId,
  intake,
  onDismiss,
  className,
}: DuplicateWarningProps) {
  const [loading, setLoading] = React.useState(true)
  const [sameProgramApps, setSameProgramApps] = React.useState<ExistingApplication[]>([])
  const [sameUniApps, setSameUniApps] = React.useState<ExistingApplication[]>([])

  React.useEffect(() => {
    const checkDuplicates = async () => {
      try {
        const params = new URLSearchParams()
        params.set('program_id', programId)
        if (universityId) params.set('university_id', universityId)
        if (intake) params.set('intake', intake)

        const response = await fetch(`/api/student/applications/check-duplicate?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSameProgramApps(data.sameProgramApplications || [])
          setSameUniApps(data.sameUniversityApplications || [])
        }
      } catch (error) {
        console.error('Error checking duplicates:', error)
      } finally {
        setLoading(false)
      }
    }

    if (programId) {
      checkDuplicates()
    }
  }, [programId, universityId, intake])

  if (loading || (sameProgramApps.length === 0 && sameUniApps.length === 0)) {
    return null
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
      under_review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700' },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    }
    const c = config[status] || config.draft
    return <Badge className={c.className}>{c.label}</Badge>
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Same program warning - blocking */}
      {sameProgramApps.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Application Already Exists</span>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <IconX className="h-4 w-4" />
              </Button>
            )}
          </AlertTitle>
          <AlertDescription className="mt-3">
            <p className="mb-3">
              You already have an active application for this program. 
              Please check your existing application before creating a new one.
            </p>
            <div className="space-y-2">
              {sameProgramApps.map((app) => (
                <div 
                  key={app.id}
                  className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900 border"
                >
                  <div className="flex items-center gap-2">
                    {getStatusBadge(app.status)}
                    <div>
                      <p className="text-sm font-medium">{app.intake}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/student-v2/applications/${app.id}`}>
                      <IconEye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Same university warning - non-blocking */}
      {sameUniApps.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="flex items-center justify-between text-yellow-800 dark:text-yellow-400">
            <span>Other Applications to This University</span>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <IconX className="h-4 w-4" />
              </Button>
            )}
          </AlertTitle>
          <AlertDescription className="mt-3">
            <p className="mb-3 text-yellow-700 dark:text-yellow-500">
              You have other applications to this university. Make sure this is a different program.
            </p>
            <div className="space-y-2">
              {sameUniApps.map((app) => (
                <div 
                  key={app.id}
                  className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900 border border-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    {getStatusBadge(app.status)}
                    <div>
                      <p className="text-sm font-medium">{app.programs?.name_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.intake} • Created {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/student-v2/applications/${app.id}`}>
                      <IconEye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Compact inline warning for forms
export function DuplicateWarningCompact({
  programId,
  universityId,
  intake,
}: Omit<DuplicateWarningProps, 'onDismiss' | 'className'>) {
  const [loading, setLoading] = React.useState(true)
  const [hasDuplicate, setHasDuplicate] = React.useState(false)

  React.useEffect(() => {
    const checkDuplicates = async () => {
      try {
        const params = new URLSearchParams()
        params.set('program_id', programId)
        if (universityId) params.set('university_id', universityId)
        if (intake) params.set('intake', intake)

        const response = await fetch(`/api/student/applications/check-duplicate?${params}`)
        if (response.ok) {
          const data = await response.json()
          setHasDuplicate(data.hasExisting)
        }
      } catch (error) {
        console.error('Error checking duplicates:', error)
      } finally {
        setLoading(false)
      }
    }

    if (programId) {
      checkDuplicates()
    }
  }, [programId, universityId, intake])

  if (loading || !hasDuplicate) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950/20 rounded">
      <IconAlertCircle className="h-4 w-4" />
      <span>You already have an active application for this program</span>
    </div>
  )
}
