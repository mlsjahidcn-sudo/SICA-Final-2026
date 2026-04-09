"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconCalendar,
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface DeadlineInfo {
  intake: string
  deadline: string | null
  status: 'upcoming' | 'urgent' | 'passed' | 'unknown'
  daysRemaining: number | null
}

interface ApplicationDeadlineProps {
  intake: string
  deadlineFall?: string | null
  deadlineSpring?: string | null
  applicationStatus: string
  className?: string
}

/**
 * Parse deadline string (could be various formats like "June 15", "2024-06-15", etc.)
 */
function parseDeadline(deadlineStr: string | null | undefined): Date | null {
  if (!deadlineStr) return null
  
  // Try ISO format first
  const isoDate = new Date(deadlineStr)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }
  
  // Try "Month Day" format (e.g., "June 15")
  const currentYear = new Date().getFullYear()
  const monthDayMatch = deadlineStr.match(/^(\w+)\s+(\d{1,2})$/)
  if (monthDayMatch) {
    const date = new Date(`${monthDayMatch[1]} ${monthDayMatch[2]}, ${currentYear}`)
    if (!isNaN(date.getTime())) {
      // If date has passed, assume next year
      if (date < new Date()) {
        date.setFullYear(currentYear + 1)
      }
      return date
    }
  }
  
  return null
}

/**
 * Determine which deadline applies based on intake
 */
function getApplicableDeadline(
  intake: string,
  deadlineFall?: string | null,
  deadlineSpring?: string | null
): DeadlineInfo {
  const currentYear = new Date().getFullYear()
  const intakeLower = intake.toLowerCase()
  
  let deadline: Date | null = null
  let deadlineStr: string | null = null
  
  // Determine semester from intake string
  if (intakeLower.includes('fall') || intakeLower.includes('september') || intakeLower.includes('autumn')) {
    deadlineStr = deadlineFall || null
    deadline = parseDeadline(deadlineStr)
  } else if (intakeLower.includes('spring') || intakeLower.includes('march') || intakeLower.includes('february')) {
    deadlineStr = deadlineSpring || null
    deadline = parseDeadline(deadlineStr)
  } else {
    // Try to extract year and guess semester
    const yearMatch = intake.match(/\d{4}/)
    if (yearMatch) {
      // Default to fall deadline
      deadlineStr = deadlineFall || deadlineSpring || null
      deadline = parseDeadline(deadlineStr)
    }
  }
  
  if (!deadline) {
    return {
      intake,
      deadline: deadlineStr,
      status: 'unknown',
      daysRemaining: null,
    }
  }
  
  const now = new Date()
  const diffTime = deadline.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let status: 'upcoming' | 'urgent' | 'passed' | 'unknown'
  if (daysRemaining < 0) {
    status = 'passed'
  } else if (daysRemaining <= 14) {
    status = 'urgent'
  } else {
    status = 'upcoming'
  }
  
  return {
    intake,
    deadline: deadline.toISOString(),
    status,
    daysRemaining,
  }
}

export function ApplicationDeadline({
  intake,
  deadlineFall,
  deadlineSpring,
  applicationStatus,
  className,
}: ApplicationDeadlineProps) {
  const deadlineInfo = React.useMemo(() => {
    return getApplicableDeadline(intake, deadlineFall, deadlineSpring)
  }, [intake, deadlineFall, deadlineSpring])

  // Don't show if already accepted or rejected
  if (['accepted', 'rejected'].includes(applicationStatus)) {
    return null
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusConfig = () => {
    switch (deadlineInfo.status) {
      case 'passed':
        return {
          icon: <IconX className="h-4 w-4" />,
          badge: { label: 'Passed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
          cardClass: 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
          message: 'Application deadline has passed',
        }
      case 'urgent':
        return {
          icon: <IconAlertTriangle className="h-4 w-4 text-yellow-500" />,
          badge: { label: 'Urgent', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
          cardClass: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20',
          message: `Only ${deadlineInfo.daysRemaining} days left to apply!`,
        }
      case 'upcoming':
        return {
          icon: <IconClock className="h-4 w-4 text-blue-500" />,
          badge: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
          cardClass: 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20',
          message: `${deadlineInfo.daysRemaining} days remaining`,
        }
      default:
        return {
          icon: <IconCalendar className="h-4 w-4" />,
          badge: { label: 'Check Details', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
          cardClass: '',
          message: 'Contact university for deadline information',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Card className={cn(config.cardClass, className)}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-background">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Application Deadline</span>
                <Badge className={config.badge.className}>
                  {config.badge.label}
                </Badge>
              </div>
              {deadlineInfo.deadline ? (
                <p className="text-sm text-muted-foreground">
                  {formatDate(deadlineInfo.deadline)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Deadline not specified
                </p>
              )}
              <p className={cn(
                "text-sm mt-1",
                deadlineInfo.status === 'urgent' && "text-yellow-600 font-medium",
                deadlineInfo.status === 'passed' && "text-red-600"
              )}>
                {config.message}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for lists
export function ApplicationDeadlineCompact({
  intake,
  deadlineFall,
  deadlineSpring,
  applicationStatus,
}: Omit<ApplicationDeadlineProps, 'className'>) {
  const deadlineInfo = React.useMemo(() => {
    return getApplicableDeadline(intake, deadlineFall, deadlineSpring)
  }, [intake, deadlineFall, deadlineSpring])

  if (['accepted', 'rejected'].includes(applicationStatus)) {
    return null
  }

  if (deadlineInfo.status === 'passed') {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <IconX className="h-3 w-3 mr-1" />
        Deadline Passed
      </Badge>
    )
  }

  if (deadlineInfo.status === 'urgent') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <IconAlertTriangle className="h-3 w-3 mr-1" />
        {deadlineInfo.daysRemaining} days left
      </Badge>
    )
  }

  if (deadlineInfo.daysRemaining !== null) {
    return (
      <Badge variant="outline">
        <IconClock className="h-3 w-3 mr-1" />
        {deadlineInfo.daysRemaining} days
      </Badge>
    )
  }

  return null
}
