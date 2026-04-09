"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  IconArrowLeft,
  IconSchool,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconChevronDown,
  IconX,
  IconStar,
  IconUser,
  IconLanguage,
  IconFileUpload,
  IconTrophy,
  IconFlask,
  IconCurrencyDollar,
  IconTrash,
  IconPlus,
  IconEdit,
  IconFileText,
  IconCalendar,
  IconDeviceFloppy,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useAutosave, AutosaveStatus } from "@/hooks/use-autosave"
import { DuplicateApplicationWarning } from "@/components/student-v2/duplicate-warning"
import {
  TemplateManager,
  ApplicationTemplate,
} from "@/components/student-v2/template-manager"
import {
  studentApi,
  type StudentProfile,
  type EducationHistoryEntry,
  type WorkExperienceEntry,
  type ExtracurricularActivityEntry,
  type AwardEntry,
  type PublicationEntry,
  type ResearchExperienceEntry,
  type ScholarshipApplicationData,
  type FinancialGuaranteeData,
} from "@/lib/student-api"

// ─── Types ───────────────────────────────────────────────────────────

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
  program_id: string
  university_id: string
  intake: string
  personal_statement: string
  study_plan: string
  // Step 2: Personal Info
  full_name: string
  email: string
  phone: string
  nationality: string
  date_of_birth: string
  gender: string
  current_address: string
  chinese_name: string
  emergency_contact_name: string
  emergency_contact_phone: string
  // Step 3: Academic Background
  education_history: EducationHistoryEntry[]
  work_experience: WorkExperienceEntry[]
  // Step 4: Language Proficiency
  hsk_level: string
  hsk_score: string
  ielts_score: string
  toefl_score: string
  other_languages: string
  // Step 7: Additional Info
  extracurricular_activities: ExtracurricularActivityEntry[]
  awards: AwardEntry[]
  publications: PublicationEntry[]
  research_experience: ResearchExperienceEntry[]
  scholarship_application: ScholarshipApplicationData
  financial_guarantee: FinancialGuaranteeData
}

// ─── Constants ───────────────────────────────────────────────────────

const STEP_CONFIG = [
  { label: "Program", icon: IconSchool },
  { label: "Personal", icon: IconUser },
  { label: "Academic", icon: IconSchool },
  { label: "Language", icon: IconLanguage },
  { label: "Essays", icon: IconFileText },
  { label: "Documents", icon: IconFileUpload },
  { label: "Additional", icon: IconStar },
  { label: "Review", icon: IconCircleCheck },
]

const TOTAL_STEPS = STEP_CONFIG.length

const initialFormData: WizardFormData = {
  program_id: "",
  university_id: "",
  intake: "",
  personal_statement: "",
  study_plan: "",
  full_name: "",
  email: "",
  phone: "",
  nationality: "",
  date_of_birth: "",
  gender: "",
  current_address: "",
  chinese_name: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  education_history: [],
  work_experience: [],
  hsk_level: "",
  hsk_score: "",
  ielts_score: "",
  toefl_score: "",
  other_languages: "",
  extracurricular_activities: [],
  awards: [],
  publications: [],
  research_experience: [],
  scholarship_application: {},
  financial_guarantee: {},
}

// ─── Helpers ─────────────────────────────────────────────────────────

function generateIntakeOptions(): { value: string; label: string }[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const options: { value: string; label: string }[] = []

  for (let y = currentYear; y <= currentYear + 2; y++) {
    if (y === currentYear && currentMonth > 6) {
      options.push({ value: `Fall ${y}`, label: `Fall ${y} (September)` })
    } else if (y === currentYear && currentMonth <= 6) {
      options.push({ value: `Fall ${y}`, label: `Fall ${y} (September)` })
    } else {
      options.push({ value: `Spring ${y}`, label: `Spring ${y} (March)` })
      options.push({ value: `Fall ${y}`, label: `Fall ${y} (September)` })
    }
  }

  // Remove duplicates
  const seen = new Set<string>()
  return options.filter((o) => {
    if (seen.has(o.value)) return false
    seen.add(o.value)
    return true
  })
}

// ─── Main Component ──────────────────────────────────────────────────

export default function NewApplicationPage() {
  const router = useRouter()

  // Wizard state
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState<WizardFormData>(initialFormData)
  const [selectedProgram, setSelectedProgram] = React.useState<Program | null>(null)
  const [uploadingDocs, setUploadingDocs] = React.useState<Record<string, File>>({})

  // Draft state
  const [applicationId, setApplicationId] = React.useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Profile
  const [profile, setProfile] = React.useState<StudentProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = React.useState(true)

  // Program search
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchingPrograms, setSearchingPrograms] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  // Documents
  const [docChecklist, setDocChecklist] = React.useState<DocChecklistItem[]>([])
  const [loadingDocs, setLoadingDocs] = React.useState(false)

  // Templates
  const [showTemplatesDialog, setShowTemplatesDialog] = React.useState(false)

  // Success
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [submittedAppId, setSubmittedAppId] = React.useState<string | null>(null)

  // Validation
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  // Autosave hook
  const autosave = useAutosave({
    applicationId: applicationId || "",
    onSave: () => {},
    onError: (err) => console.error("Autosave error:", err),
  })

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // ─── Fetch Profile ───────────────────────────────────────────────

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await studentApi.getProfile()
      if (data) {
        setProfile(data)
        const sp = data.studentProfile || {}
        setFormData((prev) => ({
          ...prev,
          full_name: data.user.full_name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          nationality: (sp.nationality as string) || "",
          date_of_birth: (sp.date_of_birth as string) || "",
          gender: (sp.gender as string) || "",
          current_address: (sp.current_address as string) || "",
          chinese_name: (sp.chinese_name as string) || "",
          emergency_contact_name: (sp.emergency_contact_name as string) || "",
          emergency_contact_phone: (sp.emergency_contact_phone as string) || "",
          education_history: (sp.education_history as EducationHistoryEntry[]) || [],
          work_experience: (sp.work_experience as WorkExperienceEntry[]) || [],
          hsk_level: sp.hsk_level != null ? String(sp.hsk_level) : "",
          hsk_score: sp.hsk_score != null ? String(sp.hsk_score) : "",
          ielts_score: (sp.ielts_score as string) || "",
          toefl_score: sp.toefl_score != null ? String(sp.toefl_score) : "",
          extracurricular_activities: (sp.extracurricular_activities as ExtracurricularActivityEntry[]) || [],
          awards: (sp.awards as AwardEntry[]) || [],
          publications: (sp.publications as PublicationEntry[]) || [],
          research_experience: (sp.research_experience as ResearchExperienceEntry[]) || [],
          scholarship_application: (sp.scholarship_application as ScholarshipApplicationData) || {},
          financial_guarantee: (sp.financial_guarantee as FinancialGuaranteeData) || {},
        }))
      }
      setFetchingProfile(false)
    }
    fetchProfile()
  }, [])

  // ─── Program Search ──────────────────────────────────────────────

  React.useEffect(() => {
    const searchPrograms = async () => {
      if (!debouncedSearchQuery.trim()) {
        setPrograms([])
        return
      }
      setSearchingPrograms(true)
      try {
        const response = await fetch(
          `/api/programs?search=${encodeURIComponent(debouncedSearchQuery)}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          setPrograms(data.programs || [])
        }
      } catch (error) {
        console.error("Error searching programs:", error)
      } finally {
        setSearchingPrograms(false)
      }
    }
    searchPrograms()
  }, [debouncedSearchQuery])

  // ─── Document Checklist ──────────────────────────────────────────

  React.useEffect(() => {
    if (!applicationId) return
    const fetchChecklist = async () => {
      setLoadingDocs(true)
      try {
        const token = localStorage.getItem("sica_auth_token")
        const res = await fetch(`/api/student/applications/${applicationId}/documents/checklist`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          setDocChecklist(data.checklist || [])
        }
      } catch (err) {
        console.error("Error fetching doc checklist:", err)
      } finally {
        setLoadingDocs(false)
      }
    }
    fetchChecklist()
  }, [applicationId])

  // ─── Autosave Effect ─────────────────────────────────────────────

  React.useEffect(() => {
    if (!applicationId || step <= 1) return
    const data: Record<string, unknown> = {}
    if (formData.personal_statement !== undefined) data.personal_statement = formData.personal_statement
    if (formData.study_plan !== undefined) data.study_plan = formData.study_plan
    if (formData.intake) data.intake = formData.intake
    if (formData.hsk_level) data.hsk_level = formData.hsk_level
    if (formData.hsk_score) data.hsk_score = formData.hsk_score
    if (formData.ielts_score) data.ielts_score = formData.ielts_score
    if (formData.toefl_score) data.toefl_score = formData.toefl_score
    if (formData.other_languages) data.other_languages = formData.other_languages
    if (Object.keys(data).length > 0) {
      autosave.debouncedSave(data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.personal_statement,
    formData.study_plan,
    formData.intake,
    formData.hsk_level,
    formData.hsk_score,
    formData.ielts_score,
    formData.toefl_score,
    formData.other_languages,
  ])

  // ─── Actions ─────────────────────────────────────────────────────

  const selectProgram = (program: Program) => {
    setSelectedProgram(program)
    setFormData((prev) => ({
      ...prev,
      program_id: program.id,
      university_id: program.universities?.id || "",
    }))
    setOpen(false)
    setSearchQuery("")
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next.program_id
      return next
    })
  }

  const updateField = <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // Array field helpers
  const addEducation = () =>
    setFormData((prev) => ({
      ...prev,
      education_history: [
        ...prev.education_history,
        { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", city: "", country: "" },
      ],
    }))
  const removeEducation = (i: number) =>
    setFormData((prev) => ({ ...prev, education_history: prev.education_history.filter((_, j) => j !== i) }))
  const updateEducation = (i: number, field: keyof EducationHistoryEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      education_history: prev.education_history.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const addWorkExp = () =>
    setFormData((prev) => ({
      ...prev,
      work_experience: [...prev.work_experience, { company: "", position: "", start_date: "", description: "" }],
    }))
  const removeWorkExp = (i: number) =>
    setFormData((prev) => ({ ...prev, work_experience: prev.work_experience.filter((_, j) => j !== i) }))
  const updateWorkExp = (i: number, field: keyof WorkExperienceEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const addExtracurricular = () =>
    setFormData((prev) => ({
      ...prev,
      extracurricular_activities: [
        ...prev.extracurricular_activities,
        { activity: "", role: "", organization: "", start_date: "", end_date: "", description: "" },
      ],
    }))
  const removeExtracurricular = (i: number) =>
    setFormData((prev) => ({
      ...prev,
      extracurricular_activities: prev.extracurricular_activities.filter((_, j) => j !== i),
    }))
  const updateExtracurricular = (i: number, field: keyof ExtracurricularActivityEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      extracurricular_activities: prev.extracurricular_activities.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const addAward = () =>
    setFormData((prev) => ({
      ...prev,
      awards: [...prev.awards, { title: "", issuing_organization: "", date: "", description: "", certificate_url: "" }],
    }))
  const removeAward = (i: number) =>
    setFormData((prev) => ({ ...prev, awards: prev.awards.filter((_, j) => j !== i) }))
  const updateAward = (i: number, field: keyof AwardEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      awards: prev.awards.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const addPublication = () =>
    setFormData((prev) => ({
      ...prev,
      publications: [...prev.publications, { title: "", publisher: "", publication_date: "", url: "", description: "" }],
    }))
  const removePublication = (i: number) =>
    setFormData((prev) => ({ ...prev, publications: prev.publications.filter((_, j) => j !== i) }))
  const updatePublication = (i: number, field: keyof PublicationEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      publications: prev.publications.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const addResearch = () =>
    setFormData((prev) => ({
      ...prev,
      research_experience: [
        ...prev.research_experience,
        { topic: "", institution: "", supervisor: "", start_date: "", end_date: "", description: "" },
      ],
    }))
  const removeResearch = (i: number) =>
    setFormData((prev) => ({ ...prev, research_experience: prev.research_experience.filter((_, j) => j !== i) }))
  const updateResearch = (i: number, field: keyof ResearchExperienceEntry, value: string) =>
    setFormData((prev) => ({
      ...prev,
      research_experience: prev.research_experience.map((e, j) => (j === i ? { ...e, [field]: value } : e)),
    }))

  const updateScholarship = (field: keyof ScholarshipApplicationData, value: string) =>
    setFormData((prev) => ({ ...prev, scholarship_application: { ...prev.scholarship_application, [field]: value } }))
  const updateFinancial = (field: keyof FinancialGuaranteeData, value: string) =>
    setFormData((prev) => ({ ...prev, financial_guarantee: { ...prev.financial_guarantee, [field]: value } }))

  const handleFileSelect = (docType: string, file: File) => {
    setUploadingDocs((prev) => ({ ...prev, [docType]: file }))
  }

  const removeFile = (docType: string) => {
    setUploadingDocs((prev) => {
      const next = { ...prev }
      delete next[docType]
      return next
    })
  }

  // ─── Validation ──────────────────────────────────────────────────

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {}

    if (s === 1) {
      if (!formData.program_id) errors.program_id = "Please select a program"
      if (!formData.intake) errors.intake = "Please select an intake period"
    }
    // Steps 2, 3 are read-only - no validation needed
    if (s === 4) {
      // Language is optional, no validation
    }
    if (s === 5) {
      if (!formData.personal_statement.trim()) errors.personal_statement = "Personal statement is required"
      else if (formData.personal_statement.trim().length < 100)
        errors.personal_statement = "Personal statement should be at least 100 characters"
      if (!formData.study_plan.trim()) errors.study_plan = "Study plan is required"
      else if (formData.study_plan.trim().length < 100)
        errors.study_plan = "Study plan should be at least 100 characters"
    }
    // Step 6 documents - optional at creation time
    // Step 7 additional - optional

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ─── Create Draft ────────────────────────────────────────────────

  const createDraft = async (): Promise<string | null> => {
    if (applicationId) return applicationId
    setIsCreatingDraft(true)
    try {
      const response = await fetch("/api/student/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: formData.program_id,
          university_id: formData.university_id,
          intake: formData.intake,
          personal_statement: formData.personal_statement,
          study_plan: formData.study_plan,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        const id = data.application?.id
        if (id) {
          setApplicationId(id)
          toast.success("Draft created", { description: "Your application draft has been saved." })
          return id
        }
      } else {
        const data = await response.json()
        toast.error("Failed to create draft", { description: data.error || "Unknown error" })
      }
    } catch (error) {
      console.error("Error creating draft:", error)
      toast.error("Failed to create draft")
    } finally {
      setIsCreatingDraft(false)
    }
    return null
  }

  // ─── Handle Continue ─────────────────────────────────────────────

  const handleContinue = async () => {
    if (!validateStep(step)) return

    // Create draft on Step 1
    if (step === 1 && !applicationId) {
      const id = await createDraft()
      if (!id) return
    }

    // Save current step data
    if (applicationId && step > 1) {
      try {
        await autosave.saveNow({
          personal_statement: formData.personal_statement,
          study_plan: formData.study_plan,
          intake: formData.intake,
          hsk_level: formData.hsk_level,
          hsk_score: formData.hsk_score,
          ielts_score: formData.ielts_score,
          toefl_score: formData.toefl_score,
          other_languages: formData.other_languages,
        })
      } catch {
        // Continue even if save fails
      }
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ─── Save as Draft ───────────────────────────────────────────────

  const handleSaveAsDraft = async () => {
    if (!applicationId) {
      // Need to create the draft first
      const id = await createDraft()
      if (!id) return
    } else {
      try {
        await autosave.saveNow({
          personal_statement: formData.personal_statement,
          study_plan: formData.study_plan,
          intake: formData.intake,
          hsk_level: formData.hsk_level,
          hsk_score: formData.hsk_score,
          ielts_score: formData.ielts_score,
          toefl_score: formData.toefl_score,
          other_languages: formData.other_languages,
        })
        toast.success("Draft saved", { description: "You can continue later from your applications." })
      } catch {
        toast.error("Failed to save draft")
      }
    }
    router.push("/student-v2/applications")
  }

  // ─── Handle Submit ───────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!applicationId) {
      toast.error("No application draft found. Please start from Step 1.")
      return
    }

    // Final validation
    if (!formData.personal_statement.trim() || !formData.study_plan.trim() || !formData.intake) {
      toast.error("Missing required fields", {
        description: "Please ensure Personal Statement, Study Plan, and Intake are filled.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // First, save all current data
      await autosave.saveNow({
        personal_statement: formData.personal_statement,
        study_plan: formData.study_plan,
        intake: formData.intake,
        hsk_level: formData.hsk_level,
        hsk_score: formData.hsk_score,
        ielts_score: formData.ielts_score,
        toefl_score: formData.toefl_score,
        other_languages: formData.other_languages,
      })

      // Upload documents if any
      if (Object.keys(uploadingDocs).length > 0) {
        for (const [docType, file] of Object.entries(uploadingDocs)) {
          const uploadData = new FormData()
          uploadData.append("application_id", applicationId)
          uploadData.append("document_type", docType)
          uploadData.append("file", file)
          const token = localStorage.getItem("sica_auth_token")
          await fetch("/api/student/documents", {
            method: "POST",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: uploadData,
          })
        }
      }

      // Submit the application
      const token = localStorage.getItem("sica_auth_token")
      const submitRes = await fetch(`/api/student/applications/${applicationId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (submitRes.ok) {
        setSubmittedAppId(applicationId)
        setShowSuccess(true)
        toast.success("Application submitted!", {
          description: "Your application has been submitted for review.",
        })
      } else {
        const data = await submitRes.json()
        toast.error("Submission failed", {
          description: data.error || "Please check all required fields and try again.",
        })
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("Submission failed", {
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Apply Template ──────────────────────────────────────────────

  const handleApplyTemplate = (template: ApplicationTemplate) => {
    setFormData((prev) => ({
      ...prev,
      personal_statement: template.personal_statement || prev.personal_statement,
      study_plan: template.study_plan || prev.study_plan,
    }))
    setShowTemplatesDialog(false)
    toast.success("Template applied", { description: "Your essays have been pre-filled from the template." })
  }

  // ─── Loading State ───────────────────────────────────────────────

  if (fetchingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profile && profile.profileCompletion < 80) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile First</CardTitle>
            <CardDescription>
              You need to complete at least 80% of your profile before creating an application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Profile Completion</span>
                <span>{profile.profileCompletion}%</span>
              </div>
              <Progress value={profile.profileCompletion} className="h-2" />
            </div>
            <Button asChild className="w-full">
              <a href="/student-v2/profile">Complete Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Step Progress ───────────────────────────────────────────────

  const progressPercent = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)

  const renderStepProgress = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
        {applicationId && <AutosaveStatus {...autosave} />}
      </div>
      <Progress value={progressPercent} className="h-2" />
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEP_CONFIG.map((cfg, i) => {
          const s = i + 1
          const Icon = cfg.icon
          const isCompleted = s < step
          const isCurrent = s === step
          return (
            <React.Fragment key={s}>
              <button
                onClick={() => isCompleted && setStep(s)}
                className={`flex items-center gap-1.5 whitespace-nowrap ${
                  isCompleted ? "cursor-pointer" : isCurrent ? "cursor-default" : "cursor-default opacity-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <IconCheck className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={`text-xs hidden sm:inline ${
                    isCompleted || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {cfg.label}
                </span>
              </button>
              {s < TOTAL_STEPS && <div className="w-3 h-px bg-muted flex-shrink-0" />}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  // ─── Shared Footer ───────────────────────────────────────────────

  const renderStepFooter = ({
    showSaveDraft = true,
    showSubmit = false,
  }: { showSaveDraft?: boolean; showSubmit?: boolean } = {}) => (
    <div className="flex items-center justify-between pt-6">
      <Button variant="outline" onClick={() => step > 1 && setStep((s) => s - 1)} disabled={step === 1}>
        <IconArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        {showSaveDraft && applicationId && (
          <Button variant="ghost" onClick={handleSaveAsDraft} disabled={isCreatingDraft}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        )}
        {showSubmit ? (
          <Button onClick={handleSubmit} disabled={isSubmitting || isCreatingDraft}>
            {isSubmitting ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        ) : (
          <Button onClick={handleContinue} disabled={isCreatingDraft}>
            {isCreatingDraft ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Draft...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        )}
      </div>
    </div>
  )

  // ─── Step 1: Program + Intake ────────────────────────────────────

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSchool className="h-5 w-5" />
          Select Program & Intake
        </CardTitle>
        <CardDescription>Choose the program you want to apply for and your preferred intake period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Program <span className="text-destructive">*</span>
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label="Select a program"
                className={`w-full justify-between h-auto min-h-11 px-3 ${validationErrors.program_id ? "border-destructive" : ""}`}
              >
                {selectedProgram ? (
                  <div className="flex items-center gap-3">
                    {selectedProgram.universities?.logo_url ? (
                      <img
                        src={selectedProgram.universities.logo_url}
                        alt={selectedProgram.universities.name_en}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconSchool className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium">{selectedProgram.name_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProgram.universities?.name_en} • {selectedProgram.degree_type}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Search programs by name, university, or discipline...</span>
                )}
                <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="start" sideOffset={4}>
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type to search programs..."
                  value={searchQuery}
                  onValueChange={(value) => setSearchQuery(value)}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchingPrograms ? (
                      <div className="flex items-center justify-center py-6">
                        <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                        Searching...
                      </div>
                    ) : searchQuery.trim() ? (
                      "No programs found."
                    ) : (
                      "Start typing to search..."
                    )}
                  </CommandEmpty>
                  {programs.length > 0 && (
                    <CommandGroup>
                      {programs.map((program) => (
                        <CommandItem key={program.id} value={program.id} onSelect={() => selectProgram(program)} className="cursor-pointer">
                          <div className="flex items-center gap-3 w-full py-1">
                            {program.universities?.logo_url ? (
                              <img
                                src={program.universities.logo_url}
                                alt={program.universities.name_en}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconSchool className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{program.name_en}</p>
                              <p className="text-xs text-muted-foreground">
                                {program.universities?.name_en} • {program.degree_type} • {program.discipline}
                              </p>
                            </div>
                            {selectedProgram?.id === program.id && <IconCheck className="h-4 w-4 text-primary shrink-0" />}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {validationErrors.program_id && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <IconAlertCircle className="h-3.5 w-3.5" />
              {validationErrors.program_id}
            </p>
          )}
        </div>

        {/* Selected Program Card */}
        {selectedProgram && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
            {selectedProgram.universities?.logo_url ? (
              <img
                src={selectedProgram.universities.logo_url}
                alt={selectedProgram.universities.name_en}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconSchool className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{selectedProgram.name_en}</p>
              <p className="text-sm text-muted-foreground">
                {selectedProgram.universities?.name_en} • {selectedProgram.degree_type} • {selectedProgram.discipline}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProgram(null)
                setFormData((prev) => ({ ...prev, program_id: "", university_id: "" }))
              }}
            >
              <IconX className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Duplicate Warning */}
        {selectedProgram && (
          <DuplicateApplicationWarning
            programId={selectedProgram.id}
            universityId={selectedProgram.universities?.id}
            intake={formData.intake}
          />
        )}

        {/* Intake Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <IconCalendar className="h-4 w-4" />
              Preferred Intake <span className="text-destructive">*</span>
            </span>
          </Label>
          <Select value={formData.intake} onValueChange={(v) => updateField("intake", v)}>
            <SelectTrigger className={validationErrors.intake ? "border-destructive" : ""}>
              <SelectValue placeholder="Select intake period" />
            </SelectTrigger>
            <SelectContent>
              {generateIntakeOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.intake && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <IconAlertCircle className="h-3.5 w-3.5" />
              {validationErrors.intake}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Choose when you would like to start your studies.</p>
        </div>

        {!selectedProgram && (
          <div className="text-center py-6 text-muted-foreground">
            <IconSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Search and select a program above to get started</p>
          </div>
        )}

        {renderStepFooter({ showSaveDraft: false })}
      </CardContent>
    </Card>
  )

  // ─── Step 2: Personal Info ───────────────────────────────────────

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>Review and confirm your personal details (auto-filled from your profile)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <IconEdit className="h-4 w-4 flex-shrink-0" />
          <span>This information is pre-filled from your profile. You can edit your profile to update these details permanently.</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={formData.full_name} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Chinese Name (中文名)</Label>
            <Input value={formData.chinese_name} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={formData.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={formData.phone} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Nationality</Label>
            <Input value={formData.nationality} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input value={formData.date_of_birth} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Input value={formData.gender} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Current Address</Label>
            <Input value={formData.current_address} disabled className="bg-muted" />
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3">Emergency Contact</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={formData.emergency_contact_name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={formData.emergency_contact_phone} disabled className="bg-muted" />
            </div>
          </div>
        </div>

        {renderStepFooter()}
      </CardContent>
    </Card>
  )

  // ─── Step 3: Academic Background ─────────────────────────────────

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSchool className="h-5 w-5" />
          Academic Background
        </CardTitle>
        <CardDescription>Your education history and work experience (from your profile)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Education History</h4>
          {formData.education_history.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50">
              No education history. Please update your profile first.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.education_history.map((entry, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="font-medium text-sm">{entry.institution || "Unknown Institution"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.degree} in {entry.field_of_study} • {entry.start_date} - {entry.end_date || "Current"} • GPA:{" "}
                    {entry.gpa || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3">Work Experience</h4>
          {formData.work_experience.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50">No work experience added.</p>
          ) : (
            <div className="space-y-3">
              {formData.work_experience.map((entry, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="font-medium text-sm">
                    {entry.position || "Position"} at {entry.company || "Company"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.start_date} - {entry.end_date || "Current"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {renderStepFooter()}
      </CardContent>
    </Card>
  )

  // ─── Step 4: Language Proficiency ────────────────────────────────

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconLanguage className="h-5 w-5" />
          Language Proficiency
        </CardTitle>
        <CardDescription>Your language test scores and proficiency levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Chinese Proficiency (HSK)</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>HSK Level</Label>
              <Select value={formData.hsk_level} onValueChange={(v) => updateField("hsk_level", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select HSK level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No HSK</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      HSK {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HSK Score</Label>
              <Input
                type="number"
                value={formData.hsk_score}
                onChange={(e) => updateField("hsk_score", e.target.value)}
                placeholder="e.g., 210"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Upload your HSK certificate in Step 6 (Documents).</p>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3">English Proficiency</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>IELTS Score</Label>
              <Input
                value={formData.ielts_score}
                onChange={(e) => updateField("ielts_score", e.target.value)}
                placeholder="e.g., 7.5"
              />
            </div>
            <div className="space-y-2">
              <Label>TOEFL Score</Label>
              <Input
                type="number"
                value={formData.toefl_score}
                onChange={(e) => updateField("toefl_score", e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3">Other Languages</h4>
          <Textarea
            value={formData.other_languages}
            onChange={(e) => updateField("other_languages", e.target.value)}
            placeholder="List any other languages you speak and your proficiency level"
            rows={2}
          />
        </div>

        {renderStepFooter()}
      </CardContent>
    </Card>
  )

  // ─── Step 5: Personal Statement & Study Plan ─────────────────────

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              Personal Statement & Study Plan
            </CardTitle>
            <CardDescription>
              Write your personal statement and study plan. These are required for submission.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowTemplatesDialog(true)}>
            <IconStar className="h-3.5 w-3.5 mr-1.5" />
            Use Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Statement */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Personal Statement <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={formData.personal_statement}
            onChange={(e) => updateField("personal_statement", e.target.value)}
            placeholder="Describe your motivation for applying, your academic background, relevant experiences, and your future goals. A strong personal statement typically includes:&#10;&#10;1. Your motivation for choosing this program and university&#10;2. Relevant academic and professional experiences&#10;3. Your research interests and career objectives&#10;4. What makes you a strong candidate"
            rows={10}
            className={`resize-y ${validationErrors.personal_statement ? "border-destructive" : ""}`}
          />
          <div className="flex items-center justify-between">
            {validationErrors.personal_statement ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validationErrors.personal_statement}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Minimum 100 characters. Be specific and personal.</p>
            )}
            <span className="text-xs text-muted-foreground">{formData.personal_statement.length} characters</span>
          </div>
        </div>

        <Separator />

        {/* Study Plan */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Study Plan <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={formData.study_plan}
            onChange={(e) => updateField("study_plan", e.target.value)}
            placeholder="Outline your proposed study plan, including:&#10;&#10;1. Your planned courses and research direction&#10;2. Timeline and milestones for your studies&#10;3. How this program aligns with your career goals&#10;4. Any specific professors, labs, or resources you wish to access"
            rows={10}
            className={`resize-y ${validationErrors.study_plan ? "border-destructive" : ""}`}
          />
          <div className="flex items-center justify-between">
            {validationErrors.study_plan ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validationErrors.study_plan}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Minimum 100 characters. Detail your academic plan.</p>
            )}
            <span className="text-xs text-muted-foreground">{formData.study_plan.length} characters</span>
          </div>
        </div>

        {renderStepFooter()}
      </CardContent>
    </Card>
  )

  // ─── Step 6: Documents ───────────────────────────────────────────

  const renderStep6 = () => {
    const requiredDocs = docChecklist.filter((d) => d.is_required)
    const optionalDocs = docChecklist.filter((d) => !d.is_required)
    const hasDynamicList = docChecklist.length > 0

    // Fallback static list
    const staticDocTypes = [
      { type: "passport_copy", label: "Passport Copy", required: true },
      { type: "academic_certificate", label: "Academic Certificates (Notarized)", required: true },
      { type: "academic_transcript", label: "Academic Transcripts (Notarized)", required: true },
      { type: "personal_statement_doc", label: "Personal Statement", required: true },
      { type: "study_plan_doc", label: "Study Plan", required: true },
      { type: "recommendation_letter_1", label: "Recommendation Letter 1", required: true },
      { type: "recommendation_letter_2", label: "Recommendation Letter 2", required: true },
      { type: "cv_resume", label: "CV / Resume", required: true },
      { type: "passport_photo", label: "Passport-size Photos", required: true },
      { type: "health_exam", label: "Health Examination Form", required: true },
      { type: "non_criminal_record", label: "Non-criminal Record", required: true },
      { type: "hsk_certificate", label: "HSK Certificate", required: false },
      { type: "ielts_toefl_report", label: "IELTS/TOEFL Score Report", required: false },
      { type: "bank_statement", label: "Bank Statement", required: false },
      { type: "sponsor_letter", label: "Sponsor Letter", required: false },
    ]

    const renderDocItem = (docType: string, label: string, required: boolean, description?: string) => (
      <div key={docType} className="flex items-center gap-3 p-3 rounded-lg border">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {uploadingDocs[docType] ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground max-w-32 truncate">{uploadingDocs[docType].name}</span>
            <IconCheck className="h-4 w-4 text-green-600" />
            <Button variant="ghost" size="sm" onClick={() => removeFile(docType)} className="text-destructive h-6 w-6 p-0">
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <span className="text-xs text-primary hover:underline">Choose file</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(docType, e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        )}
      </div>
    )

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileUpload className="h-5 w-5" />
            Program Documents
          </CardTitle>
          <CardDescription>
            Upload required documents for your {selectedProgram?.degree_type || ""} application
            {selectedProgram && (
              <span className="text-xs ml-1">
                ({docChecklist.length} documents required for {selectedProgram.degree_type} programs)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading document checklist...</span>
            </div>
          ) : (
            <>
              {/* Required Documents */}
              <div className="space-y-3">
                <h4 className="font-medium">Required Documents</h4>
                {hasDynamicList
                  ? requiredDocs.map((doc) => renderDocItem(doc.document_type, doc.label_en, doc.is_required, doc.description))
                  : staticDocTypes
                      .filter((d) => d.required)
                      .map((doc) => renderDocItem(doc.type, doc.label, doc.required))}
              </div>

              <Separator />

              {/* Optional Documents */}
              <div className="space-y-3">
                <h4 className="font-medium">Additional Documents (Optional)</h4>
                {hasDynamicList
                  ? optionalDocs.map((doc) => renderDocItem(doc.document_type, doc.label_en, doc.is_required, doc.description))
                  : staticDocTypes
                      .filter((d) => !d.required)
                      .map((doc) => renderDocItem(doc.type, doc.label, doc.required))}
              </div>
            </>
          )}

          <p className="text-sm text-muted-foreground">
            Accepted formats: PDF, JPG, PNG. You can also upload documents later from the application details page.
          </p>

          {renderStepFooter()}
        </CardContent>
      </Card>
    )
  }

  // ─── Step 7: Additional Information ──────────────────────────────

  const renderStep7 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>Extracurricular activities, awards, publications, research, scholarship, and financial details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Extracurricular */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconStar className="h-4 w-4" />
              Extracurricular Activities
            </h4>
            <Button variant="outline" size="sm" onClick={addExtracurricular}>
              <IconPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {formData.extracurricular_activities.map((entry, i) => (
            <div key={i} className="border rounded-lg p-3 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Activity #{i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeExtracurricular(i)} className="text-destructive h-6 w-6 p-0">
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.activity} onChange={(e) => updateExtracurricular(i, "activity", e.target.value)} placeholder="Activity name" />
                <Input value={entry.role || ""} onChange={(e) => updateExtracurricular(i, "role", e.target.value)} placeholder="Role/Position" />
                <Input value={entry.organization || ""} onChange={(e) => updateExtracurricular(i, "organization", e.target.value)} placeholder="Organization" />
                <Input type="month" value={entry.start_date} onChange={(e) => updateExtracurricular(i, "start_date", e.target.value)} />
              </div>
            </div>
          ))}
          {formData.extracurricular_activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No activities added. Click &quot;Add&quot; to include.</p>
          )}
        </div>

        <Separator />

        {/* Awards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconTrophy className="h-4 w-4" />
              Awards & Achievements
            </h4>
            <Button variant="outline" size="sm" onClick={addAward}>
              <IconPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {formData.awards.map((entry, i) => (
            <div key={i} className="border rounded-lg p-3 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Award #{i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeAward(i)} className="text-destructive h-6 w-6 p-0">
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.title} onChange={(e) => updateAward(i, "title", e.target.value)} placeholder="Award title" />
                <Input value={entry.issuing_organization || ""} onChange={(e) => updateAward(i, "issuing_organization", e.target.value)} placeholder="Issuing organization" />
              </div>
            </div>
          ))}
          {formData.awards.length === 0 && <p className="text-sm text-muted-foreground">No awards added. Click &quot;Add&quot; to include.</p>}
        </div>

        <Separator />

        {/* Publications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconFileText className="h-4 w-4" />
              Publications
            </h4>
            <Button variant="outline" size="sm" onClick={addPublication}>
              <IconPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {formData.publications.map((entry, i) => (
            <div key={i} className="border rounded-lg p-3 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Publication #{i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removePublication(i)} className="text-destructive h-6 w-6 p-0">
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.title} onChange={(e) => updatePublication(i, "title", e.target.value)} placeholder="Publication title" />
                <Input value={entry.publisher || ""} onChange={(e) => updatePublication(i, "publisher", e.target.value)} placeholder="Publisher/Journal" />
              </div>
            </div>
          ))}
          {formData.publications.length === 0 && <p className="text-sm text-muted-foreground">No publications added.</p>}
        </div>

        <Separator />

        {/* Research Experience */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconFlask className="h-4 w-4" />
              Research Experience
            </h4>
            <Button variant="outline" size="sm" onClick={addResearch}>
              <IconPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {formData.research_experience.map((entry, i) => (
            <div key={i} className="border rounded-lg p-3 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Research #{i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeResearch(i)} className="text-destructive h-6 w-6 p-0">
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={entry.topic} onChange={(e) => updateResearch(i, "topic", e.target.value)} placeholder="Research topic" />
                <Input value={entry.institution || ""} onChange={(e) => updateResearch(i, "institution", e.target.value)} placeholder="Institution/Lab" />
              </div>
            </div>
          ))}
          {formData.research_experience.length === 0 && <p className="text-sm text-muted-foreground">No research experience added.</p>}
        </div>

        <Separator />

        {/* Scholarship & Financial */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconCurrencyDollar className="h-4 w-4" />
              Scholarship
            </h4>
            <Select value={formData.scholarship_application.type || ""} onValueChange={(v) => updateScholarship("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Scholarship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csc">CSC Scholarship</SelectItem>
                <SelectItem value="university">University Scholarship</SelectItem>
                <SelectItem value="provincial">Provincial Scholarship</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="none">Not Applying</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <IconCurrencyDollar className="h-4 w-4" />
              Financial Guarantee
            </h4>
            <Input
              value={formData.financial_guarantee.guarantor_name || ""}
              onChange={(e) => updateFinancial("guarantor_name", e.target.value)}
              placeholder="Guarantor name"
            />
          </div>
        </div>

        {renderStepFooter()}
      </CardContent>
    </Card>
  )

  // ─── Step 8: Review & Submit ─────────────────────────────────────

  const renderStep8 = () => {
    const missingFields: string[] = []
    if (!formData.personal_statement.trim()) missingFields.push("Personal Statement")
    if (!formData.study_plan.trim()) missingFields.push("Study Plan")
    if (!formData.intake) missingFields.push("Intake")

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCircleCheck className="h-5 w-5" />
            Review & Submit
          </CardTitle>
          <CardDescription>Please review your application before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Warnings */}
          {missingFields.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
              <IconAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Missing required fields:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">Please go back and complete these fields before submitting.</p>
              </div>
            </div>
          )}

          {/* Program */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Program</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            {selectedProgram && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedProgram.name_en}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProgram.universities?.name_en} • {selectedProgram.degree_type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Intake: {formData.intake || "Not selected"}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Personal Info Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Personal Information</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p>
                {formData.full_name} {formData.chinese_name && `(${formData.chinese_name})`}
              </p>
              <p className="text-muted-foreground">
                {formData.nationality} • {formData.gender} • {formData.date_of_birth}
              </p>
              <p className="text-muted-foreground">
                {formData.email} • {formData.phone}
              </p>
            </div>
          </div>

          <Separator />

          {/* Academic Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Academic Background</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              {formData.education_history.length > 0 ? (
                <p>
                  {formData.education_history[0].degree} in {formData.education_history[0].field_of_study} from{" "}
                  {formData.education_history[0].institution} (GPA: {formData.education_history[0].gpa || "N/A"})
                </p>
              ) : (
                <p className="text-muted-foreground">No education history</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Language Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Language Proficiency</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(4)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p>
                HSK:{" "}
                {formData.hsk_level && formData.hsk_level !== "0"
                  ? `Level ${formData.hsk_level} (Score: ${formData.hsk_score || "N/A"})`
                  : "Not taken"}
              </p>
              <p>
                English:{" "}
                {formData.ielts_score
                  ? `IELTS ${formData.ielts_score}`
                  : formData.toefl_score
                    ? `TOEFL ${formData.toefl_score}`
                    : "Not provided"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Essays Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Personal Statement & Study Plan</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(5)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Personal Statement ({formData.personal_statement.length} chars)</Label>
                <p className="text-sm p-2 rounded bg-muted/50 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {formData.personal_statement || "No personal statement provided"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Study Plan ({formData.study_plan.length} chars)</Label>
                <p className="text-sm p-2 rounded bg-muted/50 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {formData.study_plan || "No study plan provided"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Documents Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Documents</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(6)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>{Object.keys(uploadingDocs).length} document(s) selected for upload</p>
              {Object.keys(uploadingDocs).length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {Object.entries(uploadingDocs).map(([type, file]) => (
                    <p key={type} className="text-xs text-muted-foreground">
                      • {type}: {file.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Info Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Additional Information</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(7)} className="text-primary">
                <IconEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p>Activities: {formData.extracurricular_activities.length}</p>
              <p>Awards: {formData.awards.length}</p>
              <p>Publications: {formData.publications.length}</p>
              <p>Research: {formData.research_experience.length}</p>
              <p>Scholarship: {formData.scholarship_application.type || "Not specified"}</p>
            </div>
          </div>

          {renderStepFooter({ showSubmit: true })}
        </CardContent>
      </Card>
    )
  }

  // ─── Success Dialog ──────────────────────────────────────────────

  const renderSuccessDialog = () => (
    <Dialog open={showSuccess} onOpenChange={(open) => !open && router.push("/student-v2/applications")}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <IconCircleCheck className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Application Submitted!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your application has been submitted successfully and is now under review. You will receive a notification when there are updates.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {submittedAppId && (
            <Button onClick={() => router.push(`/student-v2/applications/${submittedAppId}`)} className="w-full">
              View Application
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push("/student-v2/applications")} className="w-full">
            Go to Applications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Application</h1>
        <p className="text-muted-foreground">Create a new university application</p>
      </div>

      {/* Progress */}
      {renderStepProgress()}

      <Separator />

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
      {step === 7 && renderStep7()}
      {step === 8 && renderStep8()}

      {/* Template Selection Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
            <DialogDescription>Choose a template to pre-fill your personal statement and study plan</DialogDescription>
          </DialogHeader>
          <TemplateManager onSelectTemplate={handleApplyTemplate} showSelectButton={true} />
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      {renderSuccessDialog()}
    </div>
  )
}
