"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
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
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  IconCopy,
  IconFilter,
  IconX,
  IconClock,
  IconLanguage,
  IconRefresh,
  IconLayoutGrid,
  IconList,
  IconTrash,
} from "@tabler/icons-react"
import { ProgramQuickView } from "@/components/programs/program-quick-view"

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
  scholarship_coverage?: string | null
  start_month?: string | null
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

const DEGREE_LEVELS = [
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Chinese Language', label: 'Language' },
  { value: 'Diploma', label: 'Diploma' },
]

const ITEMS_PER_PAGE = 15

export default function ProgramsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, withScholarship: 0, totalApplications: 0, featured: 0, archived: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [degreeFilter, setDegreeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [universityFilter, setUniversityFilter] = useState<string>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [universities, setUniversities] = useState<University[]>([])
  
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

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchQuery) params.append('search', searchQuery)
      if (degreeFilter !== 'all') params.append('degree_level', degreeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (universityFilter !== 'all') params.append('university_id', universityFilter)

      const response = await fetch(`/api/admin/programs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
  }, [page, searchQuery, degreeFilter, statusFilter, universityFilter])

  const fetchUniversities = useCallback(async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
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
    }
  }, [fetchPrograms, fetchUniversities, user])

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
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
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
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
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
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Program archived successfully')
        fetchPrograms()
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
    setPage(1)
  }

  const hasActiveFilters = searchQuery || degreeFilter !== 'all' || statusFilter !== 'all' || universityFilter !== 'all'

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

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
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
                <p className="text-muted-foreground text-sm">
                  Manage university programs and courses
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/v2/programs/bulk">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Bulk Add
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/v2/programs/new">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Program
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <IconBook className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <IconSchool className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Scholarships</p>
                      <p className="text-xl font-bold">{stats.withScholarship}</p>
                    </div>
                    <IconStar className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Featured</p>
                      <p className="text-xl font-bold text-amber-600">{stats.featured}</p>
                    </div>
                    <IconStar className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Archived</p>
                      <p className="text-xl font-bold text-muted-foreground">{stats.archived}</p>
                    </div>
                    <IconArchive className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Card */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-4">
                  {/* Main Filters Row */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search programs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
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
                      <Select value={universityFilter} onValueChange={setUniversityFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="University" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Universities</SelectItem>
                          {universities.slice(0, 50).map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>{uni.name_en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <IconX className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 p-2.5 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                      </div>
                      <Separator orientation="vertical" className="h-5" />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                          Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                          Deactivate
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
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <IconBook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No programs found</p>
                    <p className="text-sm">Try adjusting your filters or add a new program</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="hidden md:table-cell">University</TableHead>
                        <TableHead>Degree</TableHead>
                        <TableHead className="hidden lg:table-cell">Duration</TableHead>
                        <TableHead className="hidden sm:table-cell">Tuition</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
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
                              <div className="flex gap-1 mt-1">
                                {program.scholarship_available && (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/10">
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
                              <span className="truncate max-w-[150px]">{program.universities.name_en}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {program.degree_level}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {program.duration_years ? `${program.duration_years} yr` : '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {program.tuition_fee_per_year ? (
                              <span>{program.currency} {program.tuition_fee_per_year.toLocaleString()}</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={program.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {program.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      {totalCount} programs • Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
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
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === totalPages}
                      >
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
      <ProgramQuickView
        program={quickViewProgram}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        editUrl={quickViewProgram ? `/admin/v2/programs/${quickViewProgram.id}/edit` : undefined}
        onDuplicate={handleDuplicate}
        showAdminActions
      />

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
