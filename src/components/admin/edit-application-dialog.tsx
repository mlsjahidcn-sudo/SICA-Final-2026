"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Loader2 } from "lucide-react"
import { IconEdit, IconChevronLeft, IconChevronRight, IconCheck, IconSearch, IconSchool } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Program {
  id: string
  name: string
  degree_level: string
  universities?: {
    id: string
    name_en: string
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

interface EditApplicationDialogProps {
  application: Application
  onApplicationUpdated?: () => void
  trigger?: React.ReactNode
}

export function EditApplicationDialog({ application, onApplicationUpdated, trigger }: EditApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  
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

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && application) {
      setIntake(application.profile_snapshot?.intake || "")
      setPersonalStatement(application.profile_snapshot?.personal_statement || "")
      setStudyPlan(application.profile_snapshot?.study_plan || "")
      setCustomProgramNote(application.profile_snapshot?.requested_university_program_note || "")
      setNotes(application.notes || "")
      setPriority(application.priority || 0)
      
      if (application.program) {
        setSelectedProgram({
          id: application.program.id,
          name: application.program.name,
          degree_level: application.program.degree_level || "",
          universities: application.program.university ? {
            id: application.program.university.id,
            name_en: application.program.university.name_en,
          } : undefined,
        })
      }
    }
  }, [open, application])

  // Fetch programs
  const fetchPrograms = async (search: string) => {
    setIsFetching(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      
      const response = await fetch(`/api/programs?${params}`)
      
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
    if (open) {
      fetchPrograms("")
    }
  }, [open])

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

      const response = await fetch(`/api/admin/applications/${application.id}`, {
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
      setOpen(false)
      onApplicationUpdated?.()
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update application')
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 1: return { label: 'Low', color: 'bg-blue-100 text-blue-800' }
      case 2: return { label: 'High', color: 'bg-orange-100 text-orange-800' }
      case 3: return { label: 'Urgent', color: 'bg-red-100 text-red-800' }
      default: return { label: 'Normal', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>
            Update application details. Status changes require separate approval workflow.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[450px] w-full pr-4">
          <div className="space-y-4">
            {/* Student Info (read-only) */}
            {application.student && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Student</div>
                  <div className="font-medium">{application.student.full_name}</div>
                  <div className="text-sm text-muted-foreground">{application.student.email}</div>
                </CardContent>
              </Card>
            )}

            {/* Program Selection */}
            <div className="space-y-2">
              <Label>Program</Label>
              <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedProgram ? (
                      <div className="flex items-center gap-2">
                        <IconSchool className="h-4 w-4" />
                        <span>{selectedProgram.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({selectedProgram.universities?.name_en})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Search programs...</span>
                    )}
                    <IconSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
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
                          >
                            <div className="flex items-center gap-2 w-full">
                              <IconSchool className="h-4 w-4" />
                              <div className="flex-1">
                                <div className="font-medium">{program.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {program.universities?.name_en}
                                  {program.degree_level && ` • ${program.degree_level}`}
                                </div>
                              </div>
                              {selectedProgram?.id === program.id && (
                                <IconCheck className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

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

            <Separator />

            {/* Intake and Priority */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intake">Intake Period</Label>
                <Input
                  id="intake"
                  placeholder="e.g., Fall 2025"
                  value={intake}
                  onChange={(e) => setIntake(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriority(p)}
                    >
                      {getPriorityLabel(p).label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal Statement */}
            <div className="space-y-2">
              <Label htmlFor="personalStatement">Personal Statement</Label>
              <Textarea
                id="personalStatement"
                placeholder="Student's personal statement..."
                value={personalStatement}
                onChange={(e) => setPersonalStatement(e.target.value)}
                rows={5}
              />
            </div>

            {/* Study Plan */}
            <div className="space-y-2">
              <Label htmlFor="studyPlan">Study Plan</Label>
              <Textarea
                id="studyPlan"
                placeholder="Student's study plan..."
                value={studyPlan}
                onChange={(e) => setStudyPlan(e.target.value)}
                rows={5}
              />
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes (not visible to student)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Current Status (read-only) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <Badge variant={application.status === 'draft' ? 'outline' : 'default'}>
                {application.status}
              </Badge>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
