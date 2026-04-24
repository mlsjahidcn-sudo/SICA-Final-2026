"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentPreview } from "@/components/ui/rich-text-editor"
import { cn } from "@/lib/utils"
import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconSchool,
  IconMapPin,
  IconClock,
  IconLanguage,
  IconCurrencyDollar,
  IconUsers,
  IconCalendar,
  IconStar,
  IconAward,
  IconFileText,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react"

interface ProgramPreviewData {
  name_en: string
  name_cn: string
  code: string
  description: string
  degree_level: string
  category: string
  sub_category: string
  duration_years: string
  duration_months: string
  start_month: string
  teaching_languages: string[]
  language_requirement: string
  min_gpa: string
  entrance_exam_required: boolean
  entrance_exam_details: string
  tuition_per_year: string
  tuition_currency: string
  application_fee: string
  application_fee_currency: string
  scholarship_available: boolean
  scholarship_types: string[]
  scholarship_details: string
  application_documents: string[]
  application_requirements: string
  capacity: string
  is_featured: boolean
  tags: string[]
  cover_image: string
  university?: {
    id: string
    name_en: string
    name_cn: string | null
    city: string
    province: string
    logo_url?: string | null
  } | null
}

interface ProgramPreviewPanelProps {
  data: ProgramPreviewData
  className?: string
}

const DEGREE_COLORS: Record<string, string> = {
  bachelor: 'bg-blue-500',
  master: 'bg-purple-500',
  phd: 'bg-red-500',
  language: 'bg-green-500',
  pre_university: 'bg-orange-500',
  diploma: 'bg-cyan-500',
  certificate: 'bg-gray-500',
}

const DEGREE_LABELS: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  language: 'Language Program',
  pre_university: 'Pre-University',
  diploma: 'Diploma',
  certificate: 'Certificate',
}

export function ProgramPreviewPanel({ data, className }: ProgramPreviewPanelProps) {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop')

  const formatCurrency = (amount: string, currency: string) => {
    if (!amount) return null
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    
    const symbols: Record<string, string> = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      GBP: '£',
    }
    
    return `${symbols[currency] || currency} ${num.toLocaleString()}`
  }

  const getDuration = () => {
    if (data.duration_years) {
      const years = parseFloat(data.duration_years)
      if (years >= 1) {
        return `${years} Year${years > 1 ? 's' : ''}`
      }
      return `${years * 12} Months`
    }
    if (data.duration_months) {
      return `${data.duration_months} Months`
    }
    return 'Not specified'
  }

  const hasContent = data.name_en || data.university

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <IconEye className="h-4 w-4" />
            Live Preview
          </CardTitle>
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button
              type="button"
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('desktop')}
            >
              <IconDeviceDesktop className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('mobile')}
            >
              <IconDeviceMobile className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={cn(
          "transition-all duration-300 bg-muted/30",
          viewMode === 'mobile' ? "max-w-[375px] mx-auto" : "w-full"
        )}>
          {!hasContent ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <IconRefresh className="h-8 w-8 mb-3 opacity-50" />
              <p className="text-sm">Start filling the form to see preview</p>
            </div>
          ) : (
            <div className="min-h-[600px]">
              {/* Hero Section */}
              <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {data.cover_image ? (
                  <img
                    src={data.cover_image}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-30"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                
                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end gap-3">
                    {/* University Logo */}
                    <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {data.university?.logo_url && data.university.logo_url.trim() !== '' ? (
                        <img
                          src={data.university.logo_url}
                          alt={data.university.name_en}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <IconSchool className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {data.degree_level && (
                          <Badge className={cn('text-white text-[10px] px-1.5 py-0', DEGREE_COLORS[data.degree_level] || 'bg-gray-500')}>
                            {DEGREE_LABELS[data.degree_level] || data.degree_level}
                          </Badge>
                        )}
                        {data.is_featured && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <IconStar className="h-2.5 w-2.5" /> Featured
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-lg font-bold text-foreground line-clamp-1">
                        {data.name_en || 'Program Name'}
                      </h1>
                      {data.name_cn && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{data.name_cn}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="px-4 py-3 border-b bg-background">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {data.university && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IconSchool className="h-3 w-3" />
                      <span className="font-medium text-foreground">{data.university.name_en}</span>
                    </div>
                  )}
                  {data.university?.city && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IconMapPin className="h-3 w-3" />
                      {data.university.city}, {data.university.province}
                    </div>
                  )}
                  {data.category && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <IconFileText className="h-3 w-3" />
                      {data.category}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Quick Facts */}
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="text-sm font-semibold mb-2">Quick Facts</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Duration</p>
                        <p className="text-xs font-medium">{getDuration()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <IconLanguage className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Language</p>
                        <p className="text-xs font-medium">
                          {data.teaching_languages.length > 0 
                            ? data.teaching_languages.slice(0, 2).join(', ')
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Tuition/Year</p>
                        <p className="text-xs font-medium">
                          {formatCurrency(data.tuition_per_year, data.tuition_currency) || 'Contact'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Start</p>
                        <p className="text-xs font-medium">{data.start_month || 'Flexible'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Preview */}
                {data.description && (
                  <div className="rounded-lg border bg-card p-3">
                    <h3 className="text-sm font-semibold mb-2">Program Overview</h3>
                    <div className="text-xs text-muted-foreground line-clamp-4">
                      <ContentPreview content={data.description.substring(0, 300)} />
                    </div>
                  </div>
                )}

                {/* Scholarship */}
                {data.scholarship_available && (
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <IconAward className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-semibold text-green-800">Scholarship Available</h3>
                    </div>
                    {data.scholarship_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {data.scholarship_types.map(type => (
                          <Badge key={type} variant="outline" className="text-[10px] text-green-700 border-green-300">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {data.scholarship_details && (
                      <p className="text-xs text-green-700 line-clamp-2">{data.scholarship_details}</p>
                    )}
                  </div>
                )}

                {/* Requirements Preview */}
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="text-sm font-semibold mb-2">Requirements</h3>
                  <div className="space-y-1.5 text-xs">
                    {data.language_requirement && (
                      <div className="flex items-center gap-2">
                        <IconLanguage className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Language:</span>
                        <span>{data.language_requirement}</span>
                      </div>
                    )}
                    {data.min_gpa && (
                      <div className="flex items-center gap-2">
                        <IconSchool className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Min GPA:</span>
                        <span>{data.min_gpa}</span>
                      </div>
                    )}
                    {data.entrance_exam_required && (
                      <div className="flex items-center gap-2">
                        <IconFileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-orange-600">Entrance Exam Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                {data.application_documents.length > 0 && (
                  <div className="rounded-lg border bg-card p-3">
                    <h3 className="text-sm font-semibold mb-2">Required Documents</h3>
                    <div className="flex flex-wrap gap-1">
                      {data.application_documents.slice(0, 6).map(doc => (
                        <Badge key={doc} variant="secondary" className="text-[10px]">
                          {doc}
                        </Badge>
                      ))}
                      {data.application_documents.length > 6 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{data.application_documents.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Apply Button Preview */}
                <Button className="w-full" disabled>
                  Apply Now (Preview Mode)
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
