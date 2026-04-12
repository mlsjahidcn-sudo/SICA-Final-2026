"use client"

import { useEffect, useState, useCallback, Fragment } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { toast } from "sonner"
import { 
  IconSearch, 
  IconPlus,
  IconBuilding,
  IconMapPin,
  IconStar,
  IconSchool,
  IconEye,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconDotsVertical,
  IconLayoutGrid,
  IconList,
  IconTrophy,
  IconDownload,
  IconSortAscending,
  IconSortDescending,
  IconArrowUp,
  IconArrowDown,
  IconChartBar,
  IconListDetails,
  IconCheckbox,
  IconSquare,
  IconX,
  IconCalendar,
  IconCategory
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn: string | null
  short_name?: string | null
  logo_url: string | null
  province: string
  city: string
  type: string | string[]
  category: string | null
  ranking_national: number | null
  scholarship_available: boolean
  is_active: boolean
  view_count?: number
  created_at: string
  _count?: {
    programs: number
  }
}

interface Stats {
  total: number
  active: number
  withScholarship: number
  totalPrograms: number
}

const ITEMS_PER_PAGE = 12

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  colorClass,
  bgClass 
}: { 
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  bgClass: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute inset-0 opacity-5", bgClass)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-md p-2", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

// University Card Component
function UniversityCard({ 
  university, 
  onToggle, 
  onDelete 
}: { 
  university: University
  onToggle: (uni: University) => void
  onDelete: (uni: University) => void
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <Avatar size="lg" className="rounded-lg shrink-0">
            {university.logo_url ? (
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
              <span className="flex items-center gap-1">
                <IconSchool className="h-3.5 w-3.5" />
                {university._count?.programs || 0} programs
              </span>
            </div>
            
            {/* Badges row */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant={university.is_active ? "default" : "secondary"} className="text-xs">
                {university.is_active ? "Active" : "Inactive"}
              </Badge>
              {university.scholarship_available && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
                  <IconStar className="mr-1 h-3 w-3" />
                  Scholarship
                </Badge>
              )}
            </div>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/v2/universities/${university.id}`}>
                  <IconEye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/v2/universities/${university.id}/edit`}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggle(university)}>
                {university.is_active ? (
                  <>
                    <IconToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <IconToggleRight className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(university)}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Hover actions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href={`/admin/v2/universities/${university.id}`}>
                <IconEye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
            <Button size="sm" asChild className="flex-1">
              <Link href={`/admin/v2/universities/${university.id}/edit`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function UniversitiesSkeleton({ viewMode }: { viewMode: 'table' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
              <TableHead>University</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ranking</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead>Scholarship</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[140px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Helper function for cn
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function UniversitiesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, withScholarship: 0, totalPrograms: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isExporting, setIsExporting] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [isBulkOperating, setIsBulkOperating] = useState(false)
  const [statsData, setStatsData] = useState<{
    provinceDistribution: { name: string; value: number }[]
    typeDistribution: { name: string; value: number }[]
    rankingDistribution: { name: string; value: number }[]
    statusDistribution: { name: string; value: number }[]
    scholarshipDistribution: { name: string; value: number }[]
    programsByProvince: { name: string; value: number }[]
    summary: { total: number; active: number; inactive: number; withScholarship: number; withoutScholarship: number }
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const provinces = ['Beijing', 'Shanghai', 'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 'Hubei', 'Sichuan', 'Tianjin', 'Chongqing']
  const universityTypes = [
    { value: '985', label: '985 Project' },
    { value: '211', label: '211 Project' },
    { value: 'Double First-Class', label: 'Double First-Class' },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('is_active', statusFilter)
      if (provinceFilter !== 'all') params.append('province', provinceFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/admin/universities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities || [])
        setTotalCount(data.total || 0)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load universities')
      }
    } catch (error) {
      console.error('Error fetching universities:', error)
      toast.error('Failed to load universities')
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, statusFilter, provinceFilter, typeFilter, sortBy, sortOrder])

  const fetchStatsData = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/universities/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatsData(data)
      } else {
        toast.error('Failed to load statistics')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setIsLoadingStats(false)
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
      fetchUniversities()
    }
  }, [fetchUniversities, user])

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/universities/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `universities-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Exported universities as ${format.toUpperCase()}`)
      } else {
        toast.error('Failed to export universities')
      }
    } catch (error) {
      console.error('Error exporting universities:', error)
      toast.error('Failed to export universities')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
    setPage(1) // Reset to first page on sort change
  }

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(universities.map(u => u.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return
    setIsBulkOperating(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch('/api/admin/universities/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: bulkAction,
          ids: selectedIds,
        }),
      })

      if (response.ok) {
        toast.success(`Successfully ${bulkAction}d ${selectedIds.length} universities`)
        setSelectedIds([])
        fetchUniversities()
        fetchStatsData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to perform bulk operation')
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error)
      toast.error('Failed to perform bulk operation')
    } finally {
      setIsBulkOperating(false)
      setBulkDialogOpen(false)
      setBulkAction(null)
    }
  }

  const openBulkDialog = (action: 'activate' | 'deactivate' | 'delete') => {
    setBulkAction(action)
    setBulkDialogOpen(true)
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const handleToggleActive = async () => {
    if (!selectedUniversity) return
    setIsToggling(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/universities/${selectedUniversity.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !selectedUniversity.is_active }),
      })

      if (response.ok) {
        toast.success(`University ${selectedUniversity.is_active ? 'deactivated' : 'activated'}`)
        fetchUniversities()
      } else {
        toast.error('Failed to update university')
      }
    } catch (error) {
      console.error('Error toggling university:', error)
      toast.error('Failed to update university')
    } finally {
      setIsToggling(false)
      setToggleDialogOpen(false)
      setSelectedUniversity(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedUniversity) return
    setIsDeleting(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/universities/${selectedUniversity.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('University deleted')
        fetchUniversities()
      } else {
        toast.error('Failed to delete university')
      }
    } catch (error) {
      console.error('Error deleting university:', error)
      toast.error('Failed to delete university')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedUniversity(null)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // max pages to show
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first page
      pages.push(1)
      
      let startPage = Math.max(2, page - 1)
      let endPage = Math.min(totalPages - 1, page + 1)
      
      if (page <= 2) {
        endPage = Math.min(totalPages - 1, showPages - 1)
      }
      if (page >= totalPages - 1) {
        startPage = Math.max(2, totalPages - showPages + 2)
      }
      
      if (startPage > 2) pages.push('ellipsis')
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      if (endPage < totalPages - 1) pages.push('ellipsis')
      
      pages.push(totalPages)
    }
    
    return pages
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
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
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-col gap-6 p-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Universities"
                value={stats.total}
                description="Partner institutions"
                icon={IconBuilding}
                colorClass="bg-blue-500/10 text-blue-500"
                bgClass="bg-blue-500"
              />
              <StatsCard
                title="Active"
                value={stats.active}
                description="Accepting applications"
                icon={IconToggleRight}
                colorClass="bg-green-500/10 text-green-500"
                bgClass="bg-green-500"
              />
              <StatsCard
                title="Scholarships"
                value={stats.withScholarship}
                description="Offering scholarships"
                icon={IconStar}
                colorClass="bg-amber-500/10 text-amber-500"
                bgClass="bg-amber-500"
              />
              <StatsCard
                title="Programs"
                value={stats.totalPrograms}
                description="Total programs offered"
                icon={IconSchool}
                colorClass="bg-purple-500/10 text-purple-500"
                bgClass="bg-purple-500"
              />
            </div>

            {/* Bulk Selection Bar */}
            {selectedIds.length > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="gap-1">
                        <IconCheckbox className="h-3 w-3" />
                        {selectedIds.length} selected
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBulkDialog('activate')}
                      >
                        <IconToggleRight className="mr-1 h-4 w-4" />
                        Activate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBulkDialog('deactivate')}
                      >
                        <IconToggleLeft className="mr-1 h-4 w-4" />
                        Deactivate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openBulkDialog('delete')}
                      >
                        <IconTrash className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <IconX className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for List and Statistics */}
            <Tabs defaultValue="list" className="w-full" onValueChange={(v) => v === 'stats' && fetchStatsData()}>
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="list" className="gap-2">
                  <IconListDetails className="h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2">
                  <IconChartBar className="h-4 w-4" />
                  Statistics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-6 space-y-6">
                {/* Actions Bar */}
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="relative flex-1 w-full">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search universities by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Separator orientation="vertical" className="hidden md:block h-8" />
                      
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Provinces</SelectItem>
                            {provinces.map((prov) => (
                              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {universityTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                          const [newSortBy, newSortOrder] = v.split('-')
                          setSortBy(newSortBy)
                          setSortOrder(newSortOrder as 'asc' | 'desc')
                          setPage(1)
                        }}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="created_at-desc">Newest First</SelectItem>
                            <SelectItem value="created_at-asc">Oldest First</SelectItem>
                            <SelectItem value="ranking_national-asc">Ranking (Low to High)</SelectItem>
                            <SelectItem value="ranking_national-desc">Ranking (High to Low)</SelectItem>
                            <SelectItem value="name_en-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name_en-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="view_count-desc">Most Viewed</SelectItem>
                            <SelectItem value="view_count-asc">Least Viewed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Separator orientation="vertical" className="hidden md:block h-8" />
                      
                      <div className="flex gap-2">
                        {/* Export Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={isExporting}>
                              {isExporting ? (
                                <Spinner className="mr-2 h-4 w-4" />
                              ) : (
                                <IconDownload className="mr-2 h-4 w-4" />
                              )}
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                              <IconDownload className="mr-2 h-4 w-4" />
                              Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('json')}>
                              <IconDownload className="mr-2 h-4 w-4" />
                              Export as JSON
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* View Toggle */}
                        <ToggleGroup 
                          type="single" 
                          value={viewMode} 
                          onValueChange={(v) => v && setViewMode(v as 'table' | 'grid')}
                          className="hidden sm:flex"
                        >
                          <ToggleGroupItem value="grid" aria-label="Grid view">
                            <IconLayoutGrid className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="table" aria-label="Table view">
                            <IconList className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                        
                        <Button asChild>
                          <Link href="/admin/v2/universities/new">
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add University
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

            {/* Universities List */}
            {isLoading ? (
              <UniversitiesSkeleton viewMode={viewMode} />
            ) : universities.length === 0 ? (
              <Empty className="border-2 border-dashed rounded-xl p-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconBuilding className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No universities found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || statusFilter !== 'all' || provinceFilter !== 'all'
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first university"}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/admin/v2/universities/new">
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add University
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {universities.map((uni) => (
                  <UniversityCard
                    key={uni.id}
                    university={uni}
                    onToggle={(u) => {
                      setSelectedUniversity(u)
                      setToggleDialogOpen(true)
                    }}
                    onDelete={(u) => {
                      setSelectedUniversity(u)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Table View */
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedIds.length === universities.length && universities.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="min-w-[250px]">
                          <button 
                            onClick={() => handleSort('name_en')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            University
                            {sortBy === 'name_en' && (
                              sortOrder === 'asc' ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>
                          <button 
                            onClick={() => handleSort('ranking_national')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Ranking
                            {sortBy === 'ranking_national' && (
                              sortOrder === 'asc' ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead>Programs</TableHead>
                        <TableHead>Scholarship</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <button 
                            onClick={() => handleSort('view_count')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Views
                            {sortBy === 'view_count' && (
                              sortOrder === 'asc' ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button 
                            onClick={() => handleSort('created_at')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Created
                            {sortBy === 'created_at' && (
                              sortOrder === 'asc' ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="w-[140px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {universities.map((uni) => {
                        const types = Array.isArray(uni.type) ? uni.type : [uni.type].filter(Boolean)
                        return (
                          <TableRow key={uni.id} className="group" data-selected={selectedIds.includes(uni.id)}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(uni.id)}
                                onCheckedChange={(checked) => handleSelectOne(uni.id, checked as boolean)}
                                aria-label={`Select ${uni.name_en}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar size="sm" className="rounded-lg">
                                  {uni.logo_url ? (
                                    <AvatarImage src={uni.logo_url} alt={uni.name_en} />
                                  ) : null}
                                  <AvatarFallback className="rounded-lg bg-muted">
                                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{uni.name_en}</div>
                                  {uni.name_cn && (
                                    <div className="text-xs text-muted-foreground">{uni.name_cn}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <IconMapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{uni.city}, {uni.province}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {types.includes('985') && (
                                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 dark:text-red-400">
                                    985
                                  </Badge>
                                )}
                                {types.includes('211') && (
                                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400">
                                    211
                                  </Badge>
                                )}
                                {types.includes('Double First-Class') && (
                                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-400">
                                    DFC
                                  </Badge>
                                )}
                                {types.length === 0 && (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {uni.ranking_national ? (
                                <Badge variant="outline" className="text-xs">
                                  <IconTrophy className="mr-1 h-3 w-3" />
                                  #{uni.ranking_national}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium tabular-nums">{uni._count?.programs || 0}</span>
                            </TableCell>
                            <TableCell>
                              {uni.scholarship_available ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">
                                  <IconStar className="mr-1 h-3 w-3" />
                                  Yes
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={uni.is_active ? 'default' : 'secondary'} className="text-xs">
                                {uni.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="tabular-nums text-muted-foreground text-sm">{uni.view_count}</span>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <span className="text-xs text-muted-foreground" title={format(new Date(uni.created_at), 'PPP')}>
                                  {formatDistanceToNow(new Date(uni.created_at), { addSuffix: true })}
                                </span>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <Link href={`/admin/v2/universities/${uni.id}`}>
                                    <IconEye className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <Link href={`/admin/v2/universities/${uni.id}/edit`}>
                                    <IconEdit className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <IconDotsVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUniversity(uni)
                                        setToggleDialogOpen(true)
                                      }}
                                    >
                                      {uni.is_active ? (
                                        <>
                                          <IconToggleLeft className="mr-2 h-4 w-4" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <IconToggleRight className="mr-2 h-4 w-4" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setSelectedUniversity(uni)
                                        setDeleteDialogOpen(true)
                                      }}
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> universities
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {getPaginationNumbers().map((p, i) => (
                      <Fragment key={i}>
                        {p === 'ellipsis' ? (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem>
                            <PaginationLink 
                              isActive={p === page}
                              onClick={() => setPage(p)}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                      </Fragment>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="mt-6">
                {isLoadingStats ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[250px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : statsData ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Universities</CardDescription>
                          <CardTitle className="text-3xl">{statsData.summary.total}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Active</CardDescription>
                          <CardTitle className="text-3xl text-green-500">{statsData.summary.active}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Inactive</CardDescription>
                          <CardTitle className="text-3xl text-red-500">{statsData.summary.inactive}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>With Scholarship</CardDescription>
                          <CardTitle className="text-3xl text-amber-500">{statsData.summary.withScholarship}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>No Scholarship</CardDescription>
                          <CardTitle className="text-3xl text-muted-foreground">{statsData.summary.withoutScholarship}</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Province Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Universities by Province</CardTitle>
                          <CardDescription>Distribution across provinces</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsData.provinceDistribution}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <RechartsTooltip />
                              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* University Type Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>University Types</CardTitle>
                          <CardDescription>985/211/Double First-Class distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statsData.typeDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {statsData.typeDistribution.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Ranking Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Ranking Distribution</CardTitle>
                          <CardDescription>National ranking breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsData.rankingDistribution} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis type="number" className="text-xs" />
                              <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                              <RechartsTooltip />
                              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Programs by Province */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Programs by Province</CardTitle>
                          <CardDescription>Number of programs offered in each province</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statsData.programsByProvince}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <RechartsTooltip />
                              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Status Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Status Distribution</CardTitle>
                          <CardDescription>Active vs Inactive universities</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statsData.statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Scholarship Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Scholarship Availability</CardTitle>
                          <CardDescription>Universities with scholarship programs</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statsData.scholarshipDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#f59e0b" />
                                <Cell fill="#94a3b8" />
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Empty className="border-2 border-dashed rounded-xl p-12">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <IconChartBar className="h-5 w-5" />
                      </EmptyMedia>
                      <EmptyTitle>No statistics available</EmptyTitle>
                      <EmptyDescription>
                        Unable to load university statistics.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Toggle Dialog */}
          <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedUniversity?.is_active ? 'Deactivate University' : 'Activate University'}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to {selectedUniversity?.is_active ? 'deactivate' : 'activate'}{' '}
                  <strong>{selectedUniversity?.name_en}</strong>?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setToggleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleToggleActive} disabled={isToggling}>
                  {isToggling && <Spinner className="mr-2 h-4 w-4" />}
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete University</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{selectedUniversity?.name_en}</strong>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Operations Dialog */}
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {bulkAction === 'delete' ? 'Delete Universities' : 
                   bulkAction === 'activate' ? 'Activate Universities' : 
                   'Deactivate Universities'}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to {bulkAction} <strong>{selectedIds.length}</strong> universit{selectedIds.length === 1 ? 'y' : 'ies'}?
                  {bulkAction === 'delete' && ' This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant={bulkAction === 'delete' ? 'destructive' : 'default'} 
                  onClick={handleBulkAction} 
                  disabled={isBulkOperating}
                >
                  {isBulkOperating && <Spinner className="mr-2 h-4 w-4" />}
                  {bulkAction === 'delete' ? 'Delete All' : 
                   bulkAction === 'activate' ? 'Activate All' : 
                   'Deactivate All'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
