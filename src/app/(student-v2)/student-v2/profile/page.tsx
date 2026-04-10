"use client"

import * as React from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconEPassport,
  IconSchool,
  IconLanguage,
  IconDeviceFloppy,
  IconLoader2,
  IconRefresh,
  IconBriefcase,
  IconUsers,
  IconBrandWechat,
  IconPlus,
  IconTrash,
  IconTrophy,
  IconFileText,
  IconFlask,
  IconCurrencyDollar,
  IconStar,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { studentApi, type StudentProfile, type WorkExperienceEntry, type EducationHistoryEntry, type FamilyMemberEntry, type ExtracurricularActivityEntry, type AwardEntry, type PublicationEntry, type ResearchExperienceEntry, type ScholarshipApplicationData, type FinancialGuaranteeData } from "@/lib/student-api"

interface ProfileFormData {
  // User fields
  full_name: string;
  email: string;
  phone: string;
  // Personal information
  nationality: string;
  date_of_birth: string;
  gender: string;
  current_address: string;
  postal_code: string;
  permanent_address: string;
  chinese_name: string;
  marital_status: string;
  religion: string;
  // Emergency contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  // Passport information
  passport_number: string;
  passport_expiry_date: string;
  passport_issuing_country: string;
  // Academic information (JSONB arrays)
  education_history: EducationHistoryEntry[];
  work_experience: WorkExperienceEntry[];
  // Language test scores
  hsk_level: string;
  hsk_score: string;
  ielts_score: string;
  toefl_score: string;
  // Family information
  family_members: FamilyMemberEntry[];
  // Additional information
  extracurricular_activities: ExtracurricularActivityEntry[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  research_experience: ResearchExperienceEntry[];
  scholarship_application: ScholarshipApplicationData;
  financial_guarantee: FinancialGuaranteeData;
  // Study preferences
  study_mode: string;
  funding_source: string;
  // Communication
  wechat_id: string;
}

const initialFormData: ProfileFormData = {
  full_name: "",
  email: "",
  phone: "",
  nationality: "",
  date_of_birth: "",
  gender: "",
  current_address: "",
  postal_code: "",
  permanent_address: "",
  chinese_name: "",
  marital_status: "",
  religion: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  passport_number: "",
  passport_expiry_date: "",
  passport_issuing_country: "",
  education_history: [],
  work_experience: [],
  hsk_level: "",
  hsk_score: "",
  ielts_score: "",
  toefl_score: "",
  family_members: [],
  extracurricular_activities: [],
  awards: [],
  publications: [],
  research_experience: [],
  scholarship_application: {},
  financial_guarantee: {},
  study_mode: "full_time",
  funding_source: "",
  wechat_id: "",
}

function profileToFormData(profile: StudentProfile): ProfileFormData {
  const sp = profile.studentProfile || {};
  return {
    full_name: profile.user.full_name || "",
    email: profile.user.email || "",
    phone: profile.user.phone || "",
    nationality: sp.nationality as string || "",
    date_of_birth: sp.date_of_birth as string || "",
    gender: sp.gender as string || "",
    current_address: sp.current_address as string || "",
    postal_code: sp.postal_code as string || "",
    permanent_address: sp.permanent_address as string || "",
    chinese_name: sp.chinese_name as string || "",
    marital_status: sp.marital_status as string || "",
    religion: sp.religion as string || "",
    emergency_contact_name: sp.emergency_contact_name as string || "",
    emergency_contact_phone: sp.emergency_contact_phone as string || "",
    emergency_contact_relationship: sp.emergency_contact_relationship as string || "",
    passport_number: sp.passport_number as string || "",
    passport_expiry_date: sp.passport_expiry_date as string || "",
    passport_issuing_country: sp.passport_issuing_country as string || "",
    education_history: sp.education_history as EducationHistoryEntry[] || [],
    work_experience: sp.work_experience as WorkExperienceEntry[] || [],
    hsk_level: sp.hsk_level != null ? String(sp.hsk_level) : "",
    hsk_score: sp.hsk_score != null ? String(sp.hsk_score) : "",
    ielts_score: sp.ielts_score as string || "",
    toefl_score: sp.toefl_score != null ? String(sp.toefl_score) : "",
    family_members: sp.family_members as FamilyMemberEntry[] || [],
    extracurricular_activities: sp.extracurricular_activities as ExtracurricularActivityEntry[] || [],
    awards: sp.awards as AwardEntry[] || [],
    publications: sp.publications as PublicationEntry[] || [],
    research_experience: sp.research_experience as ResearchExperienceEntry[] || [],
    scholarship_application: sp.scholarship_application as ScholarshipApplicationData || {},
    financial_guarantee: sp.financial_guarantee as FinancialGuaranteeData || {},
    study_mode: sp.study_mode as string || "full_time",
    funding_source: sp.funding_source as string || "",
    wechat_id: sp.wechat_id as string || "",
  }
}

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [profile, setProfile] = React.useState<StudentProfile | null>(null)
  const [formData, setFormData] = React.useState<ProfileFormData>(initialFormData)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const fetchProfile = React.useCallback(async () => {
    setFetching(true)
    
    const { data, error } = await studentApi.getProfile()
    
    if (error) {
      if (error === 'Unauthorized') {
        const mockProfile: StudentProfile = {
          user: {
            id: "user1",
            email: "john.doe@email.com",
            full_name: "John Doe",
            phone: "+1 234 567 8900",
          },
          studentProfile: {
            nationality: "United States",
            passport_number: "AB12345678",
            passport_expiry_date: "2030-12-31",
            date_of_birth: "1998-05-15",
            gender: "Male",
            current_address: "123 Main St, New York, NY 10001",
            emergency_contact_name: "Jane Doe",
            emergency_contact_phone: "+1 234 567 8901",
            highest_education: "Bachelor's Degree",
            institution_name: "University of California",
            graduation_date: "2022-06",
            gpa: "3.7",
            hsk_level: 4,
            ielts_score: "7.5",
            education_history: [
              { institution: "University of California", degree: "Bachelor's Degree", field_of_study: "Computer Science", start_date: "2018-09", end_date: "2022-06", gpa: "3.7", city: "Berkeley", country: "United States" }
            ],
            family_members: [
              { name: "Jane Doe", relationship: "Mother", occupation: "Teacher", phone: "+1 234 567 8901", email: "jane.doe@email.com" }
            ],
          },
          profileCompletion: 65
        }
        setProfile(mockProfile)
        setFormData(profileToFormData(mockProfile))
      } else {
        console.error("Error fetching profile:", error)
      }
    } else if (data) {
      setProfile(data)
      setFormData(profileToFormData(data))
    }
    
    setFetching(false)
  }, [])

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    // Client-side validation
    if (!formData.full_name.trim()) {
      toast.error('Full name is required', {
        icon: <IconAlertCircle className="h-4 w-4" />,
      })
      return
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required', {
        icon: <IconAlertCircle className="h-4 w-4" />,
      })
      return
    }

    setLoading(true)
    setSaveSuccess(false)
    
    try {
      const { error } = await studentApi.updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        student_profile: {
          nationality: formData.nationality,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          current_address: formData.current_address,
          postal_code: formData.postal_code,
          permanent_address: formData.permanent_address,
          chinese_name: formData.chinese_name,
          marital_status: formData.marital_status,
          religion: formData.religion,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
          passport_number: formData.passport_number,
          passport_expiry_date: formData.passport_expiry_date,
          passport_issuing_country: formData.passport_issuing_country,
          education_history: formData.education_history,
          work_experience: formData.work_experience,
          hsk_level: formData.hsk_level ? parseInt(formData.hsk_level) : undefined,
          hsk_score: formData.hsk_score ? parseInt(formData.hsk_score) : undefined,
          ielts_score: formData.ielts_score,
          toefl_score: formData.toefl_score ? parseInt(formData.toefl_score) : undefined,
          family_members: formData.family_members,
          extracurricular_activities: formData.extracurricular_activities,
          awards: formData.awards,
          publications: formData.publications,
          research_experience: formData.research_experience,
          scholarship_application: formData.scholarship_application,
          financial_guarantee: formData.financial_guarantee,
          study_mode: formData.study_mode,
          funding_source: formData.funding_source,
          wechat_id: formData.wechat_id,
        }
      })
      
      if (error) {
        toast.error('Failed to save profile', {
          description: error,
          icon: <IconAlertCircle className="h-4 w-4" />,
        })
      } else {
        toast.success('Profile saved successfully!', {
          icon: <IconCircleCheck className="h-4 w-4" />,
        })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        fetchProfile()
      }
    } catch (err) {
      toast.error('An unexpected error occurred', {
        description: (err as Error).message,
        icon: <IconAlertCircle className="h-4 w-4" />,
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Education history helpers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education_history: [...prev.education_history, { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", gpa: "", city: "", country: "" }]
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education_history: prev.education_history.filter((_, i) => i !== index)
    }))
  }

  const updateEducation = (index: number, field: keyof EducationHistoryEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      education_history: prev.education_history.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Work experience helpers
  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, { company: "", position: "", start_date: "", description: "" }]
    }))
  }

  const removeWorkExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }))
  }

  const updateWorkExperience = (index: number, field: keyof WorkExperienceEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Family member helpers
  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      family_members: [...prev.family_members, { name: "", relationship: "", occupation: "", phone: "", email: "", address: "" }]
    }))
  }

  const removeFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      family_members: prev.family_members.filter((_, i) => i !== index)
    }))
  }

  const updateFamilyMember = (index: number, field: keyof FamilyMemberEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      family_members: prev.family_members.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Extracurricular activities helpers
  const addExtracurricular = () => {
    setFormData(prev => ({
      ...prev,
      extracurricular_activities: [...prev.extracurricular_activities, { activity: "", role: "", organization: "", start_date: "", end_date: "", description: "" }]
    }))
  }

  const removeExtracurricular = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extracurricular_activities: prev.extracurricular_activities.filter((_, i) => i !== index)
    }))
  }

  const updateExtracurricular = (index: number, field: keyof ExtracurricularActivityEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      extracurricular_activities: prev.extracurricular_activities.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Awards helpers
  const addAward = () => {
    setFormData(prev => ({
      ...prev,
      awards: [...prev.awards, { title: "", issuing_organization: "", date: "", description: "", certificate_url: "" }]
    }))
  }

  const removeAward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }))
  }

  const updateAward = (index: number, field: keyof AwardEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Publications helpers
  const addPublication = () => {
    setFormData(prev => ({
      ...prev,
      publications: [...prev.publications, { title: "", publisher: "", publication_date: "", url: "", description: "" }]
    }))
  }

  const removePublication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index)
    }))
  }

  const updatePublication = (index: number, field: keyof PublicationEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Research experience helpers
  const addResearchExperience = () => {
    setFormData(prev => ({
      ...prev,
      research_experience: [...prev.research_experience, { topic: "", institution: "", supervisor: "", start_date: "", end_date: "", description: "" }]
    }))
  }

  const removeResearchExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      research_experience: prev.research_experience.filter((_, i) => i !== index)
    }))
  }

  const updateResearchExperience = (index: number, field: keyof ResearchExperienceEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      research_experience: prev.research_experience.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  // Scholarship application helper
  const updateScholarship = (field: keyof ScholarshipApplicationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      scholarship_application: { ...prev.scholarship_application, [field]: value }
    }))
  }

  // Financial guarantee helper
  const updateFinancialGuarantee = (field: keyof FinancialGuaranteeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      financial_guarantee: { ...prev.financial_guarantee, [field]: value }
    }))
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const completion = profile?.profileCompletion || 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Complete your profile for Chinese university applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchProfile()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconDeviceFloppy className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Save Success Indicator */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          <IconCircleCheck className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Profile saved successfully!</p>
            <p className="text-sm opacity-80">Your changes have been saved to the database.</p>
          </div>
        </div>
      )}

      {/* Completion Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Profile Completion</p>
                <span className="text-sm text-muted-foreground">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <IconUser className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="passport">Passport</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ========== Personal Information ========== */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="full_name" value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chinese_name">Chinese Name (中文名)</Label>
                  <Input id="chinese_name" value={formData.chinese_name} onChange={(e) => updateField("chinese_name", e.target.value)} placeholder="Your name in Chinese characters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} disabled className="pl-9 bg-muted" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={formData.nationality} onChange={(e) => updateField("nationality", e.target.value)} placeholder="e.g., United States, Nigeria, Pakistan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
                  <Input id="religion" value={formData.religion} onChange={(e) => updateField("religion", e.target.value)} placeholder="e.g., None, Buddhism, Islam, Christianity" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <div className="relative">
                    <IconMapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="current_address" value={formData.current_address} onChange={(e) => updateField("current_address", e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input id="postal_code" value={formData.postal_code} onChange={(e) => updateField("postal_code", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permanent_address">Permanent / Home Country Address</Label>
                    <Input id="permanent_address" value={formData.permanent_address} onChange={(e) => updateField("permanent_address", e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Study Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Study Preferences</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="study_mode">Study Mode</Label>
                    <Select value={formData.study_mode} onValueChange={(v) => updateField("study_mode", v)}>
                      <SelectTrigger><SelectValue placeholder="Select study mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funding_source">Funding Source</Label>
                    <Select value={formData.funding_source} onValueChange={(v) => updateField("funding_source", v)}>
                      <SelectTrigger><SelectValue placeholder="Select funding source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_funded">Self-funded</SelectItem>
                        <SelectItem value="csc_scholarship">CSC Scholarship</SelectItem>
                        <SelectItem value="university_scholarship">University Scholarship</SelectItem>
                        <SelectItem value="government_scholarship">Government Scholarship</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wechat_id">WeChat ID</Label>
                    <div className="relative">
                      <IconBrandWechat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="wechat_id" value={formData.wechat_id} onChange={(e) => updateField("wechat_id", e.target.value)} className="pl-9" placeholder="For communication in China" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPhone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Who should we contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={(e) => updateField("emergency_contact_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={(e) => updateField("emergency_contact_phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Select value={formData.emergency_contact_relationship} onValueChange={(v) => updateField("emergency_contact_relationship", v)}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Passport Information ========== */}
        <TabsContent value="passport" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEPassport className="h-5 w-5" />
                Passport Information
              </CardTitle>
              <CardDescription>Your passport details for university application processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passport_number">Passport Number</Label>
                  <Input id="passport_number" value={formData.passport_number} onChange={(e) => updateField("passport_number", e.target.value)} placeholder="e.g., AB12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_expiry_date">Expiry Date</Label>
                  <Input id="passport_expiry_date" type="date" value={formData.passport_expiry_date} onChange={(e) => updateField("passport_expiry_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_issuing_country">Passport Issuing Country</Label>
                  <Input id="passport_issuing_country" value={formData.passport_issuing_country} onChange={(e) => updateField("passport_issuing_country", e.target.value)} placeholder="May differ from nationality" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Visa processing will be handled by our consultancy after your application is submitted.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Academic Information ========== */}
        <TabsContent value="academic" className="space-y-6">
          {/* Education History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconSchool className="h-5 w-5" />
                    Education History
                  </CardTitle>
                  <CardDescription>Add all your academic qualifications (high school and above)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addEducation}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.education_history.length === 0 ? (
                <div className="text-center py-8">
                  <IconSchool className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No education history added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Education&quot; to add your academic background.</p>
                </div>
              ) : (
                formData.education_history.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Education #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeEducation(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Institution Name</Label>
                        <Input value={entry.institution} onChange={(e) => updateEducation(index, "institution", e.target.value)} placeholder="University or school name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Degree / Certificate</Label>
                        <Select value={entry.degree} onValueChange={(v) => updateEducation(index, "degree", v)}>
                          <SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High School">High School Diploma</SelectItem>
                            <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                            <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                            <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                            <SelectItem value="Doctoral Degree">Doctoral Degree</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Field of Study / Major</Label>
                        <Input value={entry.field_of_study} onChange={(e) => updateEducation(index, "field_of_study", e.target.value)} placeholder="e.g., Computer Science" />
                      </div>
                      <div className="space-y-2">
                        <Label>GPA</Label>
                        <Input value={entry.gpa || ""} onChange={(e) => updateEducation(index, "gpa", e.target.value)} placeholder="e.g., 3.7/4.0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="month" value={entry.start_date} onChange={(e) => updateEducation(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="month" value={entry.end_date || ""} onChange={(e) => updateEducation(index, "end_date", e.target.value)} placeholder="Leave blank if current" />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={entry.city || ""} onChange={(e) => updateEducation(index, "city", e.target.value)} placeholder="City" />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={entry.country || ""} onChange={(e) => updateEducation(index, "country", e.target.value)} placeholder="Country" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconBriefcase className="h-5 w-5" />
                    Work Experience
                  </CardTitle>
                  <CardDescription>Add your professional experience (especially for graduate program applications)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addWorkExperience}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.work_experience.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No work experience added yet. Click &quot;Add Experience&quot; to add.</p>
                </div>
              ) : (
                formData.work_experience.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Experience #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeWorkExperience(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={entry.company} onChange={(e) => updateWorkExperience(index, "company", e.target.value)} placeholder="Company name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input value={entry.position} onChange={(e) => updateWorkExperience(index, "position", e.target.value)} placeholder="Job title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="month" value={entry.start_date} onChange={(e) => updateWorkExperience(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="month" value={entry.end_date || ""} onChange={(e) => updateWorkExperience(index, "end_date", e.target.value)} placeholder="Leave blank if current" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={entry.description || ""} onChange={(e) => updateWorkExperience(index, "description", e.target.value)} placeholder="Brief description of your responsibilities" rows={2} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Language Test Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLanguage className="h-5 w-5" />
                Language Test Scores
              </CardTitle>
              <CardDescription>Your language proficiency test results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Chinese Proficiency (HSK)</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hsk_level">HSK Level</Label>
                    <Select value={formData.hsk_level} onValueChange={(v) => updateField("hsk_level", v)}>
                      <SelectTrigger><SelectValue placeholder="Select HSK level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No HSK</SelectItem>
                        <SelectItem value="1">HSK 1</SelectItem>
                        <SelectItem value="2">HSK 2</SelectItem>
                        <SelectItem value="3">HSK 3</SelectItem>
                        <SelectItem value="4">HSK 4</SelectItem>
                        <SelectItem value="5">HSK 5</SelectItem>
                        <SelectItem value="6">HSK 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsk_score">HSK Score</Label>
                    <Input id="hsk_score" type="number" value={formData.hsk_score} onChange={(e) => updateField("hsk_score", e.target.value)} placeholder="e.g., 210" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">English Proficiency</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ielts_score">IELTS Score</Label>
                    <Input id="ielts_score" value={formData.ielts_score} onChange={(e) => updateField("ielts_score", e.target.value)} placeholder="e.g., 7.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toefl_score">TOEFL Score</Label>
                    <Input id="toefl_score" type="number" value={formData.toefl_score} onChange={(e) => updateField("toefl_score", e.target.value)} placeholder="e.g., 100" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Please upload your language test certificates in the Documents section.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Family Information ========== */}
        <TabsContent value="family" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Family Members
                  </CardTitle>
                  <CardDescription>Family information required by most Chinese universities for admission forms</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addFamilyMember}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Family Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.family_members.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No family members added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Chinese universities typically require parent/guardian information. Click &quot;Add Family Member&quot; to add.</p>
                </div>
              ) : (
                formData.family_members.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Family Member #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeFamilyMember(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={entry.name} onChange={(e) => updateFamilyMember(index, "name", e.target.value)} placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Select value={entry.relationship} onValueChange={(v) => updateFamilyMember(index, "relationship", v)}>
                          <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Occupation</Label>
                        <Input value={entry.occupation || ""} onChange={(e) => updateFamilyMember(index, "occupation", e.target.value)} placeholder="e.g., Engineer, Teacher, Business Owner" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={entry.phone || ""} onChange={(e) => updateFamilyMember(index, "phone", e.target.value)} placeholder="+country code number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={entry.email || ""} onChange={(e) => updateFamilyMember(index, "email", e.target.value)} placeholder="Email address" />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={entry.address || ""} onChange={(e) => updateFamilyMember(index, "address", e.target.value)} placeholder="Home address" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Additional Information ========== */}
        <TabsContent value="additional" className="space-y-6">
          {/* Extracurricular Activities */}
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
                <Button variant="outline" size="sm" onClick={addExtracurricular}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.extracurricular_activities.length === 0 ? (
                <div className="text-center py-6">
                  <IconStar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No extracurricular activities added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Activity&quot; to add your activities.</p>
                </div>
              ) : (
                formData.extracurricular_activities.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Activity #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeExtracurricular(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Activity Name</Label>
                        <Input value={entry.activity} onChange={(e) => updateExtracurricular(index, "activity", e.target.value)} placeholder="e.g., Student Council, Volunteer Work" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role / Position</Label>
                        <Input value={entry.role || ""} onChange={(e) => updateExtracurricular(index, "role", e.target.value)} placeholder="e.g., President, Team Lead" />
                      </div>
                      <div className="space-y-2">
                        <Label>Organization</Label>
                        <Input value={entry.organization || ""} onChange={(e) => updateExtracurricular(index, "organization", e.target.value)} placeholder="Organization name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="month" value={entry.start_date} onChange={(e) => updateExtracurricular(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="month" value={entry.end_date || ""} onChange={(e) => updateExtracurricular(index, "end_date", e.target.value)} placeholder="Leave blank if current" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={entry.description || ""} onChange={(e) => updateExtracurricular(index, "description", e.target.value)} placeholder="Brief description of your involvement" rows={2} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Awards & Achievements */}
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
                <Button variant="outline" size="sm" onClick={addAward}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Award
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.awards.length === 0 ? (
                <div className="text-center py-6">
                  <IconTrophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No awards added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Award&quot; to add your achievements.</p>
                </div>
              ) : (
                formData.awards.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Award #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeAward(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Award Title</Label>
                        <Input value={entry.title} onChange={(e) => updateAward(index, "title", e.target.value)} placeholder="e.g., First Prize in National Math Olympiad" />
                      </div>
                      <div className="space-y-2">
                        <Label>Issuing Organization</Label>
                        <Input value={entry.issuing_organization || ""} onChange={(e) => updateAward(index, "issuing_organization", e.target.value)} placeholder="Organization that issued the award" />
                      </div>
                      <div className="space-y-2">
                        <Label>Date Received</Label>
                        <Input type="month" value={entry.date || ""} onChange={(e) => updateAward(index, "date", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={entry.description || ""} onChange={(e) => updateAward(index, "description", e.target.value)} placeholder="Brief description of the award" rows={2} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Publications */}
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
                <Button variant="outline" size="sm" onClick={addPublication}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Publication
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.publications.length === 0 ? (
                <div className="text-center py-6">
                  <IconFileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No publications added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">This section is especially important for graduate program applications.</p>
                </div>
              ) : (
                formData.publications.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Publication #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePublication(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={entry.title} onChange={(e) => updatePublication(index, "title", e.target.value)} placeholder="Publication title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Publisher / Journal</Label>
                        <Input value={entry.publisher || ""} onChange={(e) => updatePublication(index, "publisher", e.target.value)} placeholder="Journal or publisher name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Publication Date</Label>
                        <Input type="month" value={entry.publication_date || ""} onChange={(e) => updatePublication(index, "publication_date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input value={entry.url || ""} onChange={(e) => updatePublication(index, "url", e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={entry.description || ""} onChange={(e) => updatePublication(index, "description", e.target.value)} placeholder="Brief description of the publication" rows={2} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Research Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconFlask className="h-5 w-5" />
                    Research Experience
                  </CardTitle>
                  <CardDescription>Research projects and lab experience (important for graduate programs)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addResearchExperience}>
                  <IconPlus className="h-4 w-4 mr-1" />
                  Add Research
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.research_experience.length === 0 ? (
                <div className="text-center py-6">
                  <IconFlask className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No research experience added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">This section is especially important for graduate program applications.</p>
                </div>
              ) : (
                formData.research_experience.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Research #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeResearchExperience(index)} className="text-destructive hover:text-destructive">
                        <IconTrash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Research Topic</Label>
                        <Input value={entry.topic} onChange={(e) => updateResearchExperience(index, "topic", e.target.value)} placeholder="Research topic or project name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Institution / Lab</Label>
                        <Input value={entry.institution || ""} onChange={(e) => updateResearchExperience(index, "institution", e.target.value)} placeholder="Institution or lab name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Supervisor</Label>
                        <Input value={entry.supervisor || ""} onChange={(e) => updateResearchExperience(index, "supervisor", e.target.value)} placeholder="Supervisor name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="month" value={entry.start_date} onChange={(e) => updateResearchExperience(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="month" value={entry.end_date || ""} onChange={(e) => updateResearchExperience(index, "end_date", e.target.value)} placeholder="Leave blank if current" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={entry.description || ""} onChange={(e) => updateResearchExperience(index, "description", e.target.value)} placeholder="Brief description of the research and your role" rows={2} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Scholarship Application */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar className="h-5 w-5" />
                Scholarship Application
              </CardTitle>
              <CardDescription>Scholarship information for your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scholarship Type</Label>
                  <Select value={formData.scholarship_application.type || ""} onValueChange={(v) => updateScholarship("type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select scholarship type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csc">Chinese Government Scholarship (CSC)</SelectItem>
                      <SelectItem value="university">University Scholarship</SelectItem>
                      <SelectItem value="provincial">Provincial Government Scholarship</SelectItem>
                      <SelectItem value="confucius_institute">Confucius Institute Scholarship</SelectItem>
                      <SelectItem value="belt_road">Belt and Road Scholarship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="none">Not Applying for Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scholarship Name</Label>
                  <Input value={formData.scholarship_application.name || ""} onChange={(e) => updateScholarship("name", e.target.value)} placeholder="Specific scholarship name (if known)" />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Needed</Label>
                  <Select value={formData.scholarship_application.coverage || ""} onValueChange={(v) => updateScholarship("coverage", v)}>
                    <SelectTrigger><SelectValue placeholder="Select coverage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Scholarship (Tuition + Living + Insurance)</SelectItem>
                      <SelectItem value="tuition_only">Tuition Only</SelectItem>
                      <SelectItem value="partial">Partial Scholarship</SelectItem>
                      <SelectItem value="living_only">Living Allowance Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application Status</Label>
                  <Select value={formData.scholarship_application.status || ""} onValueChange={(v) => updateScholarship("status", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning to Apply</SelectItem>
                      <SelectItem value="preparing">Preparing Documents</SelectItem>
                      <SelectItem value="submitted">Already Submitted</SelectItem>
                      <SelectItem value="awarded">Awarded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.scholarship_application.notes || ""} onChange={(e) => updateScholarship("notes", e.target.value)} placeholder="Any additional information about your scholarship application" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Financial Guarantee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar className="h-5 w-5" />
                Financial Guarantee
              </CardTitle>
              <CardDescription>Financial guarantee information required by Chinese universities and for visa applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Guarantor Name</Label>
                  <Input value={formData.financial_guarantee.guarantor_name || ""} onChange={(e) => updateFinancialGuarantee("guarantor_name", e.target.value)} placeholder="Full name of financial guarantor" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship to Applicant</Label>
                  <Select value={formData.financial_guarantee.guarantor_relationship || ""} onValueChange={(v) => updateFinancialGuarantee("guarantor_relationship", v)}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Self">Self</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Guarantor Occupation</Label>
                  <Input value={formData.financial_guarantee.guarantor_occupation || ""} onChange={(e) => updateFinancialGuarantee("guarantor_occupation", e.target.value)} placeholder="e.g., Business Owner, Engineer" />
                </div>
                <div className="space-y-2">
                  <Label>Annual Income</Label>
                  <div className="flex gap-2">
                    <Input value={formData.financial_guarantee.annual_income || ""} onChange={(e) => updateFinancialGuarantee("annual_income", e.target.value)} placeholder="e.g., 50000" className="flex-1" />
                    <Select value={formData.financial_guarantee.income_currency || "USD"} onValueChange={(v) => updateFinancialGuarantee("income_currency", v)}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CNY">CNY</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Bank statements and sponsor letters should be uploaded per application in the Documents section.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Documents Overview ========== */}
        <TabsContent value="documents" className="space-y-6">
          <ProfileDocumentsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ========== Profile Documents Tab Component ==========

interface ProfileDocument {
  id: string
  application_id: string
  document_type: string
  file_name: string
  file_size: number
  content_type: string
  status: string
  rejection_reason?: string
  created_at: string
  url?: string
  applications?: {
    id: string
    programs?: {
      id: string
      name: string
      universities?: { id: string; name_en: string }
    }
  }
}

interface ProfileApplication {
  id: string
  status: string
  programs?: {
    id: string
    name: string
    universities?: { id: string; name_en: string }
  }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  diploma: 'Diploma/Degree Certificate',
  transcript: 'Academic Transcript',
  language_certificate: 'Language Test Certificate',
  photo: 'Passport Photo',
  recommendation: 'Recommendation Letter',
  cv: 'CV/Resume',
  study_plan: 'Study Plan',
  financial_proof: 'Financial Support Proof',
  medical_exam: 'Medical Examination Report',
  police_clearance: 'Police Clearance Certificate',
  other: 'Other Document',
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  verified: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Verified' },
  pending: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
  rejected: { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ProfileDocumentsTab() {
  const [documents, setDocuments] = React.useState<ProfileDocument[]>([])
  const [applications, setApplications] = React.useState<ProfileApplication[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploadAppId, setUploadAppId] = React.useState('')
  const [uploadDocType, setUploadDocType] = React.useState('')
  const [uploading, setUploading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const [docsRes, appsRes] = await Promise.all([
        fetch('/api/documents', { headers }),
        fetch('/api/student/applications', { headers }),
      ])

      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents || [])
      }

      if (appsRes.ok) {
        const data = await appsRes.json()
        setApplications(data.applications || [])
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async (file: File) => {
    if (!uploadAppId || !uploadDocType) return

    setUploading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const formData = new FormData()
      formData.append('application_id', uploadAppId)
      formData.append('document_type', uploadDocType)
      formData.append('file', file)

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (res.ok) {
        setUploadAppId('')
        setUploadDocType('')
        fetchData()
      } else {
        const data = await res.json()
        console.error('Upload failed:', data.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Group documents by application
  const docsByApp = documents.reduce<Record<string, ProfileDocument[]>>((acc, doc) => {
    const key = doc.application_id
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const getAppName = (appId: string) => {
    const app = applications.find(a => a.id === appId)
    if (app?.programs) {
      return `${app.programs.name}${app.programs.universities ? ` - ${app.programs.universities.name_en}` : ''}`
    }
    return 'Unknown Application'
  }

  return (
    <>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>Select an application and document type, then drag and drop a file below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Application</Label>
              <Select value={uploadAppId} onValueChange={setUploadAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an application..." />
                </SelectTrigger>
                <SelectContent>
                  {applications.map(app => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.programs?.name || 'Unknown Program'}
                      {app.programs?.universities ? ` - ${app.programs.universities.name_en}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadDocType} onValueChange={setUploadDocType} disabled={!uploadAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {uploadAppId && uploadDocType && (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) await handleUpload(file)
                }
                input.click()
              }}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <IconFileText className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Click or drag file to upload</p>
                  <p className="text-sm text-muted-foreground">PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
                </div>
              )}
            </div>
          )}

          {applications.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You need to create an application first before uploading documents.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${documents.length} document${documents.length !== 1 ? 's' : ''} across ${Object.keys(docsByApp).length} application${Object.keys(docsByApp).length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <IconFileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No documents uploaded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Upload documents for your applications above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(docsByApp).map(([appId, docs]) => (
                <div key={appId}>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <IconSchool className="h-4 w-4" />
                    {getAppName(appId)}
                  </h4>
                  <div className="space-y-2">
                    {docs.map(doc => {
                      const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.pending
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              doc.status === 'verified' ? 'bg-green-500' :
                              doc.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>{badge.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {doc.file_name} &middot; {formatFileSize(doc.file_size)}
                              </p>
                              {doc.rejection_reason && (
                                <p className="text-xs text-red-600 mt-1">{doc.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {doc.url && (
                              <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')} title="View">
                                <IconFileText className="h-4 w-4" />
                              </Button>
                            )}
                            {doc.status === 'pending' && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)} title="Delete">
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Commonly Required Documents
          </CardTitle>
          <CardDescription>Documents are uploaded per application. Here is a checklist of commonly required documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">Required for Most Applications</h4>
            <div className="grid gap-2">
              {[
                { type: 'passport', label: 'Passport Copy', desc: 'Valid passport photo page' },
                { type: 'diploma', label: 'Academic Certificates (Notarized)', desc: 'Highest degree certificate with notarization' },
                { type: 'transcript', label: 'Academic Transcripts (Notarized)', desc: 'Official transcripts with notarization' },
                { type: 'study_plan', label: 'Study Plan', desc: 'Detailed study plan for the program' },
                { type: 'recommendation', label: 'Recommendation Letters (2)', desc: 'From professors or supervisors' },
                { type: 'cv', label: 'CV / Resume', desc: 'Comprehensive curriculum vitae' },
                { type: 'photo', label: 'Passport-size Photos', desc: 'Recent photos meeting Chinese visa requirements' },
                { type: 'medical_exam', label: 'Health Examination Form', desc: 'Foreigner Physical Examination Form' },
                { type: 'police_clearance', label: 'Non-criminal Record', desc: 'Police clearance certificate' },
              ].map((doc) => {
                const uploaded = documents.some(d => d.document_type === doc.type)
                return (
                  <div key={doc.type} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                      uploaded ? 'bg-green-500/20' : 'border-2 border-muted-foreground/30'
                    }`}>
                      {uploaded && <IconStar className="h-3 w-3 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Additional Documents (Program-Specific)</h4>
            <div className="grid gap-2">
              {[
                { type: 'language_certificate', label: 'HSK / IELTS / TOEFL Certificate', desc: 'Language proficiency test results' },
                { type: 'financial_proof', label: 'Bank Statement', desc: 'Financial guarantee document' },
                { type: 'other', label: 'Other Documents', desc: 'Program-specific requirements' },
              ].map((doc) => {
                const uploaded = documents.some(d => d.document_type === doc.type)
                return (
                  <div key={doc.type} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                      uploaded ? 'bg-green-500/20' : 'border-2 border-muted-foreground/30'
                    }`}>
                      {uploaded && <IconStar className="h-3 w-3 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
