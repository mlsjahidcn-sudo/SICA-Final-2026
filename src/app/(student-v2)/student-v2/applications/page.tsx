"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  IconSearch,
  IconPlus,
  IconSchool,
  IconMapPin,
  IconCalendar,
  IconRefresh,
  IconFileText,
  IconEye,
  IconEdit,
  IconSend
} from "@tabler/icons-react"
import { studentApi, type Application } from "@/lib/student-api"

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
]

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    under_review: { label: "Under Review", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    interview_scheduled: { label: "Interview", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    accepted: { label: "Accepted", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    document_request: { label: "Document Request", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  }
  const c = config[status] || config.draft
  return <Badge className={c.className}>{c.label}</Badge>
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  })
}

function ApplicationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  
  const [search, setSearch] = React.useState(searchParams.get("search") || "")
  const [status, setStatus] = React.useState(searchParams.get("status") || "all")
  const [page, setPage] = React.useState(parseInt(searchParams.get("page") || "1"))
  const itemsPerPage = 10

  const fetchApplications = React.useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await studentApi.getApplications({
      page,
      limit: itemsPerPage,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
    })
    
    if (error) {
      // Use mock data for development if unauthorized
      if (error === 'Unauthorized') {
        setApplications([
          {
            id: "1",
            status: "under_review",
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            intake: "September 2025",
            programs: {
              id: "prog1",
              name: "Computer Science and Technology",
              degree_level: "Master",
              tuition_per_year: 35000,
              tuition_currency: "CNY",
              universities: {
                id: "uni1",
                name_en: "Tsinghua University",
                city: "Beijing",
                province: "Beijing",
                logo_url: undefined
              }
            }
          },
          {
            id: "2",
            status: "submitted",
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            intake: "March 2025",
            programs: {
              id: "prog2",
              name: "Data Science",
              degree_level: "Master",
              tuition_per_year: 30000,
              tuition_currency: "CNY",
              universities: {
                id: "uni2",
                name_en: "Peking University",
                city: "Beijing",
                province: "Beijing",
                logo_url: undefined
              }
            }
          },
          {
            id: "3",
            status: "draft",
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            programs: {
              id: "prog3",
              name: "International Business",
              degree_level: "Bachelor",
              tuition_per_year: 25000,
              tuition_currency: "CNY",
              universities: {
                id: "uni3",
                name_en: "Fudan University",
                city: "Shanghai",
                province: "Shanghai",
                logo_url: undefined
              }
            }
          }
        ])
        setTotal(3)
        setTotalPages(1)
      } else {
        console.error("Error fetching applications:", error)
      }
    } else if (data) {
      setApplications(data.applications || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    }
    
    setLoading(false)
  }, [page, search, status])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    params.set("page", "1")
    router.push(`/student-v2/applications?${params.toString()}`)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (newStatus !== "all") params.set("status", newStatus)
    params.set("page", "1")
    router.push(`/student-v2/applications?${params.toString()}`)
  }

  const handleSubmitApplication = async (id: string) => {
    const { error } = await studentApi.submitApplication(id)
    if (error) {
      alert("Failed to submit application: " + error)
    } else {
      fetchApplications()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Manage and track your university applications</p>
        </div>
        <Button asChild>
          <Link href="/student-v2/applications/new">
            <IconPlus className="h-4 w-4 mr-2" />
            New Application
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by program or university..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <IconSearch className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button type="button" variant="ghost" onClick={() => fetchApplications()}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Applications ({total})</span>
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing ${applications.length} of ${total} applications`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <IconFileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-muted-foreground mb-4">
                {search || status !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Start your journey by creating your first application"}
              </p>
              <Button asChild>
                <Link href="/student-v2/applications/new">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Application
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <IconSchool className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{app.programs?.name}</h3>
                      </div>
                      {app.programs?.universities && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <IconMapPin className="h-4 w-4" />
                          <span>{app.programs.universities.name_en}</span>
                          <span>•</span>
                          <span>{app.programs.universities.city}</span>
                          <span>•</span>
                          <span>{app.programs.degree_level}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-4 w-4" />
                          <span>Created: {formatDate(app.created_at)}</span>
                        </div>
                        {app.intake && (
                          <span>Intake: {app.intake}</span>
                        )}
                        {app.updated_at !== app.created_at && (
                          <span>Updated: {formatDate(app.updated_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    {getStatusBadge(app.status)}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student-v2/applications/${app.id}`}>
                          <IconEye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {app.status === "draft" && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/student-v2/applications/${app.id}/edit`}>
                              <IconEdit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSubmitApplication(app.id)}
                          >
                            <IconSend className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1
                  setPage(newPage)
                  const params = new URLSearchParams()
                  if (search) params.set("search", search)
                  if (status !== "all") params.set("status", status)
                  params.set("page", newPage.toString())
                  router.push(`/student-v2/applications?${params.toString()}`)
                }}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => {
                  const newPage = page + 1
                  setPage(newPage)
                  const params = new URLSearchParams()
                  if (search) params.set("search", search)
                  if (status !== "all") params.set("status", status)
                  params.set("page", newPage.toString())
                  router.push(`/student-v2/applications?${params.toString()}`)
                }}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  )
}
