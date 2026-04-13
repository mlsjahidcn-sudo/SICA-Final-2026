"use client"

import { useEffect, useState, use, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, School, MapPin, User, Check, Search, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

interface Program {
  id: string
  name: string
  degree_level: string
  universities?: {
    id: string
    name_en: string
    name_cn?: string
    city?: string
    province?: string
    logo_url?: string
  }
}

interface Application {
  id: string
  status: string
  priority?: number
  notes?: string
  created_at?: string
  profile_snapshot?: {
    intake?: string
    personal_statement?: string
    study_plan?: string
    requested_university_program_note?: string
  }
  programs?: {
    id: string
    name: string
    degree_level?: string
    universities?: {
      id: string
      name_en: string
      logo_url?: string
      city?: string
      province?: string
    }
  }
  students?: {
    id: string
    user_id?: string
    first_name?: string
    last_name?: string
    users?: {
      id: string
      full_name?: string
      email?: string
      phone?: string
    }
  }
}

function EditApplicationContent({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  
  // Programs data
  const [programs, setPrograms] = useState<Program[]>([])
  const [programSearch, setProgramSearch] = useState("")
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false)
  
  // Form data
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [customProgramNote, setCustomProgramNote] = useState("")
  const [intake, setIntake] = useState("")
  const [personalStatement, setPersonalStatement] = useState("")
  const [studyPlan, setStudyPlan] = useState("")
  const [notes, setNotes] = useState("")
  const [priority, setPriority] = useState(0)

  // Fetch application data
  useEffect(() => {
    async function fetchApplication() {
      try {
        const { getValidToken } = await import('@/lib/auth-token')
        const token = await getValidToken()
        
        const response = await fetch(`/api/admin/applications/${applicationId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        
        if (response.ok) {
          const data = await response.json()
          const appData = data.application || data
          setApplication(appData)
          
          // Initialize form data
          setIntake(appData.profile_snapshot?.intake || "")
          setPersonalStatement(appData.profile_snapshot?.personal_statement || "")
          setStudyPlan(appData.profile_snapshot?.study_plan || "")
          setCustomProgramNote(appData.profile_snapshot?.requested_university_program_note || "")
          setNotes(appData.notes || "")
          setPriority(appData.priority || 0)
          
          if (appData.programs) {
            setSelectedProgram({
              id: appData.programs.id,
              name: appData.programs.name,
              degree_level: appData.programs.degree_level || "",
              universities: appData.programs.universities ? {
                id: appData.programs.universities.id,
                name_en: appData.programs.universities.name_en,
                logo_url: appData.programs.universities.logo_url,
                city: appData.programs.universities.city,
                province: appData.programs.universities.province,
              } : undefined,
            })
          }
        } else {
          toast.error('Failed to load application')
          router.push('/admin/v2/applications')
        }
      } catch (error) {
        console.error('Error fetching application:', error)
        toast.error('Failed to load application')
        router.push('/admin/v2/applications')
      } finally {
        setIsPageLoading(false)
      }
    }
    
    fetchApplication()
  }, [applicationId, router])

  // Fetch programs
  const fetchPrograms = async (search: string) => {
    setIsFetching(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      
      const response = await fetch(`/api/admin/programs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchPrograms("")
  }, [])

  // Filter programs
  const filteredPrograms = programs.filter(p => {
    if (!programSearch) return true
    const search = programSearch.toLowerCase()
    return (
      p.name?.toLowerCase().includes(search) ||
      p.universities?.name_en?.toLowerCase().includes(search)
    )
  })

  const handleSubmit = async () => {
    if (!application) return
    
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      // Build profile_snapshot
      const profileSnapshot = {
        ...(application.profile_snapshot || {}),
        intake: intake || null,
        personal_statement: personalStatement || null,
        study_plan: studyPlan || null,
        requested_university_program_note: customProgramNote || null,
      }

      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: selectedProgram?.id || null,
          priority,
          notes: notes || null,
          profile_snapshot: profileSnapshot,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update application')
      }

      toast.success('Application updated successfully')
      router.push(`/admin/v2/applications/${applicationId}`)
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update application')
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 1: return { label: 'Low', color: 'bg-blue-500 hover:bg-blue-600' }
      case 2: return { label: 'High', color: 'bg-orange-500 hover:bg-orange-600' }
      case 3: return { label: 'Urgent', color: 'bg-red-500 hover:bg-red-600' }
      default: return { label: 'Normal', color: 'bg-primary hover:bg-primary/90' }
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      under_review: { label: "Under Review", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      accepted: { label: "Accepted", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    }
    const c = config[status] || config.draft
    return <Badge className={c.className}>{c.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (isPageLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Application not found
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/v2/applications/${applicationId}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Application
      </Button>

      {/* Header Card - Matching Application Detail Page */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {selectedProgram?.universities?.logo_url ? (
                <Avatar className="h-16 w-16 rounded-xl">
                  <AvatarImage 
                    src={selectedProgram.universities.logo_url}
                    alt={selectedProgram.universities.name_en}
                  />
                  <AvatarFallback className="rounded-xl bg-primary/10">
                    <School className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <School className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">
                    {selectedProgram?.name || 'Edit Application'}
                  </CardTitle>
                  {getStatusBadge(application.status)}
                </div>
                <CardDescription className="text-base">
                  {selectedProgram?.universities?.name_en}
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {selectedProgram?.universities?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedProgram.universities.city}
                      {selectedProgram.universities.province && `, ${selectedProgram.universities.province}`}
                    </div>
                  )}
                  {selectedProgram?.degree_level && (
                    <Badge variant="outline">{selectedProgram.degree_level}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {application.students?.users?.full_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Student: {application.students.users.full_name}</span>
              </div>
            )}
            {application.created_at && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Created: {formatDate(application.created_at)}</span>
              </div>
            )}
            {intake && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Intake: {intake}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Priority: {getPriorityLabel(priority).label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Information */}
      {application.students && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </CardTitle>
            <CardDescription>Applicant details (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {application.students?.users?.full_name?.[0] || application.students?.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{application.students?.users?.full_name || application.students?.first_name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">{application.students?.users?.email || 'No email'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4" />
            Program Selection
          </CardTitle>
          <CardDescription>Choose the target program for this application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Program</Label>
            <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-auto min-h-[40px] py-2"
                >
                  {selectedProgram ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectedProgram.universities?.logo_url ? (
                        <img
                          src={selectedProgram.universities.logo_url}
                          alt={selectedProgram.universities.name_en}
                          className="w-6 h-6 rounded object-cover border border-border/50 shrink-0"
                        />
                      ) : (
                        <School className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate font-medium">{selectedProgram.name}</span>
                      <span className="text-muted-foreground text-sm truncate">
                        ({selectedProgram.universities?.name_en})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Search programs...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by program or university name..."
                    value={programSearch}
                    onValueChange={setProgramSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isFetching ? "Loading..." : "No programs found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredPrograms.map((program) => (
                        <CommandItem
                          key={program.id}
                          value={program.id}
                          onSelect={() => {
                            setSelectedProgram(program)
                            setCustomProgramNote("")
                            setProgramPopoverOpen(false)
                          }}
                          className="py-3"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {program.universities?.logo_url ? (
                              <img
                                src={program.universities.logo_url}
                                alt={program.universities.name_en}
                                className="w-10 h-10 rounded-lg object-cover border border-border/50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <School className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{program.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span className="truncate">{program.universities?.name_en}</span>
                                {program.degree_level && (
                                  <>
                                    <span className="text-border">•</span>
                                    <span>{program.degree_level}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {selectedProgram?.id === program.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Program Card */}
            {selectedProgram && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {selectedProgram.universities?.logo_url ? (
                      <img
                        src={selectedProgram.universities.logo_url}
                        alt={selectedProgram.universities.name_en}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-primary/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <School className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base">{selectedProgram.name}</div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>{selectedProgram.universities?.name_en}</span>
                        {selectedProgram.degree_level && (
                          <>
                            <span className="text-border">•</span>
                            <Badge variant="secondary" className="text-xs">
                              {selectedProgram.degree_level}
                            </Badge>
                          </>
                        )}
                      </div>
                      {selectedProgram.universities?.city && (
                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {selectedProgram.universities.city}
                            {selectedProgram.universities.province && `, ${selectedProgram.universities.province}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProgram(null)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or custom request</span>
              </div>
            </div>

            <Textarea
              placeholder="Custom program request..."
              value={customProgramNote}
              onChange={(e) => {
                setCustomProgramNote(e.target.value)
                if (e.target.value) setSelectedProgram(null)
              }}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Details</CardTitle>
          <CardDescription>Intake period, priority level, and applicant statements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intake and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Intake Period</Label>
              <Input
                placeholder="e.g., Fall 2025"
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3].map((p) => {
                  const { label, color } = getPriorityLabel(p)
                  return (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriority(p)}
                      className={cn(
                        priority === p && color,
                        "transition-all"
                      )}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Personal Statement</Label>
              <span className="text-xs text-muted-foreground">{personalStatement.length} characters</span>
            </div>
            <Textarea
              placeholder="Student's personal statement..."
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
              rows={5}
            />
          </div>

          {/* Study Plan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Study Plan</Label>
              <span className="text-xs text-muted-foreground">{studyPlan.length} characters</span>
            </div>
            <Textarea
              placeholder="Student's study plan..."
              value={studyPlan}
              onChange={(e) => setStudyPlan(e.target.value)}
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Notes</CardTitle>
          <CardDescription>Internal notes (not visible to student)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Internal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Status</CardTitle>
          <CardDescription>Status changes require separate approval workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">Status</span>
            {getStatusBadge(application.status)}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/v2/applications/${applicationId}`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
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
          <SiteHeader title="Edit Application" />
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <EditApplicationContent applicationId={resolvedParams.id} />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}