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
  IconMapPin,
  IconUsers,
  IconTrophy,
  IconStar,
  IconSchool,
  IconCash,
  IconLanguage,
  IconMail,
  IconPhone,
  IconGlobe,
  IconHome,
  IconEye
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  logo_url: string | null
  province: string
  city: string
  tags: string[]
  ranking_national: number | null
  scholarship_available: boolean
  student_count: number | null
  international_student_count: number | null
  description_en: string | null
  facilities_en: string | null
  accommodation_info_en: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
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

function UniversityDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [university, setUniversity] = React.useState<University | null>(null)
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch university details
        const uniRes = await fetch(`/api/universities/${id}`)
        if (uniRes.ok) {
          const data = await uniRes.json()
          setUniversity(data.university)
        }
        
        // Fetch programs for this university
        const progRes = await fetch(`/api/programs?university_id=${id}&limit=50`)
        if (progRes.ok) {
          const data = await progRes.json()
          setPrograms(data.programs || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id])

  const getTypeBadges = (uniTags: string[]) => {
    const colors: Record<string, string> = {
      "985": "bg-red-100 text-red-700",
      "211": "bg-blue-100 text-blue-700",
      "double_first_class": "bg-purple-100 text-purple-700",
      "Double First-Class": "bg-purple-100 text-purple-700",
      "provincial": "bg-green-100 text-green-700",
      "private": "bg-yellow-100 text-yellow-700",
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
    if (min && max && min !== max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`
    return `${curr} ${(min || max)?.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <IconBuilding className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">University not found</p>
        <Button onClick={() => router.push("/student-v2/universities")}>
          Back to Universities
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

      {/* University Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <Avatar className="h-24 w-24 rounded-xl">
              {university.logo_url && university.logo_url.trim() !== '' ? (
                <AvatarImage src={university.logo_url} alt={university.name_en} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-muted">
                <IconBuilding className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{university.name_en}</h1>
                {getTypeBadges(university.tags)}
                {university.scholarship_available && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
                    <IconStar className="mr-1 h-3 w-3" />
                    Scholarship Available
                  </Badge>
                )}
              </div>
              
              {university.name_cn && (
                <p className="text-lg text-muted-foreground mb-3">{university.name_cn}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconMapPin className="h-4 w-4" />
                  {university.city}, {university.province}
                </span>
                {university.ranking_national && (
                  <span className="flex items-center gap-1">
                    <IconTrophy className="h-4 w-4 text-yellow-600" />
                    National Rank #{university.ranking_national}
                  </span>
                )}
                {university.student_count && (
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4" />
                    {university.student_count.toLocaleString()} students
                  </span>
                )}
                {university.international_student_count && (
                  <span className="flex items-center gap-1">
                    <IconGlobe className="h-4 w-4" />
                    {university.international_student_count.toLocaleString()} international
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>About {university.name_en}</CardTitle>
            </CardHeader>
            <CardContent>
              {university.description_en ? (
                <p className="text-muted-foreground">{university.description_en}</p>
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>Programs Offered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {programs.length === 0 ? (
                <p className="text-muted-foreground">No programs available for this university yet.</p>
              ) : (
                programs.map((prog) => (
                  <Link 
                    key={prog.id} 
                    href={`/student-v2/programs/${prog.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{prog.degree_level}</Badge>
                              {prog.scholarship_types && prog.scholarship_types.length > 0 && (
                                <Badge className="bg-green-100 text-green-700"><IconStar className="h-3 w-3 mr-1" />Scholarship</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold">{prog.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <IconSchool className="h-3 w-3" />
                                {prog.category || "-"}
                              </span>
                              {prog.tuition_fee_per_year && (
                                <span className="flex items-center gap-1">
                                  <IconCash className="h-3 w-3" />
                                  {prog.currency || "CNY"} {prog.tuition_fee_per_year.toLocaleString()}/year
                                </span>
                              )}
                              {prog.duration_years && (
                                <span className="flex items-center gap-1">
                                  <IconLanguage className="h-3 w-3" />
                                  {prog.duration_years} years
                                </span>
                              )}
                            </div>
                          </div>
                          <IconEye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities Tab */}
        <TabsContent value="facilities">
          <Card>
            <CardHeader>
              <CardTitle>Facilities & Accommodation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  Facilities
                </h3>
                {university.facilities_en ? (
                  <p className="text-muted-foreground">{university.facilities_en}</p>
                ) : (
                  <p className="text-muted-foreground">No facilities information available.</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <IconHome className="h-4 w-4" />
                  Accommodation
                </h3>
                {university.accommodation_info_en ? (
                  <p className="text-muted-foreground">{university.accommodation_info_en}</p>
                ) : (
                  <p className="text-muted-foreground">No accommodation information available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {university.website && (
                <div className="flex items-center gap-3">
                  <IconGlobe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={university.website.startsWith("http") ? university.website : `https://${university.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {university.website}
                  </a>
                </div>
              )}
              
              {university.contact_email && (
                <div className="flex items-center gap-3">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${university.contact_email}`}
                    className="text-primary hover:underline"
                  >
                    {university.contact_email}
                  </a>
                </div>
              )}
              
              {university.contact_phone && (
                <div className="flex items-center gap-3">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span>{university.contact_phone}</span>
                </div>
              )}
              
              {!university.website && !university.contact_email && !university.contact_phone && (
                <p className="text-muted-foreground">No contact information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

export default function UniversityDetailsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UniversityDetailsContent />
    </Suspense>
  )
}
