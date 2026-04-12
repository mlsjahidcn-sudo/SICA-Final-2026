"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  IconArrowLeft,
  IconSchool,
  IconMapPin,
  IconCash,
  IconClock,
  IconStar,
  IconLanguage,
  IconBook,
  IconCalendar,
  IconExternalLink,
  IconFileText,
  IconChecklist,
  IconTrophy,
  IconBriefcase,
  IconGlobe,
} from "@tabler/icons-react"
import { toast } from "sonner"
import Link from "next/link"

interface ProgramDetail {
  id: string
  name: string
  name_fr: string | null
  code: string | null
  university_id: string
  degree_level: string
  language: string
  category: string | null
  sub_category: string | null
  description: string | null
  description_en: string | null
  description_cn: string | null
  curriculum_en: string | null
  curriculum_cn: string | null
  career_prospects_en: string | null
  career_prospects_cn: string | null
  duration_years: number | null
  start_month: number | null
  application_start_date: string | null
  application_end_date: string | null
  min_gpa: number | null
  language_requirement: string | null
  entrance_exam_required: boolean | null
  entrance_exam_details: string | null
  prerequisites: string | null
  tuition_fee_per_year: number | null
  currency: string | null
  scholarship_coverage: string | null
  scholarship_types: string[] | null
  application_requirements: string | null
  cover_image: string | null
  is_active: boolean
  rating: number | null
  review_count: number | null
  accreditation: string | null
  outcomes: string | null
  tags: string[] | null
  capacity: number | null
  current_applications: number | null
  application_fee_currency: string | null
  accommodation_fee_currency: string | null
  universities?: {
    id: string
    name_en: string
    name_cn: string | null
    city: string
    province: string | null
    logo_url: string | null
    website_url: string | null
    type: string | null
    ranking_national: number | null
  }
}

function ProgramDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [program, setProgram] = React.useState<ProgramDetail | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/programs/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch program")
        const data = await response.json()
        setProgram(data)
      } catch (error) {
        console.error("Error fetching program:", error)
        toast.error("Failed to load program details")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProgram()
    }
  }, [params.id])

  const formatTuition = (amount: number | null, currency: string | null) => {
    if (!amount) return "Contact for details"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()} / year`
  }

  const formatDuration = (years: number | null) => {
    if (!years) return "N/A"
    return `${years} year${years > 1 ? 's' : ''}`
  }

  const formatMonth = (month: number | null) => {
    if (!month) return null
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return months[month] || null
  }

  const hasScholarship = !!program?.scholarship_coverage || (program?.scholarship_types && program.scholarship_types.length > 0)

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconBook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Program not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/student-v2/programs")}>
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/student-v2/programs")}>
          <IconArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{program.name}</h1>
          {program.universities && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <IconSchool className="h-4 w-4" />
              <span>{program.universities.name_en}</span>
              <span>•</span>
              <IconMapPin className="h-4 w-4" />
              <span>{program.universities.city}{program.universities.province ? `, ${program.universities.province}` : ""}</span>
            </div>
          )}
        </div>
        {program.code && (
          <Badge variant="outline">{program.code}</Badge>
        )}
      </div>

      {/* Top Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <IconBook className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Degree</p>
            <p className="font-semibold">{program.degree_level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <IconClock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold">{formatDuration(program.duration_years)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <IconLanguage className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Language</p>
            <p className="font-semibold">{program.language || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <IconCash className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Tuition</p>
            <p className="font-semibold text-sm">{formatTuition(program.tuition_fee_per_year, program.currency)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(program.description_en || program.description) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFileText className="h-5 w-5" />
                  Program Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{program.description_en || program.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Curriculum */}
          {(program.curriculum_en || program.curriculum_cn) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="h-5 w-5" />
                  Curriculum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {program.curriculum_en && <p className="whitespace-pre-wrap">{program.curriculum_en}</p>}
                  {program.curriculum_cn && <p className="mt-4 whitespace-pre-wrap">{program.curriculum_cn}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prerequisites / Requirements */}
          {(program.application_requirements || program.prerequisites) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChecklist className="h-5 w-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{program.application_requirements || program.prerequisites}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Career Outcomes */}
          {(program.career_prospects_en || program.career_prospects_cn || program.outcomes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBriefcase className="h-5 w-5" />
                  Career Prospects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {program.career_prospects_en && <p className="whitespace-pre-wrap">{program.career_prospects_en}</p>}
                  {program.career_prospects_cn && <p className="mt-4 whitespace-pre-wrap">{program.career_prospects_cn}</p>}
                  {!program.career_prospects_en && !program.career_prospects_cn && program.outcomes && (
                    <p className="whitespace-pre-wrap">{program.outcomes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* University Card */}
          {program.universities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">University</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="rounded-lg h-12 w-12">
                    {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                      <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-muted">
                      <IconSchool className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{program.universities.name_en}</p>
                    <p className="text-sm text-muted-foreground">
                      {program.universities.city}{program.universities.province ? `, ${program.universities.province}` : ""}
                    </p>
                    {program.universities.ranking_national && (
                      <p className="text-xs text-muted-foreground">
                        National Rank: #{program.universities.ranking_national}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href={`/student-v2/universities/${program.universities.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View University
                    </Button>
                  </Link>
                  {program.universities.website_url && (
                    <a href={program.universities.website_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <IconExternalLink className="mr-2 h-4 w-4" />
                        Visit Website
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scholarship */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconTrophy className="h-5 w-5" />
                Scholarship
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasScholarship ? (
                <div className="space-y-2">
                  {program.scholarship_coverage && (
                    <p className="text-sm">{program.scholarship_coverage}</p>
                  )}
                  {program.scholarship_types && program.scholarship_types.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Available Types</p>
                      <div className="flex flex-wrap gap-1">
                        {program.scholarship_types.map((type, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scholarship information available</p>
              )}
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconCalendar className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {program.application_end_date ? (
                <>
                  {program.application_start_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Opens</span>
                      <span className="text-sm font-medium">{new Date(program.application_start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deadline</span>
                    <span className="text-sm font-medium">{new Date(program.application_end_date).toLocaleDateString()}</span>
                  </div>
                  {program.start_month && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Start</span>
                      <span className="text-sm font-medium">{formatMonth(program.start_month)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Contact university for deadline details</p>
              )}
              {program.universities?.website_url && (
                <a
                  href={program.universities.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <IconGlobe className="h-4 w-4" />
                  Visit university website
                </a>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {program.category && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary">{program.category}</Badge>
                </div>
              )}
              {program.sub_category && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sub-category</span>
                  <span className="text-sm font-medium">{program.sub_category}</span>
                </div>
              )}
              {program.min_gpa && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Min GPA</span>
                  <span className="text-sm font-medium">{program.min_gpa}</span>
                </div>
              )}
              {program.language_requirement && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Language Req.</span>
                  <span className="text-sm font-medium">{program.language_requirement}</span>
                </div>
              )}
              {program.entrance_exam_required && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entrance Exam</span>
                  <Badge variant="secondary">Required</Badge>
                </div>
              )}
              {program.accreditation && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Accreditation</span>
                  <span className="text-sm font-medium">{program.accreditation}</span>
                </div>
              )}
              {program.rating != null && program.rating > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <span className="text-sm font-medium">{program.rating.toFixed(1)} ({program.review_count} reviews)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {program.tags && program.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {program.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          <Link href={`/student-v2/applications/new?program_id=${program.id}`}>
            <Button className="w-full" size="lg">
              Apply Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ProgramDetailPage() {
  return <ProgramDetailContent />
}
