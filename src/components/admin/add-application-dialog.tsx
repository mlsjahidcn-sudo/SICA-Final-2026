"use client"

import { useState, useEffect, useCallback } from "react"
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
import { IconPlus, IconChevronLeft, IconChevronRight, IconCheck, IconSearch, IconUser, IconSchool, IconFileText } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  user_id: string
  nationality?: string
  users: {
    id: string
    full_name: string
    email: string
  }
}

interface Program {
  id: string
  name: string
  degree_level: string
  language_of_instruction?: string
  universities: {
    id: string
    name_en: string
    city?: string
  }
}

interface AddApplicationDialogProps {
  onApplicationAdded?: () => void
  trigger?: React.ReactNode
}

const STEPS = [
  { id: 1, title: "Select Student", icon: IconUser },
  { id: 2, title: "Select Program", icon: IconSchool },
  { id: 3, title: "Details", icon: IconFileText },
  { id: 4, title: "Review", icon: IconCheck },
]

export function AddApplicationDialog({ onApplicationAdded, trigger }: AddApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  
  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [programSearch, setProgramSearch] = useState("")
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false)
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false)
  
  // Form data
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [customProgramNote, setCustomProgramNote] = useState("")
  const [intake, setIntake] = useState("")
  const [personalStatement, setPersonalStatement] = useState("")
  const [studyPlan, setStudyPlan] = useState("")
  const [notes, setNotes] = useState("")
  const [priority, setPriority] = useState(0)

  // Fetch students on mount
  const fetchStudents = useCallback(async (search: string) => {
    setIsFetching(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      
      const response = await fetch(`/api/admin/students?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform data to expected format
        const transformed = (data.students || []).map((s: { id: string; user_id?: string; full_name?: string; email?: string; nationality?: string }) => ({
          id: s.id,
          user_id: s.user_id || s.id,
          nationality: s.nationality,
          users: {
            id: s.user_id || s.id,
            full_name: s.full_name || 'Unknown',
            email: s.email || '',
          }
        }))
        setStudents(transformed)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsFetching(false)
    }
  }, [])

  // Fetch programs on mount
  const fetchPrograms = useCallback(async (search: string) => {
    setIsFetching(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      
      const response = await fetch(`/api/programs?${params}`, {
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
  }, [])

  useEffect(() => {
    if (open) {
      fetchStudents("")
      fetchPrograms("")
    }
  }, [open, fetchStudents, fetchPrograms])

  // Filter students based on search
  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true
    const search = studentSearch.toLowerCase()
    return (
      s.users.full_name?.toLowerCase().includes(search) ||
      s.users.email?.toLowerCase().includes(search) ||
      s.nationality?.toLowerCase().includes(search)
    )
  })

  // Filter programs based on search
  const filteredPrograms = programs.filter(p => {
    if (!programSearch) return true
    const search = programSearch.toLowerCase()
    return (
      p.name?.toLowerCase().includes(search) ||
      p.universities?.name_en?.toLowerCase().includes(search)
    )
  })

  const handleNext = () => {
    if (currentStep === 1 && !selectedStudent) {
      toast.error("Please select a student")
      return
    }
    if (currentStep === 2 && !selectedProgram && !customProgramNote) {
      toast.error("Please select a program or enter a custom program request")
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student")
      return
    }

    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          program_id: selectedProgram?.id || null,
          requested_university_program_note: customProgramNote || null,
          intake: intake || null,
          personal_statement: personalStatement || null,
          study_plan: studyPlan || null,
          notes: notes || null,
          priority,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create application')
      }

      toast.success('Application created successfully')
      setOpen(false)
      resetForm()
      onApplicationAdded?.()
    } catch (error) {
      console.error('Error creating application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create application')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedStudent(null)
    setSelectedProgram(null)
    setCustomProgramNote("")
    setIntake("")
    setPersonalStatement("")
    setStudyPlan("")
    setNotes("")
    setPriority(0)
    setStudentSearch("")
    setProgramSearch("")
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
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Application</DialogTitle>
          <DialogDescription>
            Create a new application for a student. Follow the steps below.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <IconCheck className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm hidden sm:block",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <Separator className="w-8 mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="h-[400px] w-full pr-4">
          {/* Step 1: Select Student */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedStudent ? (
                        <div className="flex items-center gap-2">
                          <IconUser className="h-4 w-4" />
                          <span>{selectedStudent.users.full_name}</span>
                          <span className="text-muted-foreground text-sm">
                            ({selectedStudent.users.email})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select a student...</span>
                      )}
                      <IconSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name or email..."
                        value={studentSearch}
                        onValueChange={setStudentSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isFetching ? "Loading..." : "No students found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={student.id}
                              onSelect={() => {
                                setSelectedStudent(student)
                                setStudentPopoverOpen(false)
                              }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <IconUser className="h-4 w-4" />
                                <div className="flex-1">
                                  <div className="font-medium">{student.users.full_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {student.users.email}
                                    {student.nationality && ` • ${student.nationality}`}
                                  </div>
                                </div>
                                {selectedStudent?.id === student.id && (
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
              </div>

              {selectedStudent && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconUser className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedStudent.users.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedStudent.users.email}
                        </div>
                      </div>
                      {selectedStudent.nationality && (
                        <Badge variant="outline" className="ml-auto">
                          {selectedStudent.nationality}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Select Program */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Program (Optional)</Label>
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
              </div>

              {selectedProgram && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconSchool className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{selectedProgram.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedProgram.universities?.name_en}
                          {selectedProgram.degree_level && ` • ${selectedProgram.degree_level}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProgram(null)}
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
                  <span className="bg-background px-2 text-muted-foreground">Or enter custom request</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customProgram">Custom Program Request</Label>
                <Textarea
                  id="customProgram"
                  placeholder="E.g., PhD in Computer Science at Tsinghua University"
                  value={customProgramNote}
                  onChange={(e) => {
                    setCustomProgramNote(e.target.value)
                    if (e.target.value) setSelectedProgram(null)
                  }}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  If the program is not in our database, describe the desired program and university.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
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
                  <div className="flex gap-2">
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
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Student</div>
                    <div className="flex items-center gap-2 mt-1">
                      <IconUser className="h-4 w-4" />
                      <span className="font-medium">{selectedStudent?.users.full_name}</span>
                      <span className="text-muted-foreground">({selectedStudent?.users.email})</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Program</div>
                    {selectedProgram ? (
                      <div className="flex items-center gap-2 mt-1">
                        <IconSchool className="h-4 w-4" />
                        <span className="font-medium">{selectedProgram.name}</span>
                        <span className="text-muted-foreground">
                          ({selectedProgram.universities?.name_en})
                        </span>
                      </div>
                    ) : customProgramNote ? (
                      <div className="mt-1 text-muted-foreground italic">
                        "{customProgramNote}"
                      </div>
                    ) : (
                      <div className="mt-1 text-muted-foreground">No program selected</div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Intake</div>
                      <div className="mt-1">{intake || "Not specified"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Priority</div>
                      <Badge className={cn("mt-1", getPriorityLabel(priority).color)}>
                        {getPriorityLabel(priority).label}
                      </Badge>
                    </div>
                  </div>

                  {(personalStatement || studyPlan || notes) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {personalStatement && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Personal Statement</div>
                            <div className="mt-1 text-sm line-clamp-2">{personalStatement}</div>
                          </div>
                        )}
                        {studyPlan && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Study Plan</div>
                            <div className="mt-1 text-sm line-clamp-2">{studyPlan}</div>
                          </div>
                        )}
                        {notes && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Admin Notes</div>
                            <div className="mt-1 text-sm line-clamp-2">{notes}</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground text-center">
                The application will be created with status <Badge variant="outline">draft</Badge>
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => setOpen(false) : handleBack}
          >
            {currentStep === 1 ? "Cancel" : (
              <>
                <IconChevronLeft className="mr-2 h-4 w-4" />
                Back
              </>
            )}
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Next
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
