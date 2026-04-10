"use client"

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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "sonner"
import { 
  IconUsers,
  IconBuilding,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconMail,
  IconUserCheck
} from "@tabler/icons-react"

interface Partner {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  status: string
  country?: string
  city?: string
  website?: string
  rejection_reason?: string
  approved_at?: string
  created_at: string
  _count?: {
    applications: number
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

const ITEMS_PER_PAGE = 15

export default function PartnersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPartners = useCallback(async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/partners?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPartners(data.partners || [])
        setTotalCount(data.total || 0)
        if (data.stats) setStats(data.stats)
      } else {
        toast.error('Failed to load partners')
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
      toast.error('Failed to load partners')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPartners()
    }
  }, [fetchPartners, user])

  const handleAction = async () => {
    if (!selectedPartner) return
    
    setIsSubmitting(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const response = await fetch(`/api/admin/partners/${selectedPartner.id}/${actionType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success(`Partner ${actionType}d successfully`)
        fetchPartners()
      } else {
        toast.error(`Failed to ${actionType} partner`)
      }
    } catch (error) {
      console.error('Error updating partner:', error)
      toast.error(`Failed to ${actionType} partner`)
    } finally {
      setIsSubmitting(false)
      setActionDialogOpen(false)
      setSelectedPartner(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; bgColor: string }> = {
      pending: { color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
      approved: { color: 'text-green-600', bgColor: 'bg-green-500/10' },
      rejected: { color: 'text-red-600', bgColor: 'bg-red-500/10' },
    }
    const c = config[status] || config.pending
    return (
      <Badge className={`${c.bgColor} ${c.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <IconCircleX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Partners Table */}
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No partners found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div className="font-medium">{partner.company_name}</div>
                            {partner.website && (
                              <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">
                                {partner.website}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>{partner.contact_name}</TableCell>
                          <TableCell>{partner.email}</TableCell>
                          <TableCell>
                            {[partner.city, partner.country].filter(Boolean).join(', ') || '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(partner.status)}</TableCell>
                          <TableCell>{formatDate(partner.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <IconDotsVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${partner.email}`}>
                                    <IconMail className="mr-2 h-4 w-4" />
                                    Send Email
                                  </a>
                                </DropdownMenuItem>
                                {partner.status === 'pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPartner(partner)
                                        setActionType('approve')
                                        setActionDialogOpen(true)
                                      }}
                                    >
                                      <IconCircleCheck className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setSelectedPartner(partner)
                                        setActionType('reject')
                                        setActionDialogOpen(true)
                                      }}
                                    >
                                      <IconCircleX className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {partner.status === 'rejected' && partner.rejection_reason && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem disabled>
                                      Reason: {partner.rejection_reason}
                                    </DropdownMenuItem>
                                  </>
                                )}
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
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                      {totalCount} partners
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
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

          {/* Action Dialog */}
          <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' ? 'Approve Partner' : 'Reject Partner'}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to {actionType} {selectedPartner?.company_name}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant={actionType === 'approve' ? 'default' : 'destructive'} 
                  onClick={handleAction} 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
