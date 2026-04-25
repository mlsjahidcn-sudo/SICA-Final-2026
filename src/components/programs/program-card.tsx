"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  IconSchool,
  IconMapPin,
  IconClock,
  IconCurrencyDollar,
  IconLanguage,
  IconStar,
  IconEye,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface University {
  id: string
  name_en: string
  name_cn?: string | null
  city?: string | null
  province?: string | null
  logo_url?: string | null
}

interface Program {
  id: string
  name: string
  degree_level: string
  language: string
  category?: string | null
  sub_category?: string | null
  duration_years?: number | null
  tuition_fee_per_year?: number | null
  currency?: string
  scholarship_coverage?: string | null
  scholarship_types?: string[] | null
  is_active?: boolean
  universities?: University
}

interface ProgramCardProps {
  program: Program
  href?: string
  onQuickView?: (program: Program) => void
  showQuickViewButton?: boolean
  className?: string
  compact?: boolean
}

export function ProgramCard({
  program,
  href,
  onQuickView,
  showQuickViewButton = false,
  className,
  compact = false,
}: ProgramCardProps) {
  const formatTuition = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (!amount) return "TBD"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()}/yr`
  }

  const formatDuration = (years: number | null | undefined) => {
    if (!years) return "TBD"
    return `${years} yr${years > 1 ? 's' : ''}`
  }

  const hasScholarship = !!program.scholarship_coverage || (program.scholarship_types && program.scholarship_types.length > 0)

  const cardContent = (
    <Card className={cn(
      "group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full",
      href && "cursor-pointer",
      className
    )}>
      <CardContent className={cn("p-4", compact ? "p-3" : "p-5")}>
        <div className="flex items-start gap-3">
          {/* University Logo */}
          {program.universities && (
            <Avatar className="rounded-lg shrink-0 h-10 w-10">
              {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <IconSchool className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <Badge variant="secondary" className="text-xs capitalize">
                {program.degree_level}
              </Badge>
              {hasScholarship && (
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800 dark:text-yellow-400">
                  <IconStar className="mr-1 h-3 w-3" />
                  Scholarship
                </Badge>
              )}
            </div>

            {/* Program Name */}
            <h3 className="font-semibold truncate text-sm">{program.name}</h3>

            {/* University & Location */}
            {program.universities && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5 truncate">
                  <IconSchool className="h-3 w-3 shrink-0" />
                  <span className="truncate">{program.universities.name_en}</span>
                </span>
                {program.universities.city && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <IconMapPin className="h-3 w-3" />
                    {program.universities.city}
                  </span>
                )}
              </div>
            )}

            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <Badge variant="outline" className="text-xs font-normal">
                <IconLanguage className="mr-1 h-3 w-3" />
                {program.language || "General"}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                <IconClock className="mr-1 h-3 w-3" />
                {formatDuration(program.duration_years)}
              </Badge>
              {program.category && (
                <Badge variant="outline" className="text-xs font-normal">
                  {program.category}
                </Badge>
              )}
            </div>

            {/* Tuition */}
            <div className="mt-2 text-sm font-medium text-primary">
              {formatTuition(program.tuition_fee_per_year, program.currency)}
            </div>
          </div>
        </div>

        {/* Hover Actions Overlay */}
        {(href || showQuickViewButton) && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              {href && (
                <Link href={href} className="flex-1">
                  <button className="w-full h-8 text-xs bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-1 hover:bg-primary/90">
                    <IconEye className="h-3.5 w-3.5" />
                    View Details
                  </button>
                </Link>
              )}
              {showQuickViewButton && onQuickView && (
                <button
                  className="flex-1 h-8 text-xs bg-secondary text-secondary-foreground rounded-md flex items-center justify-center gap-1 hover:bg-secondary/80"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onQuickView(program)
                  }}
                >
                  Quick View
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

// Grid layout wrapper
interface ProgramGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function ProgramGrid({ children, columns = 3, className }: ProgramGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  )
}
