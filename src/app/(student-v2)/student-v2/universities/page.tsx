"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconSearch,
  IconMapPin,
  IconSchool,
  IconStar,
  IconBuilding,
  IconTrophy,
  IconEye
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  city: string
  province: string
  tags: string[]
  logo_url: string | null
  ranking_national: number | null
  scholarship_available: boolean
  tuition_min: number | null
  tuition_max: number | null
  tuition_currency: string | null
  international_student_count: number | null
}

const PROVINCES = ["Beijing", "Shanghai", "Guangdong", "Jiangsu", "Zhejiang", "Sichuan", "Hubei"]
const TYPES = ["985", "211", "Double First-Class", "provincial", "private"]



// University Card Component (student version)
function UniversityCard({ university }: { university: University }) {
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

  return (
    <Link href={`/student-v2/universities/${university.id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <Avatar className="rounded-lg shrink-0 h-12 w-12">
              {university.logo_url && university.logo_url.trim() !== '' ? (
                <AvatarImage src={university.logo_url} alt={university.name_en} />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <IconBuilding className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{university.name_en}</h3>
                    {university.ranking_national && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        <IconTrophy className="mr-1 h-3 w-3" />
                        #{university.ranking_national}
                      </Badge>
                    )}
                  </div>
                  {university.name_cn && (
                    <p className="text-sm text-muted-foreground truncate">{university.name_cn}</p>
                  )}
                </div>
              </div>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconMapPin className="h-3.5 w-3.5" />
                  {university.city}, {university.province}
                </span>
              </div>
              
              {/* Badges row */}
              <div className="flex items-center gap-2 mt-3">
                {getTypeBadges(university.tags)}
                {university.scholarship_available && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
                    <IconStar className="mr-1 h-3 w-3" />
                    Scholarship
                  </Badge>
                )}
              </div>

              {/* Tuition info */}
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconSchool className="h-3.5 w-3.5" />
                  Tuition: {formatTuition(university.tuition_min, university.tuition_max, university.tuition_currency)}/year
                </span>
              </div>
            </div>
          </div>
          
          {/* Hover actions overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button size="sm" variant="default" className="w-full">
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function UniversitiesContent() {
  const searchParams = useSearchParams()
  
  const [universities, setUniversities] = React.useState<University[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [province, setProvince] = React.useState(searchParams.get("province") || "all")
  const [type, setType] = React.useState(searchParams.get("type") || "all")
  const [scholarship, setScholarship] = React.useState(searchParams.get("scholarship") === "true")
  const [page, setPage] = React.useState(1)
  const itemsPerPage = 12

  React.useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", itemsPerPage.toString())
        if (search) params.set("search", search)
        if (province !== "all") params.set("province", province)
        if (type !== "all") params.set("type", type)
        if (scholarship) params.set("scholarship", "true")

        const response = await fetch(`/api/universities?${params.toString()}`)
        const data = await response.json()
        setUniversities(data.universities || [])
        setTotal(data.total || 0)
      } catch (error) {
        console.error("Error fetching universities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUniversities()
  }, [page, search, province, type, scholarship])

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Universities</h1>
          <p className="text-muted-foreground">Explore universities in China</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search universities..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-9" 
                />
              </div>
            </div>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Province" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button 
              variant={scholarship ? "default" : "outline"} 
              onClick={() => setScholarship(!scholarship)}
            >
              Scholarship Only
            </Button>
            <Button onClick={() => setPage(1)}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} universities found`}</p>

      {/* Universities Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : universities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconBuilding className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No universities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => (
            <UniversityCard key={uni.id} university={uni} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            &lt;
          </Button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            &gt;
          </Button>
        </div>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      <div className="h-24 bg-muted rounded animate-pulse" />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UniversitiesContent />
    </Suspense>
  )
}
