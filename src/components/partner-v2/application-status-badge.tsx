"use client"

import { Badge } from "@/components/ui/badge"
import {
  IconFileText,
  IconSend,
  IconClock,
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconX,
} from "@tabler/icons-react"

const STATUS_CONFIG: Record<string, { color: string; icon: typeof IconClock; label: string; description: string }> = {
  draft: {
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
    icon: IconFileText,
    label: "Draft",
    description: "Application is being prepared"
  },
  submitted: {
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: IconSend,
    label: "Submitted",
    description: "Application has been submitted"
  },
  under_review: {
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    icon: IconClock,
    label: "Under Review",
    description: "Application is being reviewed"
  },
  document_request: {
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
    icon: IconAlertCircle,
    label: "Document Request",
    description: "Additional documents required"
  },
  interview_scheduled: {
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    icon: IconCalendar,
    label: "Interview",
    description: "Interview has been scheduled"
  },
  accepted: {
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: IconCheck,
    label: "Accepted",
    description: "Application has been accepted"
  },
  rejected: {
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: IconX,
    label: "Rejected",
    description: "Application has been rejected"
  },
  withdrawn: {
    color: "bg-gray-500/10 text-gray-500 border-gray-200",
    icon: IconX,
    label: "Withdrawn",
    description: "Application has been withdrawn"
  },
}

interface ApplicationStatusBadgeProps {
  status: string
  showDescription?: boolean
  size?: "sm" | "md" | "lg"
}

export function ApplicationStatusBadge({ 
  status, 
  showDescription = false,
  size = "md" 
}: ApplicationStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant="outline" 
        className={`${config.color} ${sizeClasses[size]} w-fit font-medium`}
      >
        <Icon className={`${iconSizes[size]} mr-1.5`} />
        {config.label}
      </Badge>
      {showDescription && (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      )}
    </div>
  )
}

export { STATUS_CONFIG }
