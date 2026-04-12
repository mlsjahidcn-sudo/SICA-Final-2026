"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconDownload, IconFileText, IconChartBar, IconUsers, IconBuilding } from "@tabler/icons-react"
import Link from "next/link"

interface ReportItem {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  action?: string
}

const reports: ReportItem[] = [
  {
    title: "Applications Report",
    description: "Export all applications with status, student info, and program details",
    icon: <IconFileText className="h-8 w-8 text-primary" />,
    href: "/api/admin/export?type=applications",
    action: "Export CSV",
  },
  {
    title: "Students Report",
    description: "Export all registered students with their profiles",
    icon: <IconUsers className="h-8 w-8 text-primary" />,
    href: "/api/admin/export?type=students",
    action: "Export CSV",
  },
  {
    title: "Universities Report",
    description: "Export partner universities with program counts",
    icon: <IconBuilding className="h-8 w-8 text-primary" />,
    href: "/api/admin/export?type=universities",
    action: "Export CSV",
  },
  {
    title: "Analytics Summary",
    description: "Monthly analytics report with charts and statistics",
    icon: <IconChartBar className="h-8 w-8 text-primary" />,
    href: "/admin/v2/analytics",
    action: "View",
  },
]

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

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
          <SiteHeader title="Reports" />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div>
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-muted-foreground">
                  Export data and view detailed reports
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {report.icon}
                          <div>
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {report.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {report.action === "View" ? (
                        <Link href={report.href}>
                          <Button variant="outline" className="w-full gap-2">
                            <IconDownload className="h-4 w-4" />
                            {report.action}
                          </Button>
                        </Link>
                      ) : (
                        <a href={report.href} download>
                          <Button variant="outline" className="w-full gap-2">
                            <IconDownload className="h-4 w-4" />
                            {report.action}
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Stats */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Navigate to other dashboard sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/admin/v2/students">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <IconUsers className="h-4 w-4" />
                        Students
                      </Button>
                    </Link>
                    <Link href="/admin/v2/applications">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <IconFileText className="h-4 w-4" />
                        Applications
                      </Button>
                    </Link>
                    <Link href="/admin/v2/universities">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <IconBuilding className="h-4 w-4" />
                        Universities
                      </Button>
                    </Link>
                    <Link href="/admin/v2/analytics">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <IconChartBar className="h-4 w-4" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
