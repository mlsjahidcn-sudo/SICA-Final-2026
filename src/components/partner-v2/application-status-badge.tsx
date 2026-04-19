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
  IconSchool,
  IconFileCertificate,
  IconId,
} from "@tabler/icons-react"

const STATUS_CONFIG: Record<string, { color: string; icon: typeof IconClock; label: string; description: string }> = {
  draft: {
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
    icon: IconFileText,
    label: "Draft",
    description: "Application is being prepared"
  },
  in_progress: {
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: IconClock,
    label: "In Progress",
    description: "Application is being processed"
  },
  submitted_to_university: {
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    icon: IconSend,
    label: "Submitted to University",
    description: "Application has been submitted to the university"
  },
  passed_initial_review: {
    color: "bg-teal-500/10 text-teal-600 border-teal-200",
    icon: IconCheck,
    label: "Passed Initial Review",
    description: "Application passed initial review"
  },
  pre_admitted: {
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    icon: IconSchool,
    label: "Pre Admitted",
    description: "Pre-admission confirmed"
  },
  admitted: {
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: IconFileCertificate,
    label: "Admitted",
    description: "Officially admitted"
  },
  jw202_released: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    icon: IconId,
    label: "JW202 Released",
    description: "JW202 form has been issued"
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
