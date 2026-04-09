"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconMapPin,
  IconSchool,
  IconUsers,
  IconTrophy,
  IconCash,
  IconCalendar,
  IconWorld,
  IconPhone,
  IconMail,
  IconClock,
  IconBook,
  IconBuildingArch,
  IconBed,
  IconStar,
  IconArrowLeft,
  IconExternalLink,
  IconLanguage,
  IconRefresh,
  IconBookmark
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  short_name: string | null
  logo_url: string | null
  cover_image_url: string | null
  province: string
  city: string
  address: string | null
  website: string | null
  tags: string[]
  category: string | null
  ranking_national: number | null
  ranking_international: number | null
  founded_year: number | null
  student_count: number | null
  international_student_count: number | null
  faculty_count: number | null
  teaching_languages: string[] | null
  scholarship_available: boolean
  scholarship_percentage: number | null
  description: string | null
  facilities: string | null
  accommodation_info: string | null
  contact_email: string | null
  contact_phone: string | null
  latitude: number | null
  longitude: number | null
  tuition_min: number | null
  tuition_max: number | null
  tuition_currency: string | null
  application_deadline: string | null
  intake_months: string[] | null
  images: string[] | null
}

interface Program {
  id: string
  name: string
  name_fr: string | null
  degree_level: string
  language: string
  tuition_fee_per_year: number | null
  currency: string
  category: string | null
  sub_category: string | null
  curriculum_en: string | null
  curriculum_cn: string | null
  career_prospects_en: string | null
  duration_years: number | null
  scholarship_types: string[] | null
  is_active: boolean
  universities: {
    id: string
    name_en: string
    name_cn: string | null
    city: string
    logo_url: string | null
  } | null
}

interface UniversityDetailResponse {
  university: University
}

interface ProgramsResponse {
  programs: Program[]
}

export default function UniversityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const universityId = params.id as string

  const [university, setUniversity] = React.useState<University | null>(null)
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)
  const [programsLoading, setProgramsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchUniversity = async () => {
      try {
        const response = await fetch(`/api/universities/${universityId}`)
        const data: UniversityDetailResponse = await response.json()
        setUniversity(data.university)
      } catch (error) {
        console.error("Error fetching university:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchPrograms = async () => {
      try {
        const response = await fetch(`/api/programs?university_id=${universityId}`)
        const data: ProgramsResponse = await response.json()
        setPrograms(data.programs || [])
      } catch (error) {
        console.error("Error fetching programs:", error)
      } finally {
        setProgramsLoading(false)
      }
    }

    if (universityId) {
      fetchUniversity()
      fetchPrograms()
    }
  }, [universityId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <IconBuildingArch className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">University not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const getTypeBadges = (uniTags: string[]) => {
    const colors: Record<string, string> = {
      "985": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "211": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "double_first_class": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "Double First-Class": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "provincial": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "private": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    }
    
    if (!uniTags || uniTags.length === 0) return null
    
    return uniTags.map((tag) => (
      <Badge key={tag} className={colors[tag] || "bg-gray-100 text-gray-700"}>
        {tag === 'double_first_class' ? 'Double First-Class' : tag}
      </Badge>
    ))
  }

  const formatTuition = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return "Contact for details"
    const curr = currency || "CNY"
    if (min && max && min !== max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`
    }
    return `${curr} ${(min || max)?.toLocaleString()}`
  }

  const getDegreeBadge = (degree: string) => {
    const colors: Record<string, string> = {
      "Bachelor": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "Master": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "PhD": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "Doctoral": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    }
    return (
      <Badge className={colors[degree] || "bg-gray-100 text-gray-700"} variant="secondary">
        {degree}
      </Badge>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Universities
        </Button>
      </div>

      {/* Header Card */}
      <Card>
        <div className="relative">
          {university.cover_image_url && university.cover_image_url.trim() !== '' ? (
            <div className="h-48 w-full rounded-t-lg overflow-hidden">
              <img
                src={university.cover_image_url}
                alt={university.name_en}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg" />
          )}
          
          <div className="absolute bottom-0 left-6 right-6 translate-y-1/2 flex items-end gap-4">
            {university.logo_url ? (
              <img
                src={university.logo_url}
                alt={university.name_en}
                className="w-24 h-24 rounded-xl border-4 border-background shadow-lg object-cover bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-4 border-background shadow-lg bg-primary/10 flex items-center justify-center">
                <IconSchool className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                {getTypeBadges(university.tags)}
                {university.scholarship_available && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <IconStar className="h-3 w-3 mr-1" />
                    Scholarship
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardHeader className="pt-16">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{university.name_en}</CardTitle>
              {university.name_cn && (
                <CardDescription className="text-lg">{university.name_cn}</CardDescription>
              )}
              {university.short_name && (
                <p className="text-sm text-muted-foreground mt-1">{university.short_name}</p>
              )}
            </div>
            <div className="flex gap-2">
              {university.website && (
                <Button variant="outline" asChild>
                  <a href={university.website} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink className="h-4 w-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              <Button variant="outline">
                <IconBookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
              <span>{university.city}, {university.province}</span>
            </div>
            {university.ranking_national && (
              <div className="flex items-center gap-2">
                <IconTrophy className="h-4 w-4 text-yellow-600" />
                <span>National #{university.ranking_national}</span>
              </div>
            )}
            {university.founded_year && (
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span>Est. {university.founded_year}</span>
              </div>
            )}
            {university.student_count && (
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-muted-foreground" />
                <span>{university.student_count.toLocaleString()} students</span>
              </div>
            )}
            {university.international_student_count && (
              <div className="flex items-center gap-2">
                <IconWorld className="h-4 w-4 text-muted-foreground" />
                <span>{university.international_student_count.toLocaleString()} int&apos;l</span>
              </div>
            )}
            {university.teaching_languages && university.teaching_languages.length > 0 && (
              <div className="flex items-center gap-2">
                <IconLanguage className="h-4 w-4 text-muted-foreground" />
                <span>{university.teaching_languages.join(", ")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">
            Programs ({programs.length})
          </TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {university.description || "No description available."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IconCash className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tuition</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTuition(university.tuition_min, university.tuition_max, university.tuition_currency)}/year
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IconCalendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Application Deadline</p>
                        <p className="text-sm text-muted-foreground">
                          {university.application_deadline || "Contact for details"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IconClock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Intake Months</p>
                        <p className="text-sm text-muted-foreground">
                          {university.intake_months?.join(", ") || "Fall & Spring"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <IconStar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Scholarship</p>
                        <p className="text-sm text-muted-foreground">
                          {university.scholarship_available 
                            ? university.scholarship_percentage 
                              ? `Up to ${university.scholarship_percentage}%`
                              : "Available"
                            : "Not Available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rankings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {university.ranking_national && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">National Ranking</span>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        #{university.ranking_national}
                      </Badge>
                    </div>
                  )}
                  {university.ranking_international && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">International Ranking</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        #{university.ranking_international}
                      </Badge>
                    </div>
                  )}
                  {!university.ranking_national && !university.ranking_international && (
                    <p className="text-muted-foreground text-sm">No ranking data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Students</span>
                    <span className="font-medium">
                      {university.student_count?.toLocaleString() || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Int&apos;l Students</span>
                    <span className="font-medium">
                      {university.international_student_count?.toLocaleString() || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Faculty</span>
                    <span className="font-medium">
                      {university.faculty_count?.toLocaleString() || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Founded</span>
                    <span className="font-medium">{university.founded_year || "-"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Programs</h3>
            <Button variant="outline" size="sm">
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {programsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : programs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <IconBook className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No programs available</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Degree</TableHead>
                    <TableHead>Discipline</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tuition/Year</TableHead>
                    <TableHead>Scholarship</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{program.name}</p>
                          {program.name_fr && (
                            <p className="text-sm text-muted-foreground">{program.name_fr}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getDegreeBadge(program.degree_level)}</TableCell>
                      <TableCell>{program.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{program.language || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        {program.duration_years ? `${program.duration_years} years` : "-"}
                      </TableCell>
                      <TableCell>
                        {program.tuition_fee_per_year
                          ? `${program.currency || "CNY"} ${program.tuition_fee_per_year.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {program.scholarship_types && program.scholarship_types.length > 0 ? (
                          <Badge className="bg-green-100 text-green-700">
                            Available
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="facilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campus Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {university.facilities || "No facilities information available."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <IconBed className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {university.accommodation_info || "No accommodation information available."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {university.address && (
                <div className="flex items-start gap-3">
                  <IconMapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{university.address}</p>
                  </div>
                </div>
              )}
              {university.contact_email && (
                <div className="flex items-start gap-3">
                  <IconMail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href={`mailto:${university.contact_email}`} className="text-primary hover:underline">
                      {university.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {university.contact_phone && (
                <div className="flex items-start gap-3">
                  <IconPhone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{university.contact_phone}</p>
                  </div>
                </div>
              )}
              {university.website && (
                <div className="flex items-start gap-3">
                  <IconWorld className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {university.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
