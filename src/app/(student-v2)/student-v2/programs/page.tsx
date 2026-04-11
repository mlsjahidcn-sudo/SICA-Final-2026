"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
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
  IconLanguage,
  IconFilter,
  IconX,
} from "@tabler/icons-react"
import { ProgramQuickView } from "@/components/programs/program-quick-view"
import { cn } from "@/lib/utils"

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
  description_en: string | null
  duration_years: number | null
  scholarship_coverage: string | null
  scholarship_types: string[] | null
  is_active: boolean
  scholarship_available?: boolean
  start_month?: string | null
  view_count?: number
  application_count?: number
  universities?: {
    id: string
    name_en: string
    name_cn?: string | null
    city: string
    province?: string
    logo_url: string | null
  }
}

interface University {
  id: string
  name_en: string
  name_cn?: string | null
}

const DEGREE_TYPES = [
  { value: "all", label: "All Degrees" },
  { value: "Bachelor", label: "Bachelor" },
  { value: "Master", label: "Master" },
  { value: "PhD", label: "PhD" },
  { value: "Chinese Language", label: "Chinese Language" },
]

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "Engineering", label: "Engineering" },
  { value: "Science", label: "Science" },
  { value: "Business", label: "Business" },
  { value: "Arts", label: "Arts" },
  { value: "Medicine", label: "Medicine" },
  { value: "Law", label: "Law" },
  { value: "Education", label: "Education" },
]

// Program Card Component
function ProgramCard({ 
  program, 
  onQuickView 
}: { 
  program: Program
  onQuickView: (program: Program) => void
}) {
  const formatTuition = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (!amount) return "N/A"
    const curr = currency || "CNY"
    return `${curr} ${amount.toLocaleString()}/yr`
  }

  const formatDuration = (years: number | null) => {
    if (!years) return "N/A"
    return `${years} year${years > 1 ? 's' : ''}`
  }

  const hasScholarship = !!program.scholarship_coverage || (program.scholarship_types && program.scholarship_types.length > 0)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* University Logo */}
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
                  {hasScholarship && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800 dark:text-yellow-400">
                      <IconStar className="mr-1 h-3 w-3" />
                      Scholarship
                    </Badge>
                  )}
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
                {program.language || "General"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <IconClock className="mr-1 h-3 w-3" />
                {formatDuration(program.duration_years)}
              </Badge>
              {program.category && (
                <Badge variant="outline" className="text-xs">
                  {program.category}
                </Badge>
              )}
            </div>

            {/* Tuition */}
            <div className="mt-3 text-sm font-medium text-primary">
              {formatTuition(program.tuition_fee_per_year, program.currency)}
            </div>
          </div>
        </div>
        
        {/* Hover actions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2">
            <Link href={`/student-v2/programs/${program.id}`} className="flex-1">
              <Button size="sm" variant="default" className="w-full">
                <IconEye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onQuickView(program)}
            >
              Quick View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgramsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [universities, setUniversities] = React.useState<University[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [degree, setDegree] = React.useState(searchParams.get("degree") || "all")
  const [category, setCategory] = React.useState(searchParams.get("category") || "all")
  const [university, setUniversity] = React.useState(searchParams.get("university") || "all")
  const [scholarship, setScholarship] = React.useState(searchParams.get("scholarship") === "true")
  const [page, setPage] = React.useState(1)
  const itemsPerPage = 12

  // Quick view state
  const [quickViewProgram, setQuickViewProgram] = React.useState<Program | null>(null)
  const [quickViewOpen, setQuickViewOpen] = React.useState(false)

  // Fetch universities for filter
  React.useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities?limit=100')
        if (response.ok) {
          const data = await response.json()
          setUniversities(data.universities || [])
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
      }
    }
    fetchUniversities()
  }, [])

  React.useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", itemsPerPage.toString())
        if (search) params.set("search", search)
        if (degree !== "all") params.set("degree_level", degree)
        if (category !== "all") params.set("category", category)
        if (university !== "all") params.set("university_id", university)
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
  }, [page, search, degree, category, university, scholarship])

  // Update URL params
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (degree !== "all") params.set("degree", degree)
    if (category !== "all") params.set("category", category)
    if (university !== "all") params.set("university", university)
    if (scholarship) params.set("scholarship", "true")
    
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    window.history.replaceState({}, "", newUrl)
  }, [search, degree, category, university, scholarship])

  const totalPages = Math.ceil(total / itemsPerPage)
  const hasActiveFilters = search || degree !== "all" || category !== "all" || university !== "all" || scholarship

  const clearFilters = () => {
    setSearch("")
    setDegree("all")
    setCategory("all")
    setUniversity("all")
    setScholarship(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">
          Browse {total} programs across universities in China
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={degree} onValueChange={(v) => { setDegree(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Degree" />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={university} onValueChange={(v) => { setUniversity(v); setPage(1) }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={scholarship ? "default" : "outline"}
                size="icon"
                onClick={() => { setScholarship(!scholarship); setPage(1) }}
                title="Filter by scholarship"
              >
                <IconStar className="h-4 w-4" />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <IconX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {search}
                  <button onClick={() => setSearch("")}><IconX className="h-3 w-3" /></button>
                </Badge>
              )}
              {degree !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {DEGREE_TYPES.find(d => d.value === degree)?.label}
                  <button onClick={() => setDegree("all")}><IconX className="h-3 w-3" /></button>
                </Badge>
              )}
              {category !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {category}
                  <button onClick={() => setCategory("all")}><IconX className="h-3 w-3" /></button>
                </Badge>
              )}
              {university !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {universities.find(u => u.id === university)?.name_en}
                  <button onClick={() => setUniversity("all")}><IconX className="h-3 w-3" /></button>
                </Badge>
              )}
              {scholarship && (
                <Badge variant="secondary" className="gap-1">
                  Scholarship Only
                  <button onClick={() => setScholarship(false)}><IconX className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <IconSchool className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border">
          <IconBook className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No programs found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard 
                key={program.id} 
                program={program} 
                onQuickView={setQuickViewProgram}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick View */}
      <ProgramQuickView
        program={quickViewProgram}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        viewUrl={quickViewProgram ? `/student-v2/programs/${quickViewProgram.id}` : undefined}
      />
    </div>
  )
}

export default function StudentProgramsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <IconSchool className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    }>
      <ProgramsContent />
    </Suspense>
  )
}
