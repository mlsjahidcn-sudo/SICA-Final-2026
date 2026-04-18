"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconUser,
  IconId,
  IconSchool,
  IconLanguage,
  IconEPassport,
  IconUsers,
  IconStar,
  IconFileText,
  IconCheck,
  IconPlus,
  IconTrash,
  IconBriefcase,
  IconTrophy,
  IconFlask,
  IconCurrencyDollar,
  IconBrandWechat,
  IconPhone,
} from "@tabler/icons-react"

interface Student {
  id: string
  email: string | null
  full_name: string
  phone?: string | null
  is_active?: boolean
  nationality?: string
  date_of_birth?: string
  gender?: string
  current_address?: string
  postal_code?: string
  permanent_address?: string
  chinese_name?: string
  marital_status?: string
  religion?: string
  passport_number?: string
  passport_expiry_date?: string
  passport_issuing_country?: string
  wechat_id?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  highest_education?: string
  institution_name?: string
  field_of_study?: string
  graduation_date?: string
  gpa?: string
  education_history?: EducationHistoryEntry[]
  work_experience?: WorkExperienceEntry[]
  family_members?: FamilyMemberEntry[]
  extracurricular_activities?: ExtracurricularActivityEntry[]
  awards?: AwardEntry[]
  publications?: PublicationEntry[]
  research_experience?: ResearchExperienceEntry[]
  scholarship_application?: ScholarshipApplicationData
  financial_guarantee?: FinancialGuaranteeData
  study_mode?: string
  funding_source?: string
  hsk_level?: number | string
  hsk_score?: number | string
  ielts_score?: string
  toefl_score?: number | string
}

interface EducationHistoryEntry {
  institution?: string
  degree?: string
  field_of_study?: string
  start_date?: string
  end_date?: string
  gpa?: string
  city?: string
  country?: string
}

interface WorkExperienceEntry {
  company?: string
  position?: string
  start_date?: string
  end_date?: string
  description?: string
}

interface FamilyMemberEntry {
  name?: string
  relationship?: string
  occupation?: string
  phone?: string
  email?: string
  address?: string
}

interface ExtracurricularActivityEntry {
  activity?: string
  role?: string
  organization?: string
  start_date?: string
  end_date?: string
  description?: string
}

interface AwardEntry {
  title?: string
  issuing_organization?: string
  date?: string
  description?: string
}

interface PublicationEntry {
  title?: string
  publisher?: string
  publication_date?: string
  url?: string
  description?: string
}

interface ResearchExperienceEntry {
  topic?: string
  institution?: string
  supervisor?: string
  start_date?: string
  end_date?: string
  description?: string
}

interface ScholarshipApplicationData {
  type?: string
  name?: string
  coverage?: string
  status?: string
  notes?: string
}

interface FinancialGuaranteeData {
  guarantor_name?: string
  guarantor_relationship?: string
  guarantor_occupation?: string
  annual_income?: string
  income_currency?: string
}

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    is_active: true,
    nationality: "",
    date_of_birth: "",
    gender: "",
    current_address: "",
    postal_code: "",
    permanent_address: "",
    chinese_name: "",
    marital_status: "",
    religion: "",
    passport_number: "",
    passport_expiry_date: "",
    passport_issuing_country: "",
    wechat_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    highest_education: "",
    institution_name: "",
    field_of_study: "",
    graduation_date: "",
    gpa: "",
    hsk_level: "",
    hsk_score: "",
    ielts_score: "",
    toefl_score: "",
    education_history: [] as EducationHistoryEntry[],
    work_experience: [] as WorkExperienceEntry[],
    family_members: [] as FamilyMemberEntry[],
    extracurricular_activities: [] as ExtracurricularActivityEntry[],
    awards: [] as AwardEntry[],
    publications: [] as PublicationEntry[],
    research_experience: [] as ResearchExperienceEntry[],
    scholarship_application: {} as ScholarshipApplicationData,
    financial_guarantee: {} as FinancialGuaranteeData,
    study_mode: "",
    funding_source: "",
  })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (params.id) {
      fetchStudent()
    }
  }, [params.id])

  const fetchStudent = async () => {
    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch(`/api/admin/students/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch student')
      }

      const data = await response.json()
      const studentData = data.student || data
      setStudent(studentData)
      
      // Populate form data from flat response (students table fields at top level)
      setFormData({
        email: studentData.email || "",
        full_name: studentData.full_name || "",
        phone: studentData.phone || "",
        is_active: studentData.is_active ?? true,
        nationality: studentData.nationality || "",
        date_of_birth: studentData.date_of_birth || "",
        gender: studentData.gender || "",
        current_address: studentData.current_address || "",
        postal_code: studentData.postal_code || "",
        permanent_address: studentData.permanent_address || "",
        chinese_name: studentData.chinese_name || "",
        marital_status: studentData.marital_status || "",
        religion: studentData.religion || "",
        passport_number: studentData.passport_number || "",
        passport_expiry_date: studentData.passport_expiry_date || "",
        passport_issuing_country: studentData.passport_issuing_country || "",
        wechat_id: studentData.wechat_id || "",
        emergency_contact_name: studentData.emergency_contact_name || "",
        emergency_contact_phone: studentData.emergency_contact_phone || "",
        emergency_contact_relationship: studentData.emergency_contact_relationship || "",
        highest_education: studentData.highest_education || "",
        institution_name: studentData.institution_name || "",
        field_of_study: studentData.field_of_study || "",
        graduation_date: studentData.graduation_date || "",
        gpa: studentData.gpa || "",
        hsk_level: studentData.hsk_level != null ? String(studentData.hsk_level) : "",
        hsk_score: studentData.hsk_score != null ? String(studentData.hsk_score) : "",
        ielts_score: studentData.ielts_score || "",
        toefl_score: studentData.toefl_score != null ? String(studentData.toefl_score) : "",
        education_history: Array.isArray(studentData.education_history) ? studentData.education_history : [],
        work_experience: Array.isArray(studentData.work_experience) ? studentData.work_experience : [],
        family_members: Array.isArray(studentData.family_members) ? studentData.family_members : [],
        extracurricular_activities: Array.isArray(studentData.extracurricular_activities) ? studentData.extracurricular_activities : [],
        awards: Array.isArray(studentData.awards) ? studentData.awards : [],
        publications: Array.isArray(studentData.publications) ? studentData.publications : [],
        research_experience: Array.isArray(studentData.research_experience) ? studentData.research_experience : [],
        scholarship_application: (studentData.scholarship_application && typeof studentData.scholarship_application === 'object' && !Array.isArray(studentData.scholarship_application)) ? studentData.scholarship_application : {},
        financial_guarantee: (studentData.financial_guarantee && typeof studentData.financial_guarantee === 'object' && !Array.isArray(studentData.financial_guarantee)) ? studentData.financial_guarantee : {},
        study_mode: studentData.study_mode || "",
        funding_source: studentData.funding_source || "",
      })
    } catch (error) {
      console.error('Error fetching student:', error)
      toast.error('Failed to load student')
      router.push('/admin/v2/students')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addArrayItem = <T,>(field: keyof typeof formData, item: T) => {
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] as unknown[]), item] }))
  }

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({ ...prev, [field]: (prev[field] as unknown[]).filter((_, i) => i !== index) }))
  }

  const updateArrayItem = <T,>(field: keyof typeof formData, index: number, item: T) => {
    setFormData(prev => ({ ...prev, [field]: (prev[field] as T[]).map((existing, i) => i === index ? item : existing) }))
  }

  const updateObjectField = (field: 'scholarship_application' | 'financial_guarantee', key: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: { ...(prev[field] as Record<string, string>), [key]: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name) {
      toast.error("Full name is required")
      return
    }

    setIsSaving(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch(`/api/admin/students/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone || null,
          is_active: formData.is_active,
          nationality: formData.nationality || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          current_address: formData.current_address || null,
          postal_code: formData.postal_code || null,
          permanent_address: formData.permanent_address || null,
          chinese_name: formData.chinese_name || null,
          marital_status: formData.marital_status || null,
          religion: formData.religion || null,
          passport_number: formData.passport_number || null,
          passport_expiry_date: formData.passport_expiry_date || null,
          passport_issuing_country: formData.passport_issuing_country || null,
          wechat_id: formData.wechat_id || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relationship: formData.emergency_contact_relationship || null,
          highest_education: formData.highest_education || null,
          institution_name: formData.institution_name || null,
          field_of_study: formData.field_of_study || null,
          graduation_date: formData.graduation_date || null,
          gpa: formData.gpa || null,
          hsk_level: formData.hsk_level ? parseInt(formData.hsk_level) : null,
          hsk_score: formData.hsk_score ? parseInt(formData.hsk_score) : null,
          ielts_score: formData.ielts_score || null,
          toefl_score: formData.toefl_score ? parseInt(formData.toefl_score) : null,
          education_history: formData.education_history,
          work_experience: formData.work_experience,
          family_members: formData.family_members,
          extracurricular_activities: formData.extracurricular_activities,
          awards: formData.awards,
          publications: formData.publications,
          research_experience: formData.research_experience,
          scholarship_application: Object.keys(formData.scholarship_application).length > 0 ? formData.scholarship_application : null,
          financial_guarantee: Object.keys(formData.financial_guarantee).length > 0 ? formData.financial_guarantee : null,
          study_mode: formData.study_mode || null,
          funding_source: formData.funding_source || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student')
      }

      toast.success('Student updated successfully')
      router.push('/admin/v2/students')
    } catch (error) {
      console.error('Error updating student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update student')
    } finally {
      setIsSaving(false)
    }
  }

  const nationalities = [
    'China', 'Nigeria', 'Pakistan', 'India', 'Bangladesh', 'Indonesia', 
    'Thailand', 'Vietnam', 'Russia', 'Kazakhstan', 'South Korea', 'Japan',
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Brazil', 'Mexico', 'Egypt', 'Turkey'
  ]

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin' || !student) {
    return null
  }

  return (
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
        <SiteHeader title="Edit Student" />
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/v2/students">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Students
              </Link>
            </Button>
          </div>

            {/* Form */}
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="personal" className="gap-2">
                  <IconUser className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="passport" className="gap-2">
                  <IconEPassport className="h-4 w-4" />
                  Passport
                </TabsTrigger>
                <TabsTrigger value="academic" className="gap-2">
                  <IconSchool className="h-4 w-4" />
                  Academic
                </TabsTrigger>
                <TabsTrigger value="family" className="gap-2">
                  <IconUsers className="h-4 w-4" />
                  Family
                </TabsTrigger>
                <TabsTrigger value="additional" className="gap-2">
                  <IconStar className="h-4 w-4" />
                  Additional
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <IconFileText className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              {/* ============ Personal Tab ============ */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconUser className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Student's basic personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input id="full_name" placeholder="Student's full name" value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chinese_name">Chinese Name</Label>
                        <Input id="chinese_name" placeholder="中文名" value={formData.chinese_name} onChange={(e) => handleInputChange('chinese_name', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="+1234567890" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is_active">Status</Label>
                        <Select value={formData.is_active ? "active" : "inactive"} onValueChange={(value) => handleInputChange('is_active', value === "active")}>
                          <SelectTrigger id="is_active"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconUser className="h-5 w-5" />
                      Personal Details
                    </CardTitle>
                    <CardDescription>Additional personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input id="nationality" placeholder="Country of nationality" value={formData.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={formData.gender} onValueChange={(val) => handleInputChange('gender', val)}>
                          <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(val) => handleInputChange('marital_status', val)}>
                          <SelectTrigger id="marital_status"><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="religion">Religion</Label>
                        <Input id="religion" placeholder="Religion (optional)" value={formData.religion} onChange={(e) => handleInputChange('religion', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconBrandWechat className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>Student's contact and address details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="current_address">Current Address</Label>
                        <Textarea id="current_address" placeholder="Current residential address" value={formData.current_address} onChange={(e) => handleInputChange('current_address', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address">Permanent Address</Label>
                        <Textarea id="permanent_address" placeholder="Permanent home address" value={formData.permanent_address} onChange={(e) => handleInputChange('permanent_address', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input id="postal_code" placeholder="Postal/ZIP code" value={formData.postal_code} onChange={(e) => handleInputChange('postal_code', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wechat_id">WeChat ID</Label>
                        <Input id="wechat_id" placeholder="WeChat ID" value={formData.wechat_id} onChange={(e) => handleInputChange('wechat_id', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconPhone className="h-5 w-5" />
                      Emergency Contact
                    </CardTitle>
                    <CardDescription>Who to contact in case of emergency</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Name</Label>
                        <Input id="emergency_contact_name" placeholder="Contact name" value={formData.emergency_contact_name} onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Phone</Label>
                        <Input id="emergency_contact_phone" placeholder="Contact phone" value={formData.emergency_contact_phone} onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                        <Input id="emergency_contact_relationship" placeholder="e.g. Parent, Guardian" value={formData.emergency_contact_relationship} onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============ Passport Tab ============ */}
              <TabsContent value="passport" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconEPassport className="h-5 w-5" />
                      Passport Information
                    </CardTitle>
                    <CardDescription>Student's passport details for university applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="passport_number">Passport Number</Label>
                        <Input id="passport_number" placeholder="Passport number" value={formData.passport_number} onChange={(e) => handleInputChange('passport_number', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passport_issuing_country">Passport Issuing Country</Label>
                        <Input id="passport_issuing_country" placeholder="Country that issued the passport" value={formData.passport_issuing_country} onChange={(e) => handleInputChange('passport_issuing_country', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                        <Input id="passport_expiry_date" type="date" value={formData.passport_expiry_date} onChange={(e) => handleInputChange('passport_expiry_date', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============ Academic Tab ============ */}
              <TabsContent value="academic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconSchool className="h-5 w-5" />
                          Education History
                        </CardTitle>
                        <CardDescription>Add all academic qualifications (high school and above)</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('education_history', { institution: '', degree: '', field_of_study: '', start_date: '', gpa: '', city: '', country: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Education
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.education_history.length === 0 ? (
                      <div className="text-center py-8">
                        <IconSchool className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No education history added yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Click "Add Education" to add your academic background.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.education_history.map((edu, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Education #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('education_history', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Institution</Label>
                                <Input value={edu.institution} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, institution: e.target.value })} placeholder="University name" />
                              </div>
                              <div className="space-y-2">
                                <Label>Degree</Label>
                                <Input value={edu.degree} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, degree: e.target.value })} placeholder="e.g. Bachelor's" />
                              </div>
                              <div className="space-y-2">
                                <Label>Field of Study</Label>
                                <Input value={edu.field_of_study} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, field_of_study: e.target.value })} placeholder="Major" />
                              </div>
                              <div className="space-y-2">
                                <Label>GPA</Label>
                                <Input value={edu.gpa || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, gpa: e.target.value })} placeholder="e.g. 3.8/4.0" />
                              </div>
                              <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="month" value={edu.start_date} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, start_date: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="month" value={edu.end_date || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, end_date: e.target.value })} placeholder="Leave blank if current" />
                              </div>
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Input value={edu.city || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, city: e.target.value })} placeholder="City" />
                              </div>
                              <div className="space-y-2">
                                <Label>Country</Label>
                                <Input value={edu.country || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, country: e.target.value })} placeholder="Country" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconBriefcase className="h-5 w-5" />
                          Work Experience
                        </CardTitle>
                        <CardDescription>Add professional experience</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('work_experience', { company: '', position: '', start_date: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Experience
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.work_experience.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No work experience added yet. Click "Add Experience" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.work_experience.map((work, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Experience #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('work_experience', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Company</Label>
                                <Input value={work.company} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, company: e.target.value })} placeholder="Company name" />
                              </div>
                              <div className="space-y-2">
                                <Label>Position</Label>
                                <Input value={work.position} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, position: e.target.value })} placeholder="Job title" />
                              </div>
                              <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="month" value={work.start_date} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, start_date: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="month" value={work.end_date || ''} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, end_date: e.target.value })} placeholder="Leave blank if current" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={work.description || ''} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, description: e.target.value })} placeholder="Job description" rows={2} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconLanguage className="h-5 w-5" />
                      Language Test Scores
                    </CardTitle>
                    <CardDescription>Language proficiency test results</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="hsk_level">HSK Level</Label>
                        <Input id="hsk_level" type="number" min="1" max="6" placeholder="1-6" value={formData.hsk_level} onChange={(e) => handleInputChange('hsk_level', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hsk_score">HSK Score</Label>
                        <Input id="hsk_score" type="number" placeholder="HSK score" value={formData.hsk_score} onChange={(e) => handleInputChange('hsk_score', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ielts_score">IELTS Score</Label>
                        <Input id="ielts_score" type="number" step="0.5" placeholder="e.g. 6.5" value={formData.ielts_score} onChange={(e) => handleInputChange('ielts_score', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="toefl_score">TOEFL Score</Label>
                        <Input id="toefl_score" type="number" placeholder="e.g. 90" value={formData.toefl_score} onChange={(e) => handleInputChange('toefl_score', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============ Family Tab ============ */}
              <TabsContent value="family" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconUsers className="h-5 w-5" />
                          Family Members
                        </CardTitle>
                        <CardDescription>Family information required by most Chinese universities</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('family_members', { name: '', relationship: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Family Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.family_members.length === 0 ? (
                      <div className="text-center py-8">
                        <IconUsers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No family members added yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Click "Add Family Member" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.family_members.map((member, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Family Member #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('family_members', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={member.name} onChange={(e) => updateArrayItem('family_members', idx, { ...member, name: e.target.value })} placeholder="Full name" />
                              </div>
                              <div className="space-y-2">
                                <Label>Relationship</Label>
                                <Input value={member.relationship} onChange={(e) => updateArrayItem('family_members', idx, { ...member, relationship: e.target.value })} placeholder="e.g. Father, Mother" />
                              </div>
                              <div className="space-y-2">
                                <Label>Occupation</Label>
                                <Input value={member.occupation || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, occupation: e.target.value })} placeholder="Occupation" />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={member.phone || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, phone: e.target.value })} placeholder="Phone number" />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={member.email || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, email: e.target.value })} placeholder="Email" />
                              </div>
                              <div className="space-y-2">
                                <Label>Address</Label>
                                <Input value={member.address || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, address: e.target.value })} placeholder="Address" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============ Additional Tab ============ */}
              <TabsContent value="additional" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconStar className="h-5 w-5" />
                          Extracurricular Activities
                        </CardTitle>
                        <CardDescription>Clubs, organizations, volunteer work, and other activities</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('extracurricular_activities', { activity: '', start_date: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Activity
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.extracurricular_activities.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No activities added yet. Click "Add Activity" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.extracurricular_activities.map((act, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Activity #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('extracurricular_activities', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Activity</Label>
                                <Input value={act.activity} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, activity: e.target.value })} placeholder="Activity name" />
                              </div>
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value={act.role || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, role: e.target.value })} placeholder="Your role" />
                              </div>
                              <div className="space-y-2">
                                <Label>Organization</Label>
                                <Input value={act.organization || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, organization: e.target.value })} placeholder="Organization" />
                              </div>
                              <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="month" value={act.start_date} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, start_date: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="month" value={act.end_date || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, end_date: e.target.value })} placeholder="Leave blank if current" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={act.description || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, description: e.target.value })} placeholder="Description" rows={2} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconTrophy className="h-5 w-5" />
                          Awards & Achievements
                        </CardTitle>
                        <CardDescription>Honors, awards, and notable achievements</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('awards', { title: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Award
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.awards.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No awards added yet. Click "Add Award" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.awards.map((award, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Award #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('awards', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={award.title} onChange={(e) => updateArrayItem('awards', idx, { ...award, title: e.target.value })} placeholder="Award title" />
                              </div>
                              <div className="space-y-2">
                                <Label>Issuing Organization</Label>
                                <Input value={award.issuing_organization || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, issuing_organization: e.target.value })} placeholder="Organization" />
                              </div>
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="month" value={award.date || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, date: e.target.value })} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={award.description || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, description: e.target.value })} placeholder="Description" rows={2} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconFileText className="h-5 w-5" />
                          Publications
                        </CardTitle>
                        <CardDescription>Published papers, articles, or research work</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('publications', { title: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Publication
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.publications.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No publications added yet. Click "Add Publication" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.publications.map((pub, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Publication #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('publications', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={pub.title} onChange={(e) => updateArrayItem('publications', idx, { ...pub, title: e.target.value })} placeholder="Publication title" />
                              </div>
                              <div className="space-y-2">
                                <Label>Publisher</Label>
                                <Input value={pub.publisher || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, publisher: e.target.value })} placeholder="Publisher" />
                              </div>
                              <div className="space-y-2">
                                <Label>Publication Date</Label>
                                <Input type="month" value={pub.publication_date || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, publication_date: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input value={pub.url || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, url: e.target.value })} placeholder="https://..." />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={pub.description || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, description: e.target.value })} placeholder="Description" rows={2} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <IconFlask className="h-5 w-5" />
                          Research Experience
                        </CardTitle>
                        <CardDescription>Research projects and lab experience</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addArrayItem('research_experience', { topic: '', start_date: '' })}>
                        <IconPlus className="h-4 w-4 mr-1" /> Add Research
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.research_experience.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No research experience added yet. Click "Add Research" to add.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.research_experience.map((res, idx) => (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Research #{idx + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('research_experience', idx)} className="text-destructive hover:text-destructive">
                                <IconTrash className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Topic</Label>
                                <Input value={res.topic} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, topic: e.target.value })} placeholder="Research topic" />
                              </div>
                              <div className="space-y-2">
                                <Label>Institution</Label>
                                <Input value={res.institution || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, institution: e.target.value })} placeholder="Institution" />
                              </div>
                              <div className="space-y-2">
                                <Label>Supervisor</Label>
                                <Input value={res.supervisor || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, supervisor: e.target.value })} placeholder="Supervisor name" />
                              </div>
                              <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="month" value={res.start_date} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, start_date: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="month" value={res.end_date || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, end_date: e.target.value })} placeholder="Leave blank if current" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={res.description || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, description: e.target.value })} placeholder="Description" rows={2} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============ Preferences Tab ============ */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconSchool className="h-5 w-5" />
                      Study Preferences
                    </CardTitle>
                    <CardDescription>Student's study preferences for university applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="study_mode">Study Mode</Label>
                        <Select value={formData.study_mode} onValueChange={(val) => handleInputChange('study_mode', val)}>
                          <SelectTrigger id="study_mode"><SelectValue placeholder="Select study mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funding_source">Funding Source</Label>
                        <Select value={formData.funding_source} onValueChange={(val) => handleInputChange('funding_source', val)}>
                          <SelectTrigger id="funding_source"><SelectValue placeholder="Select funding source" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self_funded">Self Funded</SelectItem>
                            <SelectItem value="csc_scholarship">CSC Scholarship</SelectItem>
                            <SelectItem value="university_scholarship">University Scholarship</SelectItem>
                            <SelectItem value="government_scholarship">Government Scholarship</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-5 w-5" />
                      Scholarship Application
                    </CardTitle>
                    <CardDescription>Scholarship information for applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Scholarship Type</Label>
                        <Input value={formData.scholarship_application.type || ''} onChange={(e) => updateObjectField('scholarship_application', 'type', e.target.value)} placeholder="e.g. Full, Partial" />
                      </div>
                      <div className="space-y-2">
                        <Label>Scholarship Name</Label>
                        <Input value={formData.scholarship_application.name || ''} onChange={(e) => updateObjectField('scholarship_application', 'name', e.target.value)} placeholder="Scholarship name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Coverage</Label>
                        <Input value={formData.scholarship_application.coverage || ''} onChange={(e) => updateObjectField('scholarship_application', 'coverage', e.target.value)} placeholder="e.g. Tuition + Living" />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Input value={formData.scholarship_application.status || ''} onChange={(e) => updateObjectField('scholarship_application', 'status', e.target.value)} placeholder="e.g. Applied, Pending" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Notes</Label>
                        <Textarea value={formData.scholarship_application.notes || ''} onChange={(e) => updateObjectField('scholarship_application', 'notes', e.target.value)} placeholder="Additional notes" rows={2} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-5 w-5" />
                      Financial Guarantee
                    </CardTitle>
                    <CardDescription>Financial guarantee information for visa applications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Guarantor Name</Label>
                        <Input value={formData.financial_guarantee.guarantor_name || ''} onChange={(e) => updateObjectField('financial_guarantee', 'guarantor_name', e.target.value)} placeholder="Guarantor's full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Guarantor Relationship</Label>
                        <Input value={formData.financial_guarantee.guarantor_relationship || ''} onChange={(e) => updateObjectField('financial_guarantee', 'guarantor_relationship', e.target.value)} placeholder="e.g. Parent, Sponsor" />
                      </div>
                      <div className="space-y-2">
                        <Label>Guarantor Occupation</Label>
                        <Input value={formData.financial_guarantee.guarantor_occupation || ''} onChange={(e) => updateObjectField('financial_guarantee', 'guarantor_occupation', e.target.value)} placeholder="Occupation" />
                      </div>
                      <div className="space-y-2">
                        <Label>Annual Income</Label>
                        <Input value={formData.financial_guarantee.annual_income || ''} onChange={(e) => updateObjectField('financial_guarantee', 'annual_income', e.target.value)} placeholder="e.g. 50000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Income Currency</Label>
                        <Input value={formData.financial_guarantee.income_currency || ''} onChange={(e) => updateObjectField('financial_guarantee', 'income_currency', e.target.value)} placeholder="e.g. USD, CNY" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/v2/students">
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
