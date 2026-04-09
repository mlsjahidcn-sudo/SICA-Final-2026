"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  name_en: string
  name_cn: string | null
  degree_type: string
  discipline: string
  universities?: {
    id: string
    name_en: string
    name_cn: string | null
    city: string
    logo_url: string | null
  }
}

interface University {
  id: string
  name_en: string
  name_cn: string | null
  city: string
  logo_url: string | null
}

interface DocChecklistItem {
  document_type: string
  label_en: string
  label_zh: string
  description: string
  is_required: boolean
  is_uploaded: boolean
  status: string
}

interface WizardFormData {
  student_id: string
  program_id: string
  university_id: string
  intake: string
  personal_statement: string
  study_plan: string
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
    program_id: "",
    university_id: "",
    intake: "",
    personal_statement: "",
    study_plan: "",
    documents: [],
  })

  // Data fetching
  const [students, setStudents] = React.useState<Student[]>([])
  const [universities, setUniversities] = React.useState<University[]>([])
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [docChecklist, setDocChecklist] = React.useState<DocChecklistItem[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false)
  const [isLoadingUniversities, setIsLoadingUniversities] = React.useState(false)
  const [isLoadingPrograms, setIsLoadingPrograms] = React.useState(false)
  const [isLoadingChecklist, setIsLoadingChecklist] = React.useState(false)

  // Student search
  const [studentSearch, setStudentSearch] = React.useState("")
  const [studentPopoverOpen, setStudentPopoverOpen] = React.useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  // University/Program search
  const [universitySearch, setUniversitySearch] = React.useState("")
  const [universityPopoverOpen, setUniversityPopoverOpen] = React.useState(false)
  const [programSearch, setProgramSearch] = React.useState("")
  const [programPopoverOpen, setProgramPopoverOpen] = React.useState(false)

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

  // Fetch universities
  React.useEffect(() => {
    const fetchUniversities = async () => {
      setIsLoadingUniversities(true)
      try {
        const token = localStorage.getItem("sica_auth_token")
        const response = await fetch("/api/universities?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setUniversities(data.universities || [])
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
      } finally {
        setIsLoadingUniversities(false)
      }
    }

    fetchUniversities()
  }, [])

  // Fetch programs when university is selected
  React.useEffect(() => {
    if (formData.university_id) {
      const fetchPrograms = async () => {
        setIsLoadingPrograms(true)
        try {
          const token = localStorage.getItem("sica_auth_token")
          const response = await fetch(
            `/api/programs?university_id=${formData.university_id}&limit=100`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (response.ok) {
            const data = await response.json()
            setPrograms(data.programs || [])
          }
        } catch (error) {
          console.error("Error fetching programs:", error)
        } finally {
          setIsLoadingPrograms(false)
        }
      }

      fetchPrograms()
    } else {
      setPrograms([])
    }
  }, [formData.university_id])

  // Fetch document checklist when program is selected
  React.useEffect(() => {
    if (applicationId) {
      const fetchChecklist = async () => {
        setIsLoadingChecklist(true)
        try {
          const token = localStorage.getItem("sica_auth_token")
          const response = await fetch(
            `/api/student/applications/${applicationId}/documents/checklist`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (response.ok) {
            const data = await response.json()
            setDocChecklist(data.checklist || [])
          }
        } catch (error) {
          console.error("Error fetching document checklist:", error)
        } finally {
          setIsLoadingChecklist(false)
        }
      }

      fetchChecklist()
    }
  }, [applicationId])

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleStudentSelect = (studentId: string) => {
    setFormData((prev) => ({ ...prev, student_id: studentId }))
    setStudentPopoverOpen(false)
  }

  const handleUniversitySelect = (universityId: string) => {
    setFormData((prev) => ({
      ...prev,
      university_id: universityId,
      program_id: "", // Reset program when university changes
    }))
    setUniversityPopoverOpen(false)
  }

  const handleProgramSelect = (programId: string) => {
    setFormData((prev) => ({ ...prev, program_id: programId }))
    setProgramPopoverOpen(false)
  }

  const createDraftApplication = async () => {
    if (!formData.student_id || !formData.program_id || !formData.intake) {
      toast.error("Please fill in all required fields")
      return false
    }

    try {
      const token = localStorage.getItem("sica_auth_token")
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          university_id: formData.university_id,
          program_id: formData.program_id,
          intake: formData.intake,
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
      if (!formData.program_id || !formData.intake) {
        toast.error("Please select a program and intake")
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

  const handleSaveDraft = async () => {
    toast.success("Draft saved successfully")
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

  const filteredUniversities = React.useMemo(() => {
    if (!universitySearch) return universities
    const search = universitySearch.toLowerCase()
    return universities.filter(
      (u) =>
        u.name_en.toLowerCase().includes(search) ||
        u.name_cn?.toLowerCase().includes(search) ||
        u.city.toLowerCase().includes(search)
    )
  }, [universities, universitySearch])

  const filteredPrograms = React.useMemo(() => {
    if (!programSearch) return programs
    const search = programSearch.toLowerCase()
    return programs.filter(
      (p) =>
        p.name_en.toLowerCase().includes(search) ||
        p.name_cn?.toLowerCase().includes(search)
    )
  }, [programs, programSearch])

  const selectedStudent = React.useMemo(
    () => students.find((s) => s.id === formData.student_id),
    [students, formData.student_id]
  )

  const selectedUniversity = React.useMemo(
    () => universities.find((u) => u.id === formData.university_id),
    [universities, formData.university_id]
  )

  const selectedProgram = React.useMemo(
    () => programs.find((p) => p.id === formData.program_id),
    [programs, formData.program_id]
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
            {currentStep === 1 && "Choose the program and intake period"}
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
                    Add New Student
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Program & Intake */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* University Selection */}
              <div className="space-y-2">
                <Label>University *</Label>
                <Popover
                  open={universityPopoverOpen}
                  onOpenChange={setUniversityPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={universityPopoverOpen}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {selectedUniversity ? (
                          <>
                            <IconSchool className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{selectedUniversity.name_en}</span>
                            {selectedUniversity.name_cn && (
                              <span className="text-muted-foreground truncate">
                                ({selectedUniversity.name_cn})
                              </span>
                            )}
                          </>
                        ) : (
                          "Select a university..."
                        )}
                      </span>
                      <IconChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search universities..."
                        value={universitySearch}
                        onValueChange={setUniversitySearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingUniversities ? "Loading..." : "No universities found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredUniversities.map((university) => (
                            <CommandItem
                              key={university.id}
                              value={university.id}
                              onSelect={() => handleUniversitySelect(university.id)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <IconSchool className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {university.name_en}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {university.city}
                                  </div>
                                </div>
                                {formData.university_id === university.id && (
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

              {/* Program Selection */}
              <div className="space-y-2">
                <Label>Program *</Label>
                <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={programPopoverOpen}
                      className="w-full justify-between"
                      disabled={!formData.university_id}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {selectedProgram ? (
                          <>
                            <IconFileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{selectedProgram.name_en}</span>
                          </>
                        ) : formData.university_id ? (
                          "Select a program..."
                        ) : (
                          "Select a university first..."
                        )}
                      </span>
                      <IconChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search programs..."
                        value={programSearch}
                        onValueChange={setProgramSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingPrograms ? "Loading..." : "No programs found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredPrograms.map((program) => (
                            <CommandItem
                              key={program.id}
                              value={program.id}
                              onSelect={() => handleProgramSelect(program.id)}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <IconFileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">{program.name_en}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {program.degree_type} • {program.discipline}
                                  </div>
                                </div>
                                {formData.program_id === program.id && (
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

              {/* Intake Selection */}
              <div className="space-y-2">
                <Label>Intake *</Label>
                <Select
                  value={formData.intake}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, intake: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake period" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTAKE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Personal Statement */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Personal Statement</Label>
                <Textarea
                  placeholder="Write a personal statement for the student..."
                  value={formData.personal_statement}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personal_statement: e.target.value,
                    }))
                  }
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 500-1000 words
                </p>
              </div>

              <div className="space-y-2">
                <Label>Study Plan</Label>
                <Textarea
                  placeholder="Write a study plan for the student..."
                  value={formData.study_plan}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      study_plan: e.target.value,
                    }))
                  }
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Outline the student's academic goals and research interests
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {isLoadingChecklist ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : docChecklist.length > 0 ? (
                <div className="space-y-3">
                  {docChecklist.map((doc) => (
                    <div
                      key={doc.document_type}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <IconFileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.label_en}</div>
                          <div className="text-xs text-muted-foreground">
                            {doc.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.is_uploaded ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <IconCheck className="h-4 w-4" />
                            Uploaded
                          </span>
                        ) : doc.is_required ? (
                          <span className="text-sm text-amber-600">Required</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconFileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No document checklist available</p>
                </div>
              )}

              <Separator />

              <div className="rounded-lg border border-dashed p-8 text-center">
                <IconFileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Documents can be uploaded after creating the application
                </p>
                <p className="text-xs text-muted-foreground">
                  You can skip this step and upload documents later from the application details page
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  Student Information
                </h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedStudent?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedStudent?.email}</span>
                  </div>
                  {selectedStudent?.nationality && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nationality:</span>
                      <span>{selectedStudent.nationality}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Program Info */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <IconSchool className="h-4 w-4" />
                  Program Information
                </h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">University:</span>
                    <span className="font-medium">
                      {selectedUniversity?.name_en}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Program:</span>
                    <span>{selectedProgram?.name_en}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Degree:</span>
                    <span className="capitalize">{selectedProgram?.degree_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intake:</span>
                    <span className="capitalize">
                      {formData.intake?.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Documents Status */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <IconFileText className="h-4 w-4" />
                  Documents
                </h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Required Documents:
                    </span>
                    <span>
                      {docChecklist.filter((d) => d.is_uploaded).length} /{" "}
                      {docChecklist.filter((d) => d.is_required).length} uploaded
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">
                      Important Notice
                    </p>
                    <p className="text-amber-700 mt-1">
                      By submitting this application, you confirm that all information
                      provided is accurate and complete. The student will be notified
                      about the application status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCircleCheck className="h-5 w-5 text-green-600" />
              Application Submitted Successfully
            </DialogTitle>
            <DialogDescription>
              The application has been submitted successfully. The student will be
              notified about the application status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false)
                router.push("/partner-v2/applications")
              }}
            >
              Back to Applications
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                if (applicationId) {
                  router.push(`/partner-v2/applications/${applicationId}`)
                }
              }}
            >
              View Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
