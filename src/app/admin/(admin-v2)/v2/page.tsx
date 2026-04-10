"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { ChartAreaInteractive } from "@/components/dashboard-v2-chart"
import { DataTable } from "@/components/dashboard-v2-table"
import { SectionCards } from "@/components/dashboard-v2-cards"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface DashboardStats {
  totalStudents: number
  pendingApplications: number
  partnerUniversities: number
  acceptanceRate: number
}

interface ChartDataPoint {
  date: string
  applications: number
  students: number
}

interface TableRow {
  id: string
  student: string
  email: string
  program: string
  degree: string
  university: string
  status: string
  date: string
}

interface DashboardData {
  stats: DashboardStats
  chartData: ChartDataPoint[]
  topCountries: { country: string; count: number }[]
  applicationsByDegree: Record<string, number>
  tableData: TableRow[]
}

export default function Page() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return
      
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
        const response = await fetch('/api/admin/dashboard-v2', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role === 'admin') {
      fetchDashboardData()
    }
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  // Default data if API fails
  const stats = data?.stats || {
    totalStudents: 0,
    pendingApplications: 0,
    partnerUniversities: 0,
    acceptanceRate: 0,
  }
  
  const chartData = data?.chartData || []
  const tableData = data?.tableData || []

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
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards stats={stats} />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive data={chartData} />
                </div>
                <DataTable data={tableData} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
