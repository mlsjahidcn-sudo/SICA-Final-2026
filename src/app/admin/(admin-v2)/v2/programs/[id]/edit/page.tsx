"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconDeviceFloppy,
  IconSchool,
  IconBook,
  IconCurrencyDollar,
  IconLanguage,
  IconFileText,
  IconStar,
  IconSearch,
  IconCheck,
  IconX,
  IconTrash,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconCircleCheck,
} from "@tabler/icons-react"
import { ProgramPreviewPanel } from "@/components/admin/program-preview-panel"
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator"
import { useAutoSave } from "@/hooks/use-auto-save"

// Constants
const DEGREE_LEVELS = [
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'language', label: 'Language Program' },
  { value: 'pre_university', label: 'Pre-University' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
]

const CATEGORIES = [
  'Engineering', 'Business', 'Medicine', 'Arts', 'Science',
  'Law', 'Education', 'Agriculture', 'Economics', 'Management',
  'Computer Science', 'Architecture', 'Philosophy', 'Literature',
  'History', 'Languages', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
]

const SCHOLARSHIP_TYPES = ['CSC', 'University', 'Provincial', 'Local Government']
const APPLICATION_DOCUMENTS = [
  'Passport', 'Transcript', 'Degree Certificate', 'Recommendation Letter',
  'Study Plan', 'CV/Resume', 'Language Certificate', 'Photo',
  'Health Certificate', 'Bank Statement', 'Police Clearance',
]
const TEACHING_LANGUAGES = ['Chinese', 'English', 'French', 'German', 'Japanese', 'Korean', 'Russian']
const CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP']
const START_MONTHS = [
  { value: 'September', label: 'September (Fall)' },
  { value: 'March', label: 'March (Spring)' },
  { value: 'February', label: 'February' },
  { value: 'Rolling', label: 'Rolling Admission' },
]

// Step configuration
const STEPS = [
  {
    id: 1,
    title: 'Basic Info',
    description: 'Program details and university',
    icon: IconSchool,
    fields: ['university_id', 'name_en', 'degree_level'],
  },
  {
    id: 2,
    title: 'Requirements',
    description: 'Language and academic requirements',
    icon: IconLanguage,
    fields: [],
  },
  {
    id: 3,
    title: 'Schedule',
    description: 'Duration and enrollment',
    icon: IconFileText,
    fields: [],
  },
  {
    id: 4,
    title: 'Fees',
    description: 'Tuition and scholarship',
    icon: IconCurrencyDollar,
    fields: [],
  },
  {
    id: 5,
    title: 'Settings',
    description: 'Documents and visibility',
    icon: IconStar,
    fields: [],
  },
]

interface University {
  id: string
  name_en: string
  name_cn: string | null
  city: string
  province: string
}

interface ProgramFormData {
  university_id: string
  name_en: string
  name_cn: string
  code: string
  description: string
  degree_level: string
  category: string
  sub_category: string
  duration_years: string
  duration_months: string
  start_month: string
  teaching_languages: string[]
  language_requirement: string
  min_gpa: string
  entrance_exam_required: boolean
  entrance_exam_details: string
  tuition_per_year: string
  tuition_currency: string
  application_fee: string
  application_fee_currency: string
  scholarship_available: boolean
  scholarship_types: string[]
  scholarship_details: string
  application_documents: string[]
  application_requirements: string
  capacity: string
  is_featured: boolean
  tags: string[]
  newTag: string
}

interface StepErrors {
  [key: string]: string
}

export default function EditProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true)
  const [universitySearch, setUniversitySearch] = useState('')
  const [showUniversityDialog, setShowUniversityDialog] = useState(false)
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [programViewCount, setProgramViewCount] = useState(0)
  const [stepErrors, setStepErrors] = useState<StepErrors>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showPreview, setShowPreview] = useState(true)

  const [formData, setFormData] = useState<ProgramFormData>({
    university_id: '',
    name_en: '',
    name_cn: '',
    code: '',
    description: '',
    degree_level: '',
    category: '',
    sub_category: '',
    duration_years: '',
    duration_months: '',
    start_month: '',
    teaching_languages: [],
    language_requirement: '',
    min_gpa: '',
    entrance_exam_required: false,
    entrance_exam_details: '',
    tuition_per_year: '',
    tuition_currency: 'CNY',
    application_fee: '',
    application_fee_currency: 'CNY',
    scholarship_available: false,
    scholarship_types: [],
    scholarship_details: '',
    application_documents: [],
    application_requirements: '',
    capacity: '',
    is_featured: false,
    tags: [],
    newTag: '',
  })

  // Auto-save hook (using programId for unique storage key)
  const autoSaveDraftKey = `admin_program_edit_${programId}`
  const {
    status: autoSaveStatus,
    lastSaved,
    clearDraft,
  } = useAutoSave({
    data: formData,
    storageKey: autoSaveDraftKey,
    debounceMs: 3000,
    enabled: !isLoading && !!user?.role && user.role === 'admin',
  })

  const fetchProgram = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${programId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const p = data.program
        setFormData({
          university_id: p.university_id || '',
          name_en: p.name_en || '',
          name_cn: p.name_cn || '',
          code: p.code || '',
          description: p.description || '',
          degree_level: p.degree_level || p.degree_type || '',
          category: p.category || p.discipline || '',
          sub_category: p.sub_category || p.major || '',
          duration_years: p.duration_years ? p.duration_years.toString() : '',
          duration_months: p.duration_months ? p.duration_months.toString() : '',
          start_month: p.start_month || '',
          teaching_languages: p.teaching_languages || [],
          language_requirement: p.language_requirement || '',
          min_gpa: p.min_gpa?.toString() || '',
          entrance_exam_required: p.entrance_exam_required || false,
          entrance_exam_details: p.entrance_exam_details || '',
          tuition_per_year: p.tuition_per_year?.toString() || '',
          tuition_currency: p.tuition_currency || 'CNY',
          application_fee: p.application_fee?.toString() || '',
          application_fee_currency: p.application_fee_currency || 'CNY',
          scholarship_available: p.scholarship_available || false,
          scholarship_types: p.scholarship_types || [],
          scholarship_details: p.scholarship_details || '',
          application_documents: p.application_documents || [],
          application_requirements: p.application_requirements || '',
          capacity: p.capacity?.toString() || '',
          is_featured: p.is_featured || false,
          tags: p.tags || [],
          newTag: '',
        })
        setProgramViewCount(p.view_count || 0)
        
        // Set selected university
        if (p.universities) {
          setSelectedUniversity({
            id: p.university_id,
            name_en: p.universities.name_en,
            name_cn: p.universities.name_cn,
            city: p.universities.city || '',
            province: p.universities.province || '',
          })
        }

        // Mark all steps as completed for existing program
        setCompletedSteps([1, 2, 3, 4, 5])
      } else {
        toast.error('Failed to load program')
        router.push('/admin/v2/programs')
      }
    } catch {
      toast.error('Failed to load program')
      router.push('/admin/v2/programs')
    } finally {
      setIsLoading(false)
    }
  }, [programId, router])

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch('/api/admin/universities?limit=200', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUniversities(data.universities || [])
      }
    } catch {
      toast.error('Failed to load universities')
    } finally {
      setIsLoadingUniversities(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'admin' && programId) {
      fetchProgram()
      fetchUniversities()
    }
  }, [user, programId, fetchProgram])

  const handleChange = (field: keyof ProgramFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const toggleArrayItem = (field: 'teaching_languages' | 'scholarship_types' | 'application_documents', item: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }))
  }

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: '',
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const selectUniversity = (uni: University) => {
    setSelectedUniversity(uni)
    setFormData((prev) => ({ ...prev, university_id: uni.id }))
    setShowUniversityDialog(false)
    setUniversitySearch('')
    if (stepErrors['university_id']) {
      setStepErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors['university_id']
        return newErrors
      })
    }
  }

  const filteredUniversities = universities.filter(uni =>
    uni.name_en.toLowerCase().includes(universitySearch.toLowerCase()) ||
    (uni.name_cn && uni.name_cn.includes(universitySearch))
  )

  const validateStep = (step: number): boolean => {
    const errors: StepErrors = {}
    
    switch (step) {
      case 1:
        if (!formData.university_id) errors['university_id'] = 'University is required'
        if (!formData.name_en.trim()) errors['name_en'] = 'Program name is required'
        if (!formData.degree_level) errors['degree_level'] = 'Degree level is required'
        break
    }
    
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleStepClick = (step: number) => {
    if (completedSteps.includes(step) || step <= currentStep || step === currentStep + 1) {
      if (step > currentStep) {
        if (validateStep(currentStep)) {
          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep])
          }
          setCurrentStep(step)
        }
      } else {
        setCurrentStep(step)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration_years: formData.duration_years ? parseFloat(formData.duration_years) : null,
          duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
          min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
          tuition_per_year: formData.tuition_per_year ? parseFloat(formData.tuition_per_year) : null,
          application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (response.ok) {
        clearDraft() // Clear draft on successful save
        toast.success('Program updated successfully')
        router.push('/admin/v2/programs')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update program')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Program archived successfully')
        router.push('/admin/v2/programs')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to archive program')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  const handleDuplicate = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${programId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Program duplicated successfully')
        router.push(`/admin/v2/programs/${data.program.id}/edit`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to duplicate program')
      }
    } catch {
      toast.error('An error occurred')
    }
  }

  if (authLoading || !user || user.role !== 'admin' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <IconLoader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Edit Program" />
          <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/v2/programs">
                  <Button variant="ghost" size="sm">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Programs
                  </Button>
                </Link>
                <AutoSaveIndicator 
                  status={autoSaveStatus} 
                  lastSaved={lastSaved}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={showPreview ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  {showPreview ? (
                    <>
                      <IconEyeOff className="h-4 w-4" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <IconEye className="h-4 w-4" />
                      Show Preview
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <IconCopy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/programs/${programId}`} target="_blank">
                    <IconEye className="h-4 w-4 mr-2" />
                    Full Page
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <IconTrash className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <IconBook className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Edit Program</h1>
                <p className="text-muted-foreground">
                  {formData.name_en || 'Loading...'}
                  {programViewCount > 0 && (
                    <span className="ml-2">• {programViewCount.toLocaleString()} views</span>
                  )}
                </p>
              </div>
            </div>

            {/* Step Progress Indicator */}
            <Card className="overflow-hidden">
              <div className="p-1">
                <div className="flex items-center justify-between mb-4">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = currentStep === step.id
                    const isCompleted = completedSteps.includes(step.id)
                    const isClickable = completedSteps.includes(step.id) || step.id <= currentStep + 1
                    
                    return (
                      <React.Fragment key={step.id}>
                        <button
                          type="button"
                          onClick={() => handleStepClick(step.id)}
                          disabled={!isClickable}
                          className={cn(
                            "flex flex-col items-center gap-1 transition-all duration-200 p-2 rounded-lg",
                            isActive && "bg-primary/10",
                            isClickable && "cursor-pointer hover:bg-muted/50",
                            !isClickable && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                            isCompleted && "bg-primary border-primary text-primary-foreground",
                            isActive && !isCompleted && "border-primary text-primary",
                            !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <IconCircleCheck className="h-5 w-5" />
                            ) : (
                              <StepIcon className="h-5 w-5" />
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-medium hidden sm:block",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step.title}
                          </span>
                        </button>
                        {index < STEPS.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-2 transition-colors",
                            completedSteps.includes(step.id) ? "bg-primary" : "bg-muted"
                          )} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            </Card>

            {/* Main Content - Form + Preview */}
            <div className={cn(
              "flex gap-6 transition-all duration-300"
            )}>
              {/* Form Section */}
              <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                showPreview && "max-w-2xl"
              )}>
                {/* Form */}
                <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconSchool className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Essential program details and university association</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* University Selector */}
                    <div className="space-y-2">
                      <Label className={cn(stepErrors['university_id'] && "text-destructive")}>
                        University
                      </Label>
                      {selectedUniversity ? (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{selectedUniversity.name_en}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedUniversity.name_cn} • {selectedUniversity.city}, {selectedUniversity.province}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUniversityDialog(true)}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-muted-foreground",
                            stepErrors['university_id'] && "border-destructive"
                          )}
                          onClick={() => setShowUniversityDialog(true)}
                        >
                          <IconSearch className="h-4 w-4 mr-2" />
                          Select University
                        </Button>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name_en" className={cn(stepErrors['name_en'] && "text-destructive")}>
                          Program Name (English) *
                        </Label>
                        <Input
                          id="name_en"
                          value={formData.name_en}
                          onChange={(e) => handleChange('name_en', e.target.value)}
                          placeholder="e.g., Computer Science and Technology"
                          className={stepErrors['name_en'] && "border-destructive"}
                        />
                        {stepErrors['name_en'] && (
                          <p className="text-sm text-destructive">{stepErrors['name_en']}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name_cn">Program Name (Chinese)</Label>
                        <Input
                          id="name_cn"
                          value={formData.name_cn}
                          onChange={(e) => handleChange('name_cn', e.target.value)}
                          placeholder="例如：计算机科学与技术"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="code">Program Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => handleChange('code', e.target.value)}
                          placeholder="e.g., CS001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="degree_level" className={cn(stepErrors['degree_level'] && "text-destructive")}>
                          Degree Level *
                        </Label>
                        <Select
                          value={formData.degree_level}
                          onValueChange={(value) => handleChange('degree_level', value)}
                        >
                          <SelectTrigger className={stepErrors['degree_level'] && "border-destructive"}>
                            <SelectValue placeholder="Select degree" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEGREE_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stepErrors['degree_level'] && (
                          <p className="text-sm text-destructive">{stepErrors['degree_level']}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleChange('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sub_category">Major/Specialization</Label>
                        <Input
                          id="sub_category"
                          value={formData.sub_category}
                          onChange={(e) => handleChange('sub_category', e.target.value)}
                          placeholder="e.g., Artificial Intelligence"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Program Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={5}
                        placeholder="Describe the program, its objectives, and key features..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Academic Requirements */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconLanguage className="h-5 w-5" />
                      Language & Academic Requirements
                    </CardTitle>
                    <CardDescription>Set language proficiency and academic prerequisites</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Teaching Languages</Label>
                      <p className="text-sm text-muted-foreground">Select all languages used for instruction</p>
                      <div className="flex flex-wrap gap-2">
                        {TEACHING_LANGUAGES.map((lang) => (
                          <Badge
                            key={lang}
                            variant={formData.teaching_languages.includes(lang) ? 'default' : 'outline'}
                            className="cursor-pointer px-4 py-2 text-sm"
                            onClick={() => toggleArrayItem('teaching_languages', lang)}
                          >
                            {formData.teaching_languages.includes(lang) && (
                              <IconCheck className="h-3 w-3 mr-1" />
                            )}
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="language_requirement">Language Requirement</Label>
                        <Input
                          id="language_requirement"
                          value={formData.language_requirement}
                          onChange={(e) => handleChange('language_requirement', e.target.value)}
                          placeholder="e.g., HSK 4 or IELTS 6.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min_gpa">Minimum GPA</Label>
                        <Input
                          id="min_gpa"
                          type="number"
                          step="0.1"
                          min="0"
                          max="4"
                          value={formData.min_gpa}
                          onChange={(e) => handleChange('min_gpa', e.target.value)}
                          placeholder="e.g., 3.0"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="entrance_exam_required"
                          checked={formData.entrance_exam_required}
                          onCheckedChange={(checked) => handleChange('entrance_exam_required', checked as boolean)}
                        />
                        <Label htmlFor="entrance_exam_required" className="cursor-pointer">
                          Entrance Exam Required
                        </Label>
                      </div>

                      {formData.entrance_exam_required && (
                        <div className="space-y-2 pl-6 animate-in slide-in-from-top-2">
                          <Label htmlFor="entrance_exam_details">Exam Details</Label>
                          <Textarea
                            id="entrance_exam_details"
                            value={formData.entrance_exam_details}
                            onChange={(e) => handleChange('entrance_exam_details', e.target.value)}
                            rows={3}
                            placeholder="Describe the entrance exam format and requirements..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="application_requirements">Additional Requirements</Label>
                      <Textarea
                        id="application_requirements"
                        value={formData.application_requirements}
                        onChange={(e) => handleChange('application_requirements', e.target.value)}
                        rows={3}
                        placeholder="List any additional requirements..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Schedule */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconFileText className="h-5 w-5" />
                      Duration & Schedule
                    </CardTitle>
                    <CardDescription>Program duration and intake schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="duration_years">Duration (Years)</Label>
                        <Input
                          id="duration_years"
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={formData.duration_years}
                          onChange={(e) => handleChange('duration_years', e.target.value)}
                          placeholder="e.g., 4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration_months">Duration (Months)</Label>
                        <Input
                          id="duration_months"
                          type="number"
                          min="1"
                          value={formData.duration_months}
                          onChange={(e) => handleChange('duration_months', e.target.value)}
                          placeholder="e.g., 48"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start_month">Start Month</Label>
                        <Select
                          value={formData.start_month}
                          onValueChange={(value) => handleChange('start_month', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start" />
                          </SelectTrigger>
                          <SelectContent>
                            {START_MONTHS.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Enrollment Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          min="1"
                          value={formData.capacity}
                          onChange={(e) => handleChange('capacity', e.target.value)}
                          placeholder="e.g., 100"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Fees & Scholarship */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconCurrencyDollar className="h-5 w-5" />
                        Tuition & Fees
                      </CardTitle>
                      <CardDescription>Program costs and fee structure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="tuition_per_year">Tuition per Year</Label>
                          <Input
                            id="tuition_per_year"
                            type="number"
                            min="0"
                            value={formData.tuition_per_year}
                            onChange={(e) => handleChange('tuition_per_year', e.target.value)}
                            placeholder="e.g., 25000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tuition_currency">Currency</Label>
                          <Select
                            value={formData.tuition_currency}
                            onValueChange={(value) => handleChange('tuition_currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((cur) => (
                                <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="application_fee">Application Fee</Label>
                          <Input
                            id="application_fee"
                            type="number"
                            min="0"
                            value={formData.application_fee}
                            onChange={(e) => handleChange('application_fee', e.target.value)}
                            placeholder="e.g., 100"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconStar className="h-5 w-5" />
                        Scholarship
                      </CardTitle>
                      <CardDescription>Scholarship opportunities and financial aid</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="scholarship_available"
                          checked={formData.scholarship_available}
                          onCheckedChange={(checked) => handleChange('scholarship_available', checked as boolean)}
                        />
                        <Label htmlFor="scholarship_available" className="cursor-pointer">
                          Scholarship Available
                        </Label>
                      </div>

                      {formData.scholarship_available && (
                        <div className="space-y-4 pl-6 animate-in slide-in-from-top-2">
                          <div className="space-y-3">
                            <Label>Scholarship Types</Label>
                            <div className="flex flex-wrap gap-2">
                              {SCHOLARSHIP_TYPES.map((type) => (
                                <Badge
                                  key={type}
                                  variant={formData.scholarship_types.includes(type) ? 'default' : 'outline'}
                                  className="cursor-pointer px-4 py-2 text-sm"
                                  onClick={() => toggleArrayItem('scholarship_types', type)}
                                >
                                  {formData.scholarship_types.includes(type) && (
                                    <IconCheck className="h-3 w-3 mr-1" />
                                  )}
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scholarship_details">Scholarship Details</Label>
                            <Textarea
                              id="scholarship_details"
                              value={formData.scholarship_details}
                              onChange={(e) => handleChange('scholarship_details', e.target.value)}
                              rows={3}
                              placeholder="Describe scholarship coverage, eligibility, and benefits..."
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 5: Documents & Settings */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Application Documents</CardTitle>
                      <CardDescription>Select documents required for application</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Required Documents</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {APPLICATION_DOCUMENTS.map((doc) => (
                            <Badge
                              key={doc}
                              variant={formData.application_documents.includes(doc) ? 'default' : 'outline'}
                              className="cursor-pointer px-4 py-2 text-sm justify-center"
                              onClick={() => toggleArrayItem('application_documents', doc)}
                            >
                              {formData.application_documents.includes(doc) && (
                                <IconCheck className="h-3 w-3 mr-1" />
                              )}
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Program Settings</CardTitle>
                      <CardDescription>Visibility and promotional settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_featured"
                          checked={formData.is_featured}
                          onCheckedChange={(checked) => handleChange('is_featured', checked as boolean)}
                        />
                        <Label htmlFor="is_featured" className="cursor-pointer">
                          Featured Program
                        </Label>
                        <span className="text-xs text-muted-foreground">(Highlighted in listings)</span>
                      </div>

                      <div className="space-y-3">
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.newTag}
                            onChange={(e) => handleChange('newTag', e.target.value)}
                            placeholder="Add a tag..."
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                              {tag} <IconX className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Card */}
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Program Summary</CardTitle>
                      <CardDescription>Current program configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">University</p>
                          <p className="font-medium">{selectedUniversity?.name_en || 'Not selected'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Program Name</p>
                          <p className="font-medium">{formData.name_en || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Degree</p>
                          <p className="font-medium capitalize">{formData.degree_level || 'Not selected'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-medium">{formData.category || 'Not selected'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Languages</p>
                          <p className="font-medium">{formData.teaching_languages.join(', ') || 'None'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {formData.duration_years ? `${formData.duration_years} years` : 
                             formData.duration_months ? `${formData.duration_months} months` : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tuition</p>
                          <p className="font-medium">
                            {formData.tuition_per_year ? `${formData.tuition_currency} ${formData.tuition_per_year}/yr` : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Scholarship</p>
                          <p className="font-medium">{formData.scholarship_available ? 'Available' : 'Not available'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  <Link href="/admin/v2/programs">
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </Link>
                  
                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={handleNextStep}>
                      Next Step
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <IconDeviceFloppy className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <div className="w-[400px] shrink-0 sticky top-6 self-start">
                  <ProgramPreviewPanel
                    data={{
                      ...formData,
                      cover_image: '',
                      university: selectedUniversity ? {
                        id: selectedUniversity.id,
                        name_en: selectedUniversity.name_en,
                        name_cn: selectedUniversity.name_cn,
                        city: selectedUniversity.city,
                        province: selectedUniversity.province,
                        logo_url: null,
                      } : null,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* University Selector Dialog */}
      <Dialog open={showUniversityDialog} onOpenChange={setShowUniversityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select University</DialogTitle>
            <DialogDescription>
              Search and select the university for this program
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search universities..."
                value={universitySearch}
                onChange={(e) => setUniversitySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isLoadingUniversities ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUniversities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No universities found
                </div>
              ) : (
                filteredUniversities.map((uni) => (
                  <div
                    key={uni.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedUniversity?.id === uni.id && "bg-primary/5 border-primary"
                    )}
                    onClick={() => selectUniversity(uni)}
                  >
                    <div>
                      <div className="font-medium">{uni.name_en}</div>
                      <div className="text-sm text-muted-foreground">
                        {uni.name_cn} • {uni.city}, {uni.province}
                      </div>
                    </div>
                    {selectedUniversity?.id === uni.id && (
                      <IconCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this program? It will be hidden from public listings but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
