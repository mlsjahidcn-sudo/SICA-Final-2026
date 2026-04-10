"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconArrowLeft,
  IconSchool,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconChevronDown,
  IconX,
  IconUser,
  IconFileText,
  IconCalendar,
  IconCircleCheck,
  IconAlertCircle,
  IconDeviceFloppy,
  IconPlus,
  IconInfoCircle,
  IconBuilding,
} from "@tabler/icons-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────

interface Student {
  id: string
  full_name: string
  email: string
  nationality?: string
  avatar_url?: string
}

interface Program {
  id: string
  name: string
  name_en?: string
  name_cn?: string | null
  degree_level: string
  category?: string
  universities: {
    id: string
    name: string
    name_en?: string
    name_cn?: string | null
    city: string
    logo_url?: string | null
  }
}

interface University {
  id: string
  name: string
  name_en?: string
  name_cn?: string | null
  city: string
  logo_url?: string | null
}

interface WizardFormData {
  student_id: string
  program_ids: string[] // Changed to array for multiple programs
  university_id: string
  intake: string
  personal_statement: string
  study_plan: string
  requested_university_program_note: string // New field
  documents: Array<{
    document_type: string
    file_url: string
    file_name: string
    file_size: number
  }>
}

// ─── Constants ───────────────────────────────────────────────────────

const STEPS = [
  { id: "student", label: "Select Student", icon: IconUser },
  { id: "program", label: "Program & Intake", icon: IconSchool },
  { id: "statement", label: "Personal Statement", icon: IconFileText },
  { id: "documents", label: "Documents", icon: IconFileText },
  { id: "review", label: "Review & Submit", icon: IconCircleCheck },
]

const CURRENT_YEAR = new Date().getFullYear()
const INTAKE_OPTIONS = [
  { value: `${CURRENT_YEAR}-spring`, label: `Spring ${CURRENT_YEAR}` },
  { value: `${CURRENT_YEAR}-fall`, label: `Fall ${CURRENT_YEAR}` },
  { value: `${CURRENT_YEAR + 1}-spring`, label: `Spring ${CURRENT_YEAR + 1}` },
  { value: `${CURRENT_YEAR + 1}-fall`, label: `Fall ${CURRENT_YEAR + 1}` },
]

// ─── Component ───────────────────────────────────────────────────────

export default function PartnerNewApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudentId = searchParams.get("student")

  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [applicationId, setApplicationId] = React.useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false)

  // Form data
  const [formData, setFormData] = React.useState<WizardFormData>({
    student_id: preselectedStudentId || "",
    program_ids: [], // Changed to array
    university_id: "",
    intake: "",
    personal_statement: "",
    study_plan: "",
    requested_university_program_note: "", // New field
    documents: [],
  })

  // UI state for "Can't find university/program?" toggle
  const [showRequestNote, setShowRequestNote] = React.useState(false)

  // Data fetching
  const [students, setStudents] = React.useState<Student[]>([])
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false)
  const [isLoadingPrograms, setIsLoadingPrograms] = React.useState(false)

  // Student search
  const [studentSearch, setStudentSearch] = React.useState("")
  const [studentPopoverOpen, setStudentPopoverOpen] = React.useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  // Program search
  const [programSearch, setProgramSearch] = React.useState("")
  const [programPopoverOpen, setProgramPopoverOpen] = React.useState(false)
  const [programDegreeFilter, setProgramDegreeFilter] = React.useState<string>("all")

  // ─── Data Fetching Effects ─────────────────────────────────────────

  // Fetch partner's students
  React.useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const token = localStorage.getItem("sica_auth_token")
        const response = await fetch("/api/partner/students?pageSize=100", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        } else {
          toast.error("Failed to load students")
        }
      } catch (error) {
        console.error("Error fetching students:", error)
        toast.error("Failed to load students")
      } finally {
        setIsLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [])

  // Fetch ALL programs (with university details included)
  React.useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoadingPrograms(true)
      try {
        const token = localStorage.getItem("sica_auth_token")
        const response = await fetch("/api/programs?limit=500", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          // Normalize programs (handle arrays from Supabase relations)
          const normalizedPrograms = (data.programs || []).map((p: any) => {
            const universities = Array.isArray(p.universities) ? p.universities[0] : p.universities
            return {
              id: p.id,
              name: p.name_en || p.name,
              name_en: p.name_en,
              name_cn: p.name_cn,
              degree_level: p.degree_level,
              category: p.category,
              universities: universities
            }
          })
          setPrograms(normalizedPrograms)
        }
      } catch (error) {
        console.error("Error fetching programs:", error)
      } finally {
        setIsLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [])

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleStudentSelect = (studentId: string) => {
    setFormData((prev) => ({ ...prev, student_id: studentId }))
    setStudentPopoverOpen(false)
  }

  const handleProgramToggle = (programId: string) => {
    setFormData((prev) => {
      const isSelected = prev.program_ids.includes(programId)
      return {
        ...prev,
        program_ids: isSelected
          ? prev.program_ids.filter(id => id !== programId)
          : [...prev.program_ids, programId]
      }
    })
  }

  const clearAllPrograms = () => {
    setFormData((prev) => ({ ...prev, program_ids: [] }))
  }

  const createDraftApplication = async () => {
    if (!formData.student_id || (formData.program_ids.length === 0 && !showRequestNote) || !formData.intake) {
      toast.error("Please fill in all required fields")
      return false
    }

    try {
      const token = localStorage.getItem("sica_auth_token")
      
      // If multiple programs selected, create one application per program
      // For now, let's use the first selected program and store the rest in notes or create multiple
      const primaryProgramId = formData.program_ids[0] || null
      const primaryUniversityId = primaryProgramId 
        ? programs.find(p => p.id === primaryProgramId)?.universities.id || null 
        : null
      
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          university_id: primaryUniversityId,
          program_id: primaryProgramId,
          intake: formData.intake,
          requested_university_program_note: showRequestNote ? formData.requested_university_program_note : null,
          selected_program_ids: formData.program_ids // Extra field for future use
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setApplicationId(data.application.id)
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create application")
        return false
      }
    } catch (error) {
      console.error("Error creating application:", error)
      toast.error("Failed to create application")
      return false
    }
  }

  const handleNext = async () => {
    // Step 1: Student selection - just move to next step
    if (currentStep === 0 && formData.student_id) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    // Step 2: Program & Intake - create draft application
    if (currentStep === 1) {
      if ((formData.program_ids.length === 0 && !showRequestNote) || !formData.intake) {
        toast.error("Please select at least one program or add a request note, and select an intake")
        return
      }

      if (!applicationId) {
        const success = await createDraftApplication()
        if (success) {
          setCurrentStep((prev) => prev + 1)
        }
      } else {
        setCurrentStep((prev) => prev + 1)
      }
      return
    }

    // Other steps
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!applicationId) {
      toast.error("Application not found")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("sica_auth_token")
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setShowSuccessDialog(true)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Filters ─────────────────────────────────────────────────────────

  const filteredStudents = React.useMemo(() => {
    if (!debouncedStudentSearch) return students
    const search = debouncedStudentSearch.toLowerCase()
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.nationality?.toLowerCase().includes(search)
    )
  }, [students, debouncedStudentSearch])

  const filteredPrograms = React.useMemo(() => {
    let result = [...programs]
    if (programDegreeFilter !== "all") {
      result = result.filter(p => p.degree_level.toLowerCase() === programDegreeFilter.toLowerCase())
    }
    if (programSearch) {
      const search = programSearch.toLowerCase()
      result = result.filter(p => 
        (p.name?.toLowerCase().includes(search) || p.name_en?.toLowerCase().includes(search) || p.name_cn?.toLowerCase().includes(search)) ||
        (p.universities.name?.toLowerCase().includes(search) || p.universities.name_en?.toLowerCase().includes(search) || p.universities.name_cn?.toLowerCase().includes(search))
      )
    }
    return result
  }, [programs, programSearch, programDegreeFilter])

  const selectedStudent = React.useMemo(
    () => students.find((s) => s.id === formData.student_id),
    [students, formData.student_id]
  )

  const selectedProgramsList = React.useMemo(
    () => programs.filter(p => formData.program_ids.includes(p.id)),
    [programs, formData.program_ids]
  )

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Application</h1>
          <p className="text-muted-foreground">
            Create a new application on behalf of a student
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {STEPS[currentStep].label}
            </span>
          </div>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} />
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    index <= currentStep
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-full p-2",
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "bg-primary/10"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs hidden md:block">{step.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Select a student to create an application for"}
            {currentStep === 1 && "Choose the program(s) and intake period"}
            {currentStep === 2 && "Provide personal statement and study plan"}
            {currentStep === 3 && "Upload required documents"}
            {currentStep === 4 && "Review and submit the application"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Student Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Label>Select Student *</Label>
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentPopoverOpen}
                    className="w-full h-auto min-h-[40px] justify-between"
                  >
                    <span className="flex items-center gap-2 flex-1 truncate">
                      {selectedStudent ? (
                        <>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <IconUser className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left truncate">
                            <div className="font-medium truncate">{selectedStudent.full_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {selectedStudent.email}
                            </div>
                          </div>
                        </>
                      ) : (
                        "Select a student..."
                      )}
                    </span>
                    <IconChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search students..."
                      value={studentSearch}
                      onValueChange={setStudentSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingStudents ? "Loading..." : "No students found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredStudents.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={student.id}
                            onSelect={() => handleStudentSelect(student.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <IconUser className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{student.full_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {student.email}
                                  {student.nationality && ` • ${student.nationality}`}
                                </div>
                              </div>
                              {formData.student_id === student.id && (
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

              {students.length === 0 && !isLoadingStudents && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <IconUser className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    No students found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/partner-v2/students/new")}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add New Student
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Program & Intake (Enhanced!) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Program Selection First! */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Select Programs * (Multiple allowed)</Label>
                  
                  {/* Filters for programs */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search programs or universities..."
                        value={programSearch}
                        onChange={(e) => setProgramSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={programDegreeFilter} onValueChange={setProgramDegreeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Degrees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Degrees</SelectItem>
                        <SelectItem value="bachelor">Bachelor</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="language">Language Program</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected programs summary */}
                  {selectedProgramsList.length > 0 && (
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Selected Programs ({selectedProgramsList.length})
                        </Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearAllPrograms}
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProgramsList.map((program) => (
                          <div 
                            key={program.id}
                            className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                          >
                            <IconCheck className="h-3 w-3" />
                            <span className="truncate max-w-[250px]">
                              {program.universities.name_en || program.universities.name} - {program.name}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon-xs" 
                              className="h-5 w-5"
                              onClick={() => handleProgramToggle(program.id)}
                            >
                              <IconX className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Programs list with checkboxes */}
                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    <Command>
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingPrograms ? "Loading..." : "No programs found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredPrograms.map((program) => (
                            <CommandItem
                              key={program.id}
                              onSelect={() => handleProgramToggle(program.id)}
                              className="flex items-start gap-3 py-3"
                            >
                              <Checkbox 
                                checked={formData.program_ids.includes(program.id)} 
                                onCheckedChange={() => handleProgramToggle(program.id)} 
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <IconSchool className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{program.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <IconBuilding className="h-3 w-3" />
                                  <span>{program.universities.name_en || program.universities.name}</span>
                                  <span>•</span>
                                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {program.degree_level}
                                  </span>
                                  {program.category && (
                                    <>
                                      <span>•</span>
                                      <span>{program.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>

                {/* Request New University/Program Toggle */}
                <div className="space-y-4 pt-2">
                  <Separator />
                  
                  <div className="flex items-center gap-3">
                    <Switch 
                      id="request-toggle" 
                      checked={showRequestNote} 
                      onCheckedChange={setShowRequestNote} 
                    />
                    <div>
                      <Label htmlFor="request-toggle" className="font-medium">
                        Can't find your university or program?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Describe what you need and we'll add it to our database
                      </p>
                    </div>
                  </div>

                  {showRequestNote && (
                    <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <IconInfoCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <Label className="text-amber-800 dark:text-amber-200 font-medium">
                            Request a new university or program
                          </Label>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Please provide details about the university and/or program you need, including:
                            <br />- University name (if known)
                            <br />- Program name and degree level
                            <br />- Any other relevant information
                          </p>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Describe the university and/or program you need..."
                        value={formData.requested_university_program_note}
                        onChange={(e) => setFormData((prev) => ({ ...prev, requested_university_program_note: e.target.value }))}
                        rows={4}
                        className="bg-white dark:bg-gray-900"
                      />
                    </div>
                  )}
                </div>

                {/* Intake Selection */}
                <div className="space-y-2 pt-2">
                  <Label>Intake *</Label>
                  <Select 
                    value={formData.intake} 
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, intake: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intake period" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTAKE_OPTIONS.map((intake) => (
                        <SelectItem key={intake.value} value={intake.value}>
                          {intake.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Statement */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Personal Statement</Label>
                <Textarea
                  placeholder="Write the student's personal statement here..."
                  value={formData.personal_statement}
                  onChange={(e) => setFormData((prev) => ({ ...prev, personal_statement: e.target.value }))}
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Study Plan</Label>
                <Textarea
                  placeholder="Write the student's study plan here..."
                  value={formData.study_plan}
                  onChange={(e) => setFormData((prev) => ({ ...prev, study_plan: e.target.value }))}
                  rows={8}
                />
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Document upload functionality will be available after creating the draft application.
              </p>
              {applicationId && (
                <Button asChild>
                  <a href={`/partner-v2/applications/${applicationId}/documents`}>
                    Go to Document Manager
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudent && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconUser className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedStudent.full_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program & Intake</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selected Programs</p>
                    {selectedProgramsList.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProgramsList.map((program) => (
                          <div 
                            key={program.id} 
                            className="flex items-center gap-2 p-2 rounded border"
                          >
                            <IconCheck className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{program.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {program.universities.name_en || program.universities.name} • {program.degree_level}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No program selected - using request note
                      </p>
                    )}
                  </div>
                  
                  {showRequestNote && formData.requested_university_program_note && (
                    <div className="mt-3 p-3 rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <IconInfoCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Request Note
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
                            {formData.requested_university_program_note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">Intake</p>
                    <p className="font-medium">
                      {INTAKE_OPTIONS.find(i => i.value === formData.intake)?.label || formData.intake}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personal Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.personal_statement ? (
                    <p className="whitespace-pre-wrap text-sm">
                      {formData.personal_statement}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      No personal statement provided
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.study_plan ? (
                    <p className="whitespace-pre-wrap text-sm">
                      {formData.study_plan}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      No study plan provided
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {currentStep < STEPS.length - 1 && (
            <>
              <Button variant="ghost" onClick={() => toast.success("Draft saved")}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleNext}>
                Continue
                <IconChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
              </Button>
            </>
          )}
          {currentStep === STEPS.length - 1 && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconCircleCheck className="h-4 w-4 mr-2" />
              )}
              Submit Application
            </Button>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Created!</DialogTitle>
            <DialogDescription>
              The application has been created successfully. What would you like to do next?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href={`/partner-v2/applications/${applicationId}`}>
                View Application Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/partner-v2/applications">
                Back to Applications List
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
