"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconSearch,
  IconFilter,
  IconMapPin,
  IconSchool,
  IconUsers,
  IconTrophy,
  IconCash,
  IconCalendar,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconList,
  IconRefresh,
  IconBuilding
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  short_name: string | null
  city: string
  province: string
  tags: string[]
  category: string | null
  logo_url: string | null
  cover_image_url: string | null
  ranking_national: number | null
  ranking_international: number | null
  student_count: number | null
  international_student_count: number | null
  teaching_languages: string[] | null
  scholarship_available: boolean
  founded_year: number | null
  tuition_min: number | null
  tuition_max: number | null
  tuition_currency: string | null
  view_count: number | null
  application_deadline: string | null
  intake_months: string[] | null
}

interface UniversitiesResponse {
  universities: University[]
  total: number
}

const UNIVERSITY_TYPES = [
  { value: "985", label: "985 Project" },
  { value: "211", label: "211 Project" },
  { value: "Double First-Class", label: "Double First-Class" },
  { value: "provincial", label: "Provincial Key" },
  { value: "private", label: "Private" },
]

const UNIVERSITY_CATEGORIES = [
  { value: "comprehensive", label: "Comprehensive" },
  { value: "technical", label: "Technical/Engineering" },
  { value: "medical", label: "Medical" },
  { value: "normal", label: "Normal (Teacher Training)" },
  { value: "agricultural", label: "Agricultural" },
  { value: "financial", label: "Financial/Economics" },
  { value: "political", label: "Political/Law" },
  { value: "language", label: "Language" },
  { value: "arts", label: "Arts" },
]

const PROVINCES = [
  "Beijing", "Shanghai", "Guangdong", "Jiangsu", "Zhejiang",
  "Sichuan", "Hubei", "Shaanxi", "Shandong", "Tianjin",
  "Chongqing", "Fujian", "Anhui", "Hebei", "Henan",
  "Hunan", "Liaoning", "Jilin", "Heilongjiang", "Jiangxi"
]

export default function UniversitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [universities, setUniversities] = React.useState<University[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  
  // Filter states
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [province, setProvince] = React.useState(searchParams.get("province") || "all")
  const [type, setType] = React.useState(searchParams.get("type") || "all")
  const [category, setCategory] = React.useState(searchParams.get("category") || "all")
  const [scholarship, setScholarship] = React.useState(searchParams.get("scholarship") === "true")
  const [page, setPage] = React.useState(parseInt(searchParams.get("page") || "1"))
  const itemsPerPage = 12

  const fetchUniversities = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", itemsPerPage.toString())
      
      if (search) params.set("search", search)
      if (province !== "all") params.set("province", province)
      if (type !== "all") params.set("type", type)
      if (category !== "all") params.set("category", category)
      if (scholarship) params.set("scholarship", "true")

      const response = await fetch(`/api/universities?${params.toString()}`)
      const data: UniversitiesResponse = await response.json()
      
      setUniversities(data.universities || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching universities:", error)
    } finally {
      setLoading(false)
    }
  }, [page, search, province, type, category, scholarship])

  React.useEffect(() => {
    fetchUniversities()
  }, [fetchUniversities])

  // Update URL params
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (province !== "all") params.set("province", province)
    if (type !== "all") params.set("type", type)
    if (category !== "all") params.set("category", category)
    if (scholarship) params.set("scholarship", "true")
    if (page > 1) params.set("page", page.toString())
    
    router.push(`/partner-v2/universities?${params.toString()}`, { scroll: false })
  }, [search, province, type, category, scholarship, page, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUniversities()
  }

  const resetFilters = () => {
    setSearch("")
    setProvince("all")
    setType("all")
    setCategory("all")
    setScholarship(false)
    setPage(1)
  }

  const totalPages = Math.ceil(total / itemsPerPage)

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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Universities</h1>
          <p className="text-muted-foreground">
            Browse and explore partner universities in China
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <IconList className="h-4 w-4" /> : <IconLayoutGrid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchUniversities}>
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search</label>
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
            
            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Province</label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {UNIVERSITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {UNIVERSITY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <IconFilter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem
                  checked={scholarship}
                  onCheckedChange={setScholarship}
                >
                  Scholarship Available
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button type="submit">Search</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${total} universities found`}
        </p>
      </div>

      {/* Universities Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : universities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconBuilding className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No universities found</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search filters
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {universities.map((university) => (
            <Link key={university.id} href={`/partner-v2/universities/${university.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {university.logo_url ? (
                        <img
                          src={university.logo_url}
                          alt={university.name_en}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconSchool className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {university.name_en}
                        </CardTitle>
                        {university.name_cn && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {university.name_cn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadges(university.tags)}
                    {university.scholarship_available && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Scholarship
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconMapPin className="h-4 w-4" />
                    {university.city}, {university.province}
                  </div>

                  {university.ranking_national && (
                    <div className="flex items-center gap-1 text-sm">
                      <IconTrophy className="h-4 w-4 text-yellow-600" />
                      <span>National Rank: #{university.ranking_national}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconCash className="h-4 w-4" />
                    <span className="text-xs">
                      {formatTuition(university.tuition_min, university.tuition_max, university.tuition_currency)}/year
                    </span>
                  </div>

                  {university.international_student_count && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconUsers className="h-4 w-4" />
                      <span>{university.international_student_count.toLocaleString()} int&apos;l students</span>
                    </div>
                  )}

                  {university.application_deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconCalendar className="h-4 w-4" />
                      <span>Deadline: {university.application_deadline}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>University</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead>Tuition/Year</TableHead>
                <TableHead>Scholarship</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {universities.map((university) => (
                <TableRow key={university.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {university.logo_url ? (
                        <img
                          src={university.logo_url}
                          alt={university.name_en}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconSchool className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {university.name_en}
                        </p>
                        {university.name_cn && (
                          <p className="text-sm text-muted-foreground">{university.name_cn}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadges(university.tags)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4 text-muted-foreground" />
                      {university.city}, {university.province}
                    </div>
                  </TableCell>
                  <TableCell>
                    {university.ranking_national ? (
                      <span className="font-medium">#{university.ranking_national}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatTuition(university.tuition_min, university.tuition_max, university.tuition_currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {university.scholarship_available ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Available
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/partner-v2/universities/${university.id}`}>
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
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
