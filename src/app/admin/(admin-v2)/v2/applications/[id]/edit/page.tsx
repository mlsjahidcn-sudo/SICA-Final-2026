"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { 
  IconArrowLeft,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconSearch,
  IconSchool,
  IconMapPin,
  IconUser,
  IconLoader2
} from "@tabler/icons-react"
import { PageContainer, PageHeader, FormSection, FormGrid, FormField } from "@/components/admin"
import { useAuth } from "@/contexts/auth-context"

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
  profile_snapshot?: {
    intake?: string
    personal_statement?: string
    study_plan?: string
    requested_university_program_note?: string
  }
  program?: {
    id: string
    name: string
    degree_level?: string
    university?: {
      id: string
      name_en: string
    }
  }
  student?: {
    id: string
    full_name?: string
    email?: string
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
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Edit Application"
        description="Update application details. Status changes require separate approval workflow."
        backHref={`/admin/v2/applications/${applicationId}`}
        backLabel="Back to Application"
        actions={
          <Badge variant={application.status === 'draft' ? 'outline' : 'default'} className="text-sm">
            {application.status}
          </Badge>
        }
      />

      <Separator />

      {/* Form Content */}
      <div className="space-y-6">
        {/* Student Information Section */}
        {application.student && (
          <FormSection
            title="Student Information"
            description="Applicant details (read-only)"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                <IconUser className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{application.student.full_name}</div>
                <div className="text-sm text-muted-foreground">{application.student.email}</div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Program Selection Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IconSchool className="h-4 w-4" />
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
                          <IconSchool className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate font-medium">{selectedProgram.name}</span>
                        <span className="text-muted-foreground text-sm truncate">
                          ({selectedProgram.universities?.name_en})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Search programs...</span>
                    )}
                    <IconSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                              {/* University Logo */}
                              {program.universities?.logo_url ? (
                                <img
                                  src={program.universities.logo_url}
                                  alt={program.universities.name_en}
                                  className="w-10 h-10 rounded-lg object-cover border border-border/50"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <IconSchool className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              
                              {/* Program Info */}
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
                              
                              {/* Check Icon */}
                              {selectedProgram?.id === program.id && (
                                <IconCheck className="h-4 w-4 text-primary shrink-0" />
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
                      {/* University Logo */}
                      {selectedProgram.universities?.logo_url ? (
                        <img
                          src={selectedProgram.universities.logo_url}
                          alt={selectedProgram.universities.name_en}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-primary/20 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <IconSchool className="h-7 w-7 text-primary" />
                        </div>
                      )}
                      
                      {/* Program Details */}
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
                            <IconMapPin className="h-3.5 w-3.5" />
                            <span>
                              {selectedProgram.universities.city}
                              {selectedProgram.universities.province && `, ${selectedProgram.universities.province}`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Clear Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProgram(null)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        Clear
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

        {/* Application Details Section */}
        <FormSection
          title="Application Details"
          description="Intake period, priority level, and applicant statements"
        >
          <div className="space-y-4">
            {/* Intake and Priority */}
            <FormGrid columns={2}>
              <FormField label="Intake Period">
                <Input
                  id="intake"
                  placeholder="e.g., Fall 2025"
                  value={intake}
                  onChange={(e) => setIntake(e.target.value)}
                />
              </FormField>
              <FormField label="Priority">
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
              </FormField>
            </FormGrid>
            
            {/* Personal Statement */}
            <FormField label="Personal Statement">
              <Textarea
                id="personalStatement"
                placeholder="Student's personal statement..."
                value={personalStatement}
                onChange={(e) => setPersonalStatement(e.target.value)}
                rows={5}
              />
            </FormField>

            {/* Study Plan */}
            <FormField label="Study Plan">
              <Textarea
                id="studyPlan"
                placeholder="Student's study plan..."
                value={studyPlan}
                onChange={(e) => setStudyPlan(e.target.value)}
                rows={5}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Admin Notes Section */}
        <FormSection
          title="Admin Notes"
          description="Internal notes (not visible to student)"
        >
          <Textarea
            id="notes"
            placeholder="Internal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormSection>

        {/* Current Status (read-only) */}
        <Card className="bg-muted/30 border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Status</CardTitle>
            <CardDescription>Status changes require separate approval workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge 
                variant={application.status === 'draft' ? 'outline' : 'default'}
                className="text-xs"
              >
                {application.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <Separator />
      <div className="flex items-center justify-end gap-3">
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
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <IconCheck className="mr-2 h-4 w-4" />
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
    <PageContainer title="Edit Application">
      <EditApplicationContent applicationId={resolvedParams.id} />
    </PageContainer>
  )
}
