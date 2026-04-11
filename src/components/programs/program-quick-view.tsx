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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  IconSchool,
  IconMapPin,
  IconClock,
  IconCurrencyDollar,
  IconLanguage,
  IconStar,
  IconBook,
  IconEye,
  IconEdit,
  IconCopy,
  IconExternalLink,
  IconCalendar,
  IconPercentage,
} from "@tabler/icons-react"

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
  editUrl?: string
  viewUrl?: string
  showAdminActions?: boolean
}

export function ProgramQuickView({
  program,
  open,
  onOpenChange,
  onDuplicate,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            {program.universities && (
              <Avatar className="rounded-lg h-12 w-12 shrink-0">
                {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                  <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-muted">
                  <IconSchool className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left">{program.name}</SheetTitle>
              <SheetDescription className="text-left mt-1">
                {program.name_fr && <span className="block">{program.name_fr}</span>}
                {program.universities && (
                  <span className="flex items-center gap-1 mt-1">
                    <IconMapPin className="h-3 w-3" />
                    {program.universities.name_en}
                    {program.universities.city && `, ${program.universities.city}`}
                  </span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <IconEye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{program.view_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Views</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <IconBook className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{program.application_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Applications</div>
              </CardContent>
            </Card>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Degree Level</span>
              <Badge variant={getDegreeBadgeVariant(program.degree_level)} className="capitalize">
                {program.degree_level}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Teaching Language</span>
              <div className="flex items-center gap-1">
                <IconLanguage className="h-4 w-4 text-muted-foreground" />
                <span>{program.language || "General"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
              <div className="flex items-center gap-1">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(program.duration_years)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Tuition Fee</span>
              <div className="flex items-center gap-1">
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatTuition(program.tuition_fee_per_year, program.currency)}</span>
              </div>
            </div>
          </div>

          {/* Category & Start Month */}
          <div className="flex flex-wrap gap-2">
            {program.category && (
              <Badge variant="outline">{program.category}</Badge>
            )}
            {program.sub_category && (
              <Badge variant="outline" className="text-muted-foreground">{program.sub_category}</Badge>
            )}
            {program.start_month && (
              <Badge variant="outline" className="flex items-center gap-1">
                <IconCalendar className="h-3 w-3" />
                Starts {program.start_month}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Scholarship Info */}
          {program.scholarship_available && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <IconStar className="h-5 w-5" />
                <span className="font-medium">Scholarship Available</span>
              </div>
              {program.scholarship_coverage && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-300">
                  <IconPercentage className="h-4 w-4" />
                  <span>Coverage: {program.scholarship_coverage}</span>
                </div>
              )}
              {program.scholarship_types && program.scholarship_types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {program.scholarship_types.map((type, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/30">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requirements Summary */}
          {(program.min_gpa || program.language_requirement) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Requirements</h4>
              <div className="space-y-2 text-sm">
                {program.min_gpa && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum GPA</span>
                    <span className="font-medium">{program.min_gpa}</span>
                  </div>
                )}
                {program.language_requirement && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language Requirement</span>
                    <span className="font-medium">{program.language_requirement}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description Preview */}
          {program.description_en && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Description</h4>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {program.description_en}
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {viewUrl && (
              <Button asChild className="w-full">
                <Link href={viewUrl}>
                  <IconExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Link>
              </Button>
            )}
            {showAdminActions && editUrl && (
              <Button asChild variant="outline" className="w-full">
                <Link href={editUrl}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit Program
                </Link>
              </Button>
            )}
            {showAdminActions && onDuplicate && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => program && onDuplicate(program.id)}
              >
                <IconCopy className="mr-2 h-4 w-4" />
                Duplicate Program
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
