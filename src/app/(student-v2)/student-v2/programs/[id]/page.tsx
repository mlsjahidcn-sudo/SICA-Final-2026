"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconArrowLeft,
  IconBuilding,
  IconSchool,
  IconCash,
  IconLanguage,
  IconClock,
  IconStar,
  IconMapPin,
  IconCalendar,
  IconBook,
  IconEye
} from "@tabler/icons-react"

interface Program {
  id: string
  name_en: string
  name_cn: string | null
  degree_type: string
  discipline: string
  teaching_language: string
  duration_months: number | null
  tuition_per_year: number | null
  tuition_currency: string | null
  scholarship_available: boolean
  description_en: string | null
  application_requirements_en: string | null
  application_deadline_fall: string | null
  application_deadline_spring: string | null
  universities?: {
    id: string
    name_en: string
    name_cn: string | null
    city: string
    logo_url: string | null
  }
}

function ProgramDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [program, setProgram] = React.useState<Program | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/programs/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProgram(data.program)
        }
      } catch (error) {
        console.error("Error fetching program:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id])

  const formatTuition = (amount: number | null, currency: string | null) => {
    if (!amount) return "Contact for details"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()}/year`
  }

  const formatDuration = (months: number | null) => {
    if (!months) return "Contact for details"
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) return `${months} months`
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} months`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <IconBook className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Program not found</p>
        <Button onClick={() => router.push("/student-v2/programs")}>
          Back to Programs
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Program Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* University Logo */}
            {program.universities && (
              <Link href={`/student-v2/universities/${program.universities.id}`}>
                <Avatar className="h-24 w-24 rounded-xl cursor-pointer hover:opacity-80 transition-opacity">
                  {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                    <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
                  ) : null}
                  <AvatarFallback className="rounded-xl bg-muted">
                    <IconBuilding className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{program.name_en}</h1>
                <Badge variant="secondary">{program.degree_type}</Badge>
                {program.scholarship_available && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
                    <IconStar className="mr-1 h-3 w-3" />
                    Scholarship Available
                  </Badge>
                )}
              </div>
              
              {program.name_cn && (
                <p className="text-lg text-muted-foreground mb-3">{program.name_cn}</p>
              )}
              
              {program.universities && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                  <Link 
                    href={`/student-v2/universities/${program.universities.id}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <IconBuilding className="h-4 w-4" />
                    {program.universities.name_en}
                  </Link>
                  <span className="flex items-center gap-1">
                    <IconMapPin className="h-4 w-4" />
                    {program.universities.city}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconSchool className="h-4 w-4" />
                  {program.discipline}
                </span>
                <span className="flex items-center gap-1">
                  <IconCash className="h-4 w-4" />
                  {formatTuition(program.tuition_per_year, program.tuition_currency)}
                </span>
                <span className="flex items-center gap-1">
                  <IconClock className="h-4 w-4" />
                  {formatDuration(program.duration_months)}
                </span>
                <span className="flex items-center gap-1">
                  <IconLanguage className="h-4 w-4" />
                  {program.teaching_language}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>About this Program</CardTitle>
            </CardHeader>
            <CardContent>
              {program.description_en ? (
                <p className="text-muted-foreground">{program.description_en}</p>
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Application Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {program.application_requirements_en ? (
                <div className="text-muted-foreground whitespace-pre-line">
                  {program.application_requirements_en}
                </div>
              ) : (
                <p className="text-muted-foreground">No application requirements information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines">
          <Card>
            <CardHeader>
              <CardTitle>Application Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {program.application_deadline_fall && (
                <div className="flex items-center gap-3">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fall Intake</p>
                    <p className="text-muted-foreground">{new Date(program.application_deadline_fall).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {program.application_deadline_spring && (
                <div className="flex items-center gap-3">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Spring Intake</p>
                    <p className="text-muted-foreground">{new Date(program.application_deadline_spring).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {!program.application_deadline_fall && !program.application_deadline_spring && (
                <p className="text-muted-foreground">No deadline information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Button */}
      <div className="flex justify-end">
        <Button size="lg" asChild>
          <Link href={`/student-v2/applications/new?program_id=${program.id}`}>
            Apply Now
          </Link>
        </Button>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      <div className="h-48 bg-muted rounded animate-pulse" />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}

export default function ProgramDetailsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProgramDetailsContent />
    </Suspense>
  )
}
