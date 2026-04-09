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
  IconSchool,
  IconMapPin,
  IconCash,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconBook,
  IconEye,
  IconLanguage
} from "@tabler/icons-react"

interface Program {
  id: string
  name: string
  name_fr: string | null
  degree_level: string
  language: string
  category: string | null
  sub_category: string | null
  tuition_fee_per_year: number | null
  currency: string
  description: string | null
  duration_years: number | null
  is_active: boolean
  universities?: {
    id: string
    name_en: string
    city: string
    logo_url: string | null
  }
}

const DEGREE_TYPES = ["Bachelor", "Master", "PhD"]
const DISCIPLINES = ["Engineering", "Science", "Business", "Arts", "Medicine"]

// Program Card Component (admin-style)
function ProgramCard({ program }: { program: Program }) {
  const formatTuition = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (!amount) return "N/A"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()}/yr`
  }

  const formatDuration = (years: number | null) => {
    if (!years) return "N/A"
    return `${years} year${years > 1 ? 's' : ''}`
  }

  return (
    <Link href={`/student-v2/programs/${program.id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* University Logo (without link to avoid nesting) */}
            {program.universities && (
              <Avatar className="rounded-lg shrink-0 h-12 w-12">
                {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
                  <AvatarImage src={program.universities.logo_url} alt={program.universities.name_en} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-muted">
                  <IconSchool className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{program.degree_level}</Badge>
                  </div>
                  <h3 className="font-semibold truncate">{program.name}</h3>
                </div>
              </div>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {program.universities && (
                  <span className="flex items-center gap-1">
                    <IconSchool className="h-3.5 w-3.5" />
                    {program.universities.name_en}
                  </span>
                )}
                {program.universities && (
                  <span className="flex items-center gap-1">
                    <IconMapPin className="h-3.5 w-3.5" />
                    {program.universities.city}
                  </span>
                )}
              </div>
              
              {/* Badges row 2 */}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  <IconLanguage className="mr-1 h-3 w-3" />
                  {program.category || "General"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <IconClock className="mr-1 h-3 w-3" />
                  {formatDuration(program.duration_years)}
                </Badge>
              </div>

              {/* Tuition */}
              <div className="mt-3 text-sm font-medium">
                {formatTuition(program.tuition_fee_per_year, program.currency)}
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

function ProgramsContent() {
  const searchParams = useSearchParams()
  
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [degree, setDegree] = React.useState(searchParams.get("degree") || "all")
  const [discipline, setDiscipline] = React.useState(searchParams.get("discipline") || "all")
  const [scholarship, setScholarship] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const itemsPerPage = 12

  React.useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", itemsPerPage.toString())
        if (search) params.set("search", search)
        if (degree !== "all") params.set("degree_type", degree)
        if (discipline !== "all") params.set("discipline", discipline)
        if (scholarship) params.set("scholarship", "true")

        const response = await fetch(`/api/programs?${params.toString()}`)
        const data = await response.json()
        setPrograms(data.programs || [])
        setTotal(data.total || 0)
      } catch (error) {
        console.error("Error fetching programs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [page, search, degree, discipline, scholarship])

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">Find your ideal study program</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search programs..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-9" 
                />
              </div>
            </div>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Degree" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Degrees</SelectItem>
                {DEGREE_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Discipline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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

      <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} programs found`}</p>

      {/* Programs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconBook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No programs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((prog) => (
            <ProgramCard key={prog.id} program={prog} />
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
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            <IconChevronRight className="h-4 w-4" />
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

export default function ProgramsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProgramsContent />
    </Suspense>
  )
}
