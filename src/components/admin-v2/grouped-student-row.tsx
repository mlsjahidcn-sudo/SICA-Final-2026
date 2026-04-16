"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import {
  IconChevronDown,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconCopy,
  IconTrash,
  IconBuilding,
  IconUsers,
} from "@tabler/icons-react"

interface InternalApplication {
  id: string
  student_name: string
  passport: string | null
  nationality: string | null
  degree: string | null
  major: string | null
  university_choice: string | null
  overview: string | null
  missing_docs: string[]
  remarks_for_university: string | null
  status: string
  user_id: string | null
  email: string | null
  portal_link: string | null
  partner: string | null
  note: string | null
  application_date: string | null
  follow_up_date: string | null
  comments: string | null
  created_at: string
  updated_at: string
}

interface GroupedApplication {
  passport: string | null
  student_name: string
  nationality: string | null
  applications: InternalApplication[]
  stats: {
    total: number
    pending: number
    processing: number
    accepted: number
    rejected: number
    submitted: number
    withdrawn: number
    follow_up: number
  }
  universities: string[]
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Pending' },
  processing: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Processing' },
  submitted: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Submitted' },
  accepted: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Accepted' },
  rejected: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Rejected' },
  withdrawn: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Withdrawn' },
  follow_up: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Follow Up' },
}

interface GroupedStudentRowProps {
  group: GroupedApplication
  onDelete: (id: string) => void
}

export function GroupedStudentRow({ group, onDelete }: GroupedStudentRowProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      {/* Main Row - Student Summary */}
      <TableRow 
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <IconChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <IconChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{group.student_name}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {group.passport || '-'}
        </TableCell>
        <TableCell>{group.nationality || '-'}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <IconUsers className="h-3 w-3" />
              {group.stats.total} {group.stats.total === 1 ? 'app' : 'apps'}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {group.universities.slice(0, 3).map((uni, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <IconBuilding className="mr-1 h-3 w-3" />
                {uni.length > 20 ? `${uni.substring(0, 20)}...` : uni}
              </Badge>
            ))}
            {group.universities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{group.universities.length - 3} more
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {group.stats.accepted > 0 && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                ✓ {group.stats.accepted}
              </Badge>
            )}
            {group.stats.processing > 0 && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                ◐ {group.stats.processing}
              </Badge>
            )}
            {group.stats.pending > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                ○ {group.stats.pending}
              </Badge>
            )}
            {group.stats.submitted > 0 && (
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                ◑ {group.stats.submitted}
              </Badge>
            )}
            {group.stats.rejected > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs">
                ✗ {group.stats.rejected}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">
            {isOpen ? 'Collapse' : 'Expand'}
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded Content - Individual Applications */}
      {isOpen && (
        <TableRow>
          <TableCell colSpan={7} className="p-0 bg-muted/30">
            <div className="p-4">
              <Table>
                <TableBody>
                  {group.applications.map((app) => (
                    <TableRow key={app.id} className="border-b">
                      <TableCell className="w-[50px]"></TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium">{app.degree || '-'}</div>
                          <div className="text-sm text-muted-foreground">{app.major || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={app.university_choice || ''}>
                          {app.university_choice || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{app.partner || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${STATUS_CONFIG[app.status]?.bgColor || 'bg-gray-100'} ${STATUS_CONFIG[app.status]?.color || 'text-gray-700'}`}
                        >
                          {STATUS_CONFIG[app.status]?.label || app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(app.application_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/v2/internal-apps/${app.id}`}>
                              <IconEye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/v2/internal-apps/${app.id}/edit`}>
                              <IconEdit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/v2/internal-apps/${app.id}/copy`}>
                              <IconCopy className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(app.id)
                            }}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
