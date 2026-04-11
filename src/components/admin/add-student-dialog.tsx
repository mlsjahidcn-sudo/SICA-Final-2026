"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { 
  IconUserPlus, IconUser, IconEPassport, IconSchool, IconUsers, 
  IconStar, IconFileText, IconPlus, IconTrash, IconBriefcase, 
  IconLanguage, IconTrophy, IconFlask, IconCurrencyDollar 
} from "@tabler/icons-react"
import { toast } from "sonner"

interface EducationHistoryEntry {
  institution: string
  degree: string
  field_of_study: string
  start_date: string
  end_date?: string
  gpa?: string
  city?: string
  country?: string
}

interface WorkExperienceEntry {
  company: string
  position: string
  start_date: string
  end_date?: string
  description?: string
}

interface FamilyMemberEntry {
  name: string
  relationship: string
  occupation?: string
  phone?: string
  email?: string
  address?: string
}

interface ExtracurricularActivityEntry {
  activity: string
  role?: string
  organization?: string
  start_date: string
  end_date?: string
  description?: string
}

interface AwardEntry {
  title: string
  issuing_organization?: string
  date?: string
  description?: string
}

interface PublicationEntry {
  title: string
  publisher?: string
  publication_date?: string
  url?: string
  description?: string
}

interface ResearchExperienceEntry {
  topic: string
  institution?: string
  supervisor?: string
  start_date: string
  end_date?: string
  description?: string
}

interface FormData {
  email: string
  full_name: string
  phone: string
  nationality: string
  date_of_birth: string
  gender: string
  current_address: string
  postal_code: string
  permanent_address: string
  chinese_name: string
  marital_status: string
  religion: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  passport_number: string
  passport_expiry_date: string
  passport_issuing_country: string
  education_history: EducationHistoryEntry[]
  work_experience: WorkExperienceEntry[]
  hsk_level: string
  hsk_score: string
  ielts_score: string
  toefl_score: string
  family_members: FamilyMemberEntry[]
  extracurricular_activities: ExtracurricularActivityEntry[]
  awards: AwardEntry[]
  publications: PublicationEntry[]
  research_experience: ResearchExperienceEntry[]
  scholarship_application: Record<string, string>
  financial_guarantee: Record<string, string>
  study_mode: string
  funding_source: string
  wechat_id: string
}

const initialFormData: FormData = {
  email: '',
  full_name: '',
  phone: '',
  nationality: '',
  date_of_birth: '',
  gender: '',
  current_address: '',
  postal_code: '',
  permanent_address: '',
  chinese_name: '',
  marital_status: '',
  religion: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  passport_number: '',
  passport_expiry_date: '',
  passport_issuing_country: '',
  education_history: [],
  work_experience: [],
  hsk_level: '',
  hsk_score: '',
  ielts_score: '',
  toefl_score: '',
  family_members: [],
  extracurricular_activities: [],
  awards: [],
  publications: [],
  research_experience: [],
  scholarship_application: {},
  financial_guarantee: {},
  study_mode: 'full_time',
  funding_source: '',
  wechat_id: '',
}

interface AddStudentDialogProps {
  onStudentAdded?: () => void
  trigger?: React.ReactNode
}

export function AddStudentDialog({ onStudentAdded, trigger }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Array field helpers
  const addArrayItem = <T,>(field: keyof FormData, item: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as T[]), item],
    }))
  }

  const removeArrayItem = (field: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as unknown[]).filter((_, i) => i !== index),
    }))
  }

  const updateArrayItem = <T,>(field: keyof FormData, index: number, item: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).map((existing, i) => i === index ? item : existing),
    }))
  }

  // Object field helpers
  const updateObjectField = (field: 'scholarship_application' | 'financial_guarantee', key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...(prev[field] as Record<string, string>), [key]: value },
    }))
  }

  const handleSubmit = async () => {
    if (!formData.full_name) {
      toast.error('Full name is required')
      return
    }

    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          skip_user_creation: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      toast.success('Student created successfully')
      setOpen(false)
      setFormData(initialFormData)
      setActiveTab('personal')
      onStudentAdded?.()
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create student')
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    setFormData(initialFormData)
    setActiveTab('personal')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetAndClose()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <IconUserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student information. Full name is required. Student can claim their account later using their email.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="personal" className="flex items-center gap-1.5 text-xs">
              <IconUser className="h-3.5 w-3.5" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="passport" className="flex items-center gap-1.5 text-xs">
              <IconEPassport className="h-3.5 w-3.5" />
              Passport
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-1.5 text-xs">
              <IconSchool className="h-3.5 w-3.5" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-1.5 text-xs">
              <IconUsers className="h-3.5 w-3.5" />
              Family
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-1.5 text-xs">
              <IconStar className="h-3.5 w-3.5" />
              Additional
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs">
              <IconFileText className="h-3.5 w-3.5" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh]">
            {/* ============ Personal Tab ============ */}
            <TabsContent value="personal" className="space-y-4 mt-0">
              {/* Basic Information */}
              <div>
                <h3 className="text-base font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="student@example.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                    <p className="text-xs text-muted-foreground">Student will use this email to claim their account later</p>
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
                </div>
              </div>

              <Separator className="my-4" />

              {/* Personal Details */}
              <div>
                <h3 className="text-base font-semibold mb-3">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <Separator className="my-4" />

              {/* Contact Information */}
              <div>
                <h3 className="text-base font-semibold mb-3">Contact Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_address">Current Address</Label>
                      <Textarea id="current_address" placeholder="Current residential address" value={formData.current_address} onChange={(e) => handleInputChange('current_address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="permanent_address">Permanent Address</Label>
                      <Textarea id="permanent_address" placeholder="Permanent home address" value={formData.permanent_address} onChange={(e) => handleInputChange('permanent_address', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input id="postal_code" placeholder="Postal/ZIP code" value={formData.postal_code} onChange={(e) => handleInputChange('postal_code', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wechat_id">WeChat ID</Label>
                      <Input id="wechat_id" placeholder="WeChat ID" value={formData.wechat_id} onChange={(e) => handleInputChange('wechat_id', e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </TabsContent>

            {/* ============ Passport Tab ============ */}
            <TabsContent value="passport" className="space-y-4 mt-0">
              <div>
                <h3 className="text-base font-semibold mb-3">Passport Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input id="passport_number" placeholder="Passport number" value={formData.passport_number} onChange={(e) => handleInputChange('passport_number', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport_issuing_country">Passport Issuing Country</Label>
                    <Input id="passport_issuing_country" placeholder="Country that issued the passport" value={formData.passport_issuing_country} onChange={(e) => handleInputChange('passport_issuing_country', e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                    <Input id="passport_expiry_date" type="date" value={formData.passport_expiry_date} onChange={(e) => handleInputChange('passport_expiry_date', e.target.value)} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ============ Academic Tab ============ */}
            <TabsContent value="academic" className="space-y-4 mt-0">
              {/* Education History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconSchool className="h-4 w-4" />
                    Education History
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('education_history', { institution: '', degree: '', field_of_study: '', start_date: '', gpa: '', city: '', country: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Education
                  </Button>
                </div>
                {formData.education_history.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconSchool className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No education history added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.education_history.map((edu, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('education_history', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Institution</Label>
                              <Input value={edu.institution} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, institution: e.target.value })} placeholder="University name" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Degree</Label>
                              <Input value={edu.degree} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, degree: e.target.value })} placeholder="e.g. Bachelor's" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Field of Study</Label>
                              <Input value={edu.field_of_study} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, field_of_study: e.target.value })} placeholder="Major" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">GPA</Label>
                              <Input value={edu.gpa || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, gpa: e.target.value })} placeholder="e.g. 3.8/4.0" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Start Date</Label>
                              <Input type="date" value={edu.start_date} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">End Date</Label>
                              <Input type="date" value={edu.end_date || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, end_date: e.target.value })} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Work Experience */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconBriefcase className="h-4 w-4" />
                    Work Experience
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('work_experience', { company: '', position: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Experience
                  </Button>
                </div>
                {formData.work_experience.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconBriefcase className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No work experience added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.work_experience.map((work, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('work_experience', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Company</Label>
                              <Input value={work.company} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, company: e.target.value })} placeholder="Company name" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Position</Label>
                              <Input value={work.position} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, position: e.target.value })} placeholder="Job title" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Start Date</Label>
                              <Input type="date" value={work.start_date} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">End Date</Label>
                              <Input type="date" value={work.end_date || ''} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, end_date: e.target.value })} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Language Test Scores */}
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <IconLanguage className="h-4 w-4" />
                  Language Test Scores
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">HSK Level</Label>
                    <Input type="number" min="1" max="6" placeholder="1-6" value={formData.hsk_level} onChange={(e) => handleInputChange('hsk_level', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">HSK Score</Label>
                    <Input type="number" placeholder="HSK score" value={formData.hsk_score} onChange={(e) => handleInputChange('hsk_score', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">IELTS Score</Label>
                    <Input type="number" step="0.5" placeholder="e.g. 6.5" value={formData.ielts_score} onChange={(e) => handleInputChange('ielts_score', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">TOEFL Score</Label>
                    <Input type="number" placeholder="e.g. 90" value={formData.toefl_score} onChange={(e) => handleInputChange('toefl_score', e.target.value)} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ============ Family Tab ============ */}
            <TabsContent value="family" className="space-y-4 mt-0">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Family Members</h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('family_members', { name: '', relationship: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Family Member
                  </Button>
                </div>
                {formData.family_members.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconUsers className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No family members added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.family_members.map((member, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('family_members', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Name</Label>
                              <Input value={member.name} onChange={(e) => updateArrayItem('family_members', idx, { ...member, name: e.target.value })} placeholder="Full name" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Relationship</Label>
                              <Input value={member.relationship} onChange={(e) => updateArrayItem('family_members', idx, { ...member, relationship: e.target.value })} placeholder="e.g. Father, Mother" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Occupation</Label>
                              <Input value={member.occupation || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, occupation: e.target.value })} placeholder="Occupation" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Phone</Label>
                              <Input value={member.phone || ''} onChange={(e) => updateArrayItem('family_members', idx, { ...member, phone: e.target.value })} placeholder="Phone number" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ============ Additional Tab ============ */}
            <TabsContent value="additional" className="space-y-4 mt-0">
              {/* Extracurricular Activities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconStar className="h-4 w-4" />
                    Extracurricular Activities
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('extracurricular_activities', { activity: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Activity
                  </Button>
                </div>
                {formData.extracurricular_activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No activities added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.extracurricular_activities.map((act, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('extracurricular_activities', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Activity</Label>
                              <Input value={act.activity} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, activity: e.target.value })} placeholder="Activity name" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Role</Label>
                              <Input value={act.role || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, role: e.target.value })} placeholder="Your role" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Awards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconTrophy className="h-4 w-4" />
                    Awards
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('awards', { title: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Award
                  </Button>
                </div>
                {formData.awards.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No awards added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.awards.map((award, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('awards', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Title</Label>
                              <Input value={award.title} onChange={(e) => updateArrayItem('awards', idx, { ...award, title: e.target.value })} placeholder="Award title" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Issuing Organization</Label>
                              <Input value={award.issuing_organization || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, issuing_organization: e.target.value })} placeholder="Organization" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Publications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    Publications
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('publications', { title: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Publication
                  </Button>
                </div>
                {formData.publications.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No publications added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.publications.map((pub, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('publications', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Title</Label>
                              <Input value={pub.title} onChange={(e) => updateArrayItem('publications', idx, { ...pub, title: e.target.value })} placeholder="Publication title" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Publisher</Label>
                              <Input value={pub.publisher || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, publisher: e.target.value })} placeholder="Publisher" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Research Experience */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <IconFlask className="h-4 w-4" />
                    Research Experience
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('research_experience', { topic: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Research
                  </Button>
                </div>
                {formData.research_experience.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No research experience added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.research_experience.map((res, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('research_experience', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Topic</Label>
                              <Input value={res.topic} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, topic: e.target.value })} placeholder="Research topic" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Institution</Label>
                              <Input value={res.institution || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, institution: e.target.value })} placeholder="Institution" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ============ Preferences Tab ============ */}
            <TabsContent value="preferences" className="space-y-4 mt-0">
              {/* Study Preferences */}
              <div>
                <h3 className="text-base font-semibold mb-3">Study Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <Separator className="my-4" />

              {/* Scholarship Application */}
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <IconCurrencyDollar className="h-4 w-4" />
                  Scholarship Application
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
