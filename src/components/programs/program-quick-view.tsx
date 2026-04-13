"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  School,
  MapPin,
  Clock,
  DollarSign,
  Languages,
  Star,
  BookOpen,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Calendar,
  Percent,
  Trash2,
  Archive,
  Target,
  Award,
  Building,
} from "lucide-react"

interface University {
  id: string
  name_en: string
  name_cn?: string | null
  city?: string
  province?: string
  logo_url?: string | null
}

interface Program {
  id: string
  name: string
  name_fr?: string | null
  code?: string | null
  degree_level: string
  language: string
  category?: string | null
  sub_category?: string | null
  duration_years?: number | null
  tuition_fee_per_year?: number | null
  currency?: string
  description?: string | null
  description_en?: string | null
  description_cn?: string | null
  scholarship_coverage?: string | null
  scholarship_types?: string[] | null
  scholarship_available?: boolean
  is_active?: boolean
  view_count?: number
  application_count?: number
  start_month?: string | null
  min_gpa?: number | null
  language_requirement?: string | null
  universities?: University
}

interface ProgramQuickViewProps {
  program: Program | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDuplicate?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  editUrl?: string
  viewUrl?: string
  showAdminActions?: boolean
}

export function ProgramQuickView({
  program,
  open,
  onOpenChange,
  onDuplicate,
  onArchive,
  onDelete,
  editUrl,
  viewUrl,
  showAdminActions = false,
}: ProgramQuickViewProps) {
  if (!program) return null

  const formatTuition = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (!amount) return "Not specified"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()}/year`
  }

  const formatDuration = (years: number | null | undefined) => {
    if (!years) return "Not specified"
    return `${years} year${years > 1 ? 's' : ''}`
  }

  const getDegreeBadgeVariant = (level: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      bachelor: 'default',
      master: 'secondary',
      phd: 'outline',
      'chinese language': 'default',
    }
    return variants[level.toLowerCase()] || 'outline'
  }

  const getDegreeIcon = (level: string) => {
    const icons: Record<string, React.ReactNode> = {
      bachelor: <BookOpen className="h-3 w-3" />,
      master: <Award className="h-3 w-3" />,
      phd: <Target className="h-3 w-3" />,
    }
    return icons[level.toLowerCase()] || <BookOpen className="h-3 w-3" />
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            {program.universities && (
              <Avatar className="rounded-lg h-12 w-12 shrink-0">
                {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                  <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-muted">
                  <School className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left truncate">{program.name}</SheetTitle>
              <SheetDescription className="text-left mt-1">
                {program.name_fr && <span className="block truncate">{program.name_fr}</span>}
                {program.universities && (
                  <span className="flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" />
                    {program.universities.name_en}
                    {program.universities.city && `, ${program.universities.city}`}
                  </span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{program.view_count || 0}</div>
                <div className="text-xs text-muted-foreground">Total Views</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{program.application_count || 0}</div>
                <div className="text-xs text-muted-foreground">Applications</div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getDegreeBadgeVariant(program.degree_level)} className="gap-1">
              {getDegreeIcon(program.degree_level)}
              <span className="capitalize">{program.degree_level}</span>
            </Badge>
            {program.category && (
              <Badge variant="outline">{program.category}</Badge>
            )}
            {program.sub_category && (
              <Badge variant="outline" className="text-muted-foreground">{program.sub_category}</Badge>
            )}
            {program.start_month && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Starts {program.start_month}
              </Badge>
            )}
            {program.is_active === false && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>

          <Separator />

          {/* Program Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Program Details</h4>
            <div className="grid gap-3">
              {/* Teaching Language */}
              <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 flex justify-between">
                  <span className="text-muted-foreground">Teaching Language</span>
                  <span className="font-medium capitalize">{program.language || "General"}</span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(program.duration_years)}</span>
                </div>
              </div>

              {/* Tuition Fee */}
              <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 flex justify-between">
                  <span className="text-muted-foreground">Tuition Fee</span>
                  <span className="font-medium">{formatTuition(program.tuition_fee_per_year, program.currency)}</span>
                </div>
              </div>

              {/* Program Code */}
              {program.code && (
                <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-muted-foreground">Program Code</span>
                    <span className="font-medium font-mono">{program.code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          {(program.min_gpa || program.language_requirement) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Requirements</h4>
                <div className="grid gap-3">
                  {program.min_gpa && (
                    <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                      <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 flex justify-between">
                        <span className="text-muted-foreground">Minimum GPA</span>
                        <span className="font-medium">{program.min_gpa}</span>
                      </div>
                    </div>
                  )}
                  {program.language_requirement && (
                    <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-md">
                      <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 flex justify-between">
                        <span className="text-muted-foreground">Language Requirement</span>
                        <span className="font-medium">{program.language_requirement}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Scholarship Info */}
          {program.scholarship_available && (
            <>
              <Separator />
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-3">
                  <Star className="h-5 w-5" />
                  <span className="font-semibold">Scholarship Available</span>
                </div>
                {program.scholarship_coverage && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-300 mb-2">
                    <Percent className="h-4 w-4" />
                    <span>Coverage: {program.scholarship_coverage}</span>
                  </div>
                )}
                {program.scholarship_types && program.scholarship_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {program.scholarship_types.map((type, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Description Preview */}
          {program.description_en && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Description</h4>
                <p className="text-sm text-muted-foreground line-clamp-4 p-3 bg-muted/50 rounded-md">
                  {program.description_en}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pb-4">
            {viewUrl && (
              <Button asChild className="flex-1">
                <Link href={viewUrl}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Link>
              </Button>
            )}
            {showAdminActions && editUrl && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={editUrl}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Program
                </Link>
              </Button>
            )}
          </div>

          {/* Admin Actions */}
          {showAdminActions && (
            <div className="flex flex-col gap-2">
              {onDuplicate && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => program && onDuplicate(program.id)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Program
                </Button>
              )}
              {onArchive && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => program && onArchive(program.id)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Program
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => program && onDelete(program.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
