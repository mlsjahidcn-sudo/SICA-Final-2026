"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  IconSearch, 
  IconPlus,
  IconSchool,
  IconBook,
  IconCurrencyDollar,
  IconStar,
  IconEye,
  IconEdit,
  IconArchive,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconMapPin,
  IconTrash,
  IconCopy,
  IconChecks,
  IconFilter,
  IconX,
  IconClock,
  IconLanguage,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconLayoutGrid,
  IconList,
  IconChartPie,
  IconChartBar,
} from "@tabler/icons-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  city: string
  province: string
}

interface Program {
  id: string
  name: string
  name_fr?: string | null
  code: string | null
  degree_level: string
  category: string | null
  sub_category?: string | null
  duration_years: number | null
  tuition_fee_per_year: number | null
  currency: string
  language: string
  scholarship_available: boolean
  scholarship_types?: any
  is_active: boolean
  status: string
  view_count: number
  description?: string
  description_en?: string
  description_cn?: string
  universities: University
  _count?: {
    applications: number
  }
}

interface Stats {
  total: number
  active: number
  withScholarship: number
  totalApplications: number
  featured: number
  archived: number
}

interface ProgramStats {
  overview: {
    total: number
    active: number
    featured: number
    withScholarship: number
    archived: number
  }
  degreeDistribution: Record<string, number>
  disciplineDistribution: Array<{ name: string; count: number }>
  topPrograms: Array<{
    id: string
    name: string
    degree: string
    views: number
    university: string
  }>
  topUniversities: Array<{ id: string; name: string; count: number }>
  tuitionDistribution: Array<{ range: string; count: number }>
  languageDistribution: Array<{ name: string; count: number }>
}

const DEGREE_LEVELS = [
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Chinese Language', label: 'Language' },
  { value: 'Pre-University', label: 'Pre-University' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Certificate', label: 'Certificate' },
]

const CATEGORIES = [
  'Engineering', 'Business', 'Medicine', 'Arts', 'Science',
  'Law', 'Education', 'Agriculture', 'Economics', 'Management',
  'Computer Science', 'Architecture', 'Philosophy', 'Literature',
  'History', 'Languages', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
]

const TEACHING_LANGUAGES = ['Chinese', 'English', 'French', 'German', 'Japanese', 'Korean', 'Russian']

const ITEMS_PER_PAGE = 15

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export default function ProgramsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, withScholarship: 0, totalApplications: 0, featured: 0, archived: 0 })
  const [programStats, setProgramStats] = useState<ProgramStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [degreeFilter, setDegreeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [universityFilter, setUniversityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [universities, setUniversities] = useState<University[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean
    action: string
    count: number
  }>({ open: false, action: '', count: 0 })

  // Quick view state
  const [quickViewProgram, setQuickViewProgram] = useState<Program | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  // Show filters panel
  const [showFilters, setShowFilters] = useState(false)

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchQuery) params.append('search', searchQuery)
      if (degreeFilter !== 'all') params.append('degree_level', degreeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (universityFilter !== 'all') params.append('university_id', universityFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (languageFilter !== 'all') params.append('teaching_language', languageFilter)
      if (scholarshipFilter !== 'all') params.append('scholarship', scholarshipFilter)
      if (featuredFilter !== 'all') params.append('featured', featuredFilter)

      const response = await fetch(`/api/admin/programs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        setTotalCount(data.total || 0)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load programs')
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load programs')
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, degreeFilter, statusFilter, universityFilter, categoryFilter, languageFilter, scholarshipFilter, featuredFilter])

  const fetchUniversities = useCallback(async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/universities?limit=200', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities || [])
      }
    } catch (error) {
      console.error('Error fetching universities:', error)
    }
  }, [])

  const fetchProgramStats = useCallback(async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/programs/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProgramStats(data)
      }
    } catch (error) {
      console.error('Error fetching program stats:', error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPrograms()
      fetchUniversities()
      fetchProgramStats()
    }
  }, [fetchPrograms, fetchUniversities, fetchProgramStats, user])

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(programs.map(p => p.id))
      setIsAllSelected(true)
    } else {
      setSelectedIds([])
      setIsAllSelected(false)
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
      if (selectedIds.length + 1 === programs.length) {
        setIsAllSelected(true)
      }
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
      setIsAllSelected(false)
    }
  }

  // Bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select programs first')
      return
    }
    setBulkActionDialog({ open: true, action, count: selectedIds.length })
  }

  const executeBulkAction = async () => {
    const { action, count } = bulkActionDialog
    setBulkActionLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/programs/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, programIds: selectedIds }),
      })

      if (response.ok) {
        toast.success(`Successfully ${action}d ${count} program(s)`)
        setSelectedIds([])
        setIsAllSelected(false)
        fetchPrograms()
        fetchProgramStats()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to perform action')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setBulkActionLoading(false)
      setBulkActionDialog({ open: false, action: '', count: 0 })
    }
  }

  // Duplicate program
  const handleDuplicate = async (programId: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/programs/${programId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Program duplicated successfully')
        fetchPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to duplicate program')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  // Archive program
  const handleArchive = async (programId: string) => {
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Program archived successfully')
        fetchPrograms()
        fetchProgramStats()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to archive program')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('')
    setDegreeFilter('all')
    setStatusFilter('all')
    setUniversityFilter('all')
    setCategoryFilter('all')
    setLanguageFilter('all')
    setScholarshipFilter('all')
    setFeaturedFilter('all')
    setPage(1)
  }

  const hasActiveFilters = searchQuery || degreeFilter !== 'all' || statusFilter !== 'all' ||
    universityFilter !== 'all' || categoryFilter !== 'all' || languageFilter !== 'all' ||
    scholarshipFilter !== 'all' || featuredFilter !== 'all'

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getDegreeBadgeVariant = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      bachelor: 'default',
      master: 'secondary',
      phd: 'outline',
      language: 'default',
    }
    return variants[level] || 'outline'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Programs" />
          <div className="flex flex-col gap-6 p-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                  <IconBook className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Across all universities</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
                  <IconSchool className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">Accepting applications</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured</CardTitle>
                  <IconStar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
                  <p className="text-xs text-muted-foreground">Featured programs</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">With Scholarship</CardTitle>
                  <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.withScholarship}</div>
                  <p className="text-xs text-muted-foreground">Scholarship available</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Archived</CardTitle>
                  <IconArchive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">{stats.archived}</div>
                  <p className="text-xs text-muted-foreground">Inactive programs</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            {programStats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Degree Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconChartPie className="h-4 w-4" />
                      Programs by Degree
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={Object.entries(programStats.degreeDistribution).map(([name, value]) => ({
                            name: name.charAt(0).toUpperCase() + name.slice(1),
                            value,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {Object.entries(programStats.degreeDistribution).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Universities Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconChartBar className="h-4 w-4" />
                      Top Universities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={programStats.topUniversities.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Language Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconLanguage className="h-4 w-4" />
                      Teaching Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {programStats.languageDistribution.slice(0, 5).map((lang, index) => (
                        <div key={lang.name} className="flex items-center gap-3">
                          <div className="w-20 text-sm text-muted-foreground">{lang.name}</div>
                          <Progress 
                            value={(lang.count / (programStats.overview.active || 1)) * 100} 
                            className="flex-1 h-2" 
                          />
                          <div className="w-10 text-sm text-right">{lang.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters & Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  {/* Main Filters Row */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search programs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Degree" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Degrees</SelectItem>
                          {DEGREE_LEVELS.map((deg) => (
                            <SelectItem key={deg.value} value={deg.value}>{deg.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-primary text-primary-foreground' : ''}
                      >
                        <IconFilter className="h-4 w-4" />
                      </Button>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <IconX className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                      <Button asChild>
                        <Link href="/admin/v2/programs/new">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Program
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Filters Row */}
                  {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t">
                      <Select value={universityFilter} onValueChange={setUniversityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="University" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Universities</SelectItem>
                          {universities.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>{uni.name_en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={languageFilter} onValueChange={setLanguageFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Languages</SelectItem>
                          {TEACHING_LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={scholarshipFilter} onValueChange={setScholarshipFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Scholarship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Available</SelectItem>
                          <SelectItem value="no">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Featured" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Featured</SelectItem>
                          <SelectItem value="no">Not Featured</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => { setPage(1); fetchPrograms(); }}>
                        <IconRefresh className="h-4 w-4 mr-2" />
                        Apply Filters
                      </Button>
                    </div>
                  )}

                  {/* Bulk Actions */}
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                          Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                          Deactivate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
                          Feature
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('unfeature')}>
                          Unfeature
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkAction('archive')}>
                          Archive
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Programs Table */}
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconBook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No programs found</p>
                    <p className="text-sm">Try adjusting your filters or add a new program</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="hidden md:table-cell">University</TableHead>
                        <TableHead>Degree</TableHead>
                        <TableHead className="hidden lg:table-cell">Duration</TableHead>
                        <TableHead className="hidden sm:table-cell">Tuition</TableHead>
                        <TableHead className="hidden xl:table-cell">Views</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow
                          key={program.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => { setQuickViewProgram(program); setQuickViewOpen(true); }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(program.id)}
                              onCheckedChange={(checked) => handleSelectOne(program.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{program.name}</div>
                              {program.name_fr && (
                                <div className="text-xs text-muted-foreground">{program.name_fr}</div>
                              )}
                              <div className="flex gap-1 mt-1">
                                {program.scholarship_available && (
                                  <Badge variant="outline" className="text-xs">
                                    <IconStar className="h-3 w-3 mr-1" />
                                    Scholarship
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <IconMapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{program.universities.name_en}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getDegreeBadgeVariant(program.degree_level)} className="capitalize">
                              {program.degree_level}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {program.duration_years ? `${program.duration_years} years` : '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {program.tuition_fee_per_year ? (
                              <span>
                                {program.currency} {program.tuition_fee_per_year.toLocaleString()}/yr
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <IconEye className="h-3 w-3" />
                              {program.view_count || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                              {program.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <IconDotsVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setQuickViewProgram(program); setQuickViewOpen(true); }}>
                                  <IconEye className="mr-2 h-4 w-4" />
                                  Quick View
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/v2/programs/${program.id}/edit`}>
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(program.id)}>
                                  <IconCopy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleArchive(program.id)}
                                >
                                  <IconArchive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                      {Math.min(page * ITEMS_PER_PAGE, totalCount)} of{' '}
                      {totalCount} programs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1
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
                        {totalPages > 5 && (
                          <>
                            <span className="text-muted-foreground">...</span>
                            <Button
                              variant={page === totalPages ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setPage(totalPages)}
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{quickViewProgram?.name}</SheetTitle>
            <SheetDescription>
              {quickViewProgram?.name_fr && `${quickViewProgram.name_fr} • `}
              {quickViewProgram?.universities.name_en}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{quickViewProgram?.view_count}</div>
                  <div className="text-xs text-muted-foreground">Total Views</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{quickViewProgram?._count?.applications || 0}</div>
                  <div className="text-xs text-muted-foreground">Applications</div>
                </CardContent>
              </Card>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Degree:</span>
                  <Badge className="ml-2 capitalize">{quickViewProgram?.degree_level}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={quickViewProgram?.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {quickViewProgram?.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2">{quickViewProgram?.duration_years ? `${quickViewProgram.duration_years} years` : 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tuition:</span>
                  <span className="ml-2">
                    {quickViewProgram?.tuition_fee_per_year 
                      ? `${quickViewProgram.currency} ${quickViewProgram.tuition_fee_per_year.toLocaleString()}/yr`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* University */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">University</h4>
              <div className="flex items-center gap-2 text-sm">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <span>{quickViewProgram?.universities.name_en}</span>
                <span className="text-muted-foreground">({quickViewProgram?.universities.city})</span>
              </div>
            </div>

            {/* Scholarship */}
            {quickViewProgram?.scholarship_available && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <IconStar className="h-5 w-5" />
                  <span className="font-medium">Scholarship Available</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button asChild className="flex-1">
                <Link href={`/admin/v2/programs/${quickViewProgram?.id}/edit`}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit Program
                </Link>
              </Button>
              <Button variant="outline" onClick={() => quickViewProgram && handleDuplicate(quickViewProgram.id)}>
                <IconCopy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {bulkActionDialog.action} {bulkActionDialog.count} program(s)?
              {bulkActionDialog.action === 'archive' && ' This will hide them from public listings.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button 
              variant={bulkActionDialog.action === 'archive' ? 'destructive' : 'default'} 
              onClick={executeBulkAction}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
