"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  IconArrowLeft,
  IconBuilding,
  IconDeviceFloppy,
  IconMapPin,
  IconSchool,
  IconCurrencyDollar,
  IconPhone,
  IconWorld,
  IconPhoto,
  IconCalendar,
  IconTag,
  IconSearch,
  IconListDetails,
  IconPencil,
  IconX
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const provinces = [
  'Beijing', 'Shanghai', 'Tianjin', 'Chongqing',
  'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 
  'Hubei', 'Sichuan', 'Henan', 'Hebei', 
  'Hunan', 'Anhui', 'Fujian', 'Liaoning',
  'Shaanxi', 'Jilin', 'Heilongjiang', 'Jiangxi',
  'Yunnan', 'Guizhou', 'Guangxi', 'Hainan',
  'Gansu', 'Qinghai', 'Ningxia', 'Xinjiang',
  'Inner Mongolia', 'Tibet'
]

const universityCategories = [
  'Comprehensive',
  'Science & Technology',
  'Medical',
  'Agricultural',
  'Normal (Teacher Training)',
  'Finance & Economics',
  'Language',
  'Arts',
  'Law',
  'Sports',
  'Pharmaceutical',
  'Aerospace',
  'Maritime',
  'Petroleum',
  'Forestry'
]

const classificationTypes = [
  { value: '985', label: '985 Project', color: 'bg-red-500/10 text-red-600 border-red-200' },
  { value: '211', label: '211 Project', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'Double First-Class', label: 'Double First-Class', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { value: 'Provincial', label: 'Provincial Key', color: 'bg-green-500/10 text-green-600 border-green-200' },
]

const currencies = ['CNY', 'USD', 'EUR', 'GBP']

const intakeMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const teachingLanguageOptions = ['Chinese', 'English', 'Bilingual', 'Other']

interface UniversityFormData {
  // Basic Info
  name_en: string
  name_cn: string
  short_name: string
  slug: string
  founded_year: string
  website: string
  
  // Location
  province: string
  city: string
  address: string
  address_en: string
  address_cn: string
  country: string
  latitude: string
  longitude: string
  
  // Classification
  type: string[]
  category: string
  tier: string
  ranking_national: string
  ranking_international: string
  
  // Statistics
  student_count: string
  international_student_count: string
  faculty_count: string
  
  // Media
  logo_url: string
  cover_image_url: string
  og_image: string
  images: string
  video_urls: string
  
  // Academic
  teaching_languages: string[]
  description: string
  description_en: string
  description_cn: string
  facilities: string
  facilities_en: string
  facilities_cn: string
  accommodation_info: string
  accommodation_info_en: string
  accommodation_info_cn: string
  
  // Contact
  contact_email: string
  contact_phone: string
  
  // Tuition & Scholarships
  tuition_min: string
  tuition_max: string
  tuition_currency: string
  default_tuition_per_year: string
  default_tuition_currency: string
  use_default_tuition: boolean
  scholarship_available: boolean
  scholarship_percentage: string
  has_application_fee: boolean
  
  // Admissions
  application_deadline: string
  intake_months: string[]
  csca_required: boolean
  acceptance_flexibility: string
  
  // SEO
  meta_title: string
  meta_description: string
  meta_keywords: string
  
  // Settings
  is_active: boolean
}

const initialFormData: UniversityFormData = {
  name_en: '',
  name_cn: '',
  short_name: '',
  slug: '',
  founded_year: '',
  website: '',
  province: '',
  city: '',
  address: '',
  address_en: '',
  address_cn: '',
  country: 'China',
  latitude: '',
  longitude: '',
  type: [],
  category: '',
  tier: '',
  ranking_national: '',
  ranking_international: '',
  student_count: '',
  international_student_count: '',
  faculty_count: '',
  logo_url: '',
  cover_image_url: '',
  og_image: '',
  images: '',
  video_urls: '',
  teaching_languages: [],
  description: '',
  description_en: '',
  description_cn: '',
  facilities: '',
  facilities_en: '',
  facilities_cn: '',
  accommodation_info: '',
  accommodation_info_en: '',
  accommodation_info_cn: '',
  contact_email: '',
  contact_phone: '',
  tuition_min: '',
  tuition_max: '',
  tuition_currency: 'CNY',
  default_tuition_per_year: '',
  default_tuition_currency: 'CNY',
  use_default_tuition: false,
  scholarship_available: false,
  scholarship_percentage: '',
  has_application_fee: false,
  application_deadline: '',
  intake_months: [],
  csca_required: false,
  acceptance_flexibility: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  is_active: true,
}

// Program interface
interface Program {
  id: string
  name_en: string
  name_cn?: string
  degree_type: string
  major: string
  discipline?: string
  teaching_language?: string
  duration_months?: number
  tuition_per_year?: number
  tuition_currency?: string
  scholarship_available?: boolean
  is_active: boolean
  description?: string
}

// Scholarship interface
interface Scholarship {
  id: string
  name_en: string
  name_cn?: string
  type?: string
  coverage_percentage?: number
  coverage_tuition?: boolean
  coverage_accommodation?: boolean
  coverage_stipend?: boolean
  coverage_medical?: boolean
  stipend_amount?: number
  stipend_currency?: string
  description?: string
  eligibility?: string
  application_process?: string
  deadline?: string
  is_active: boolean
}

// Programs Management Component
function ProgramsManagement({ universityId }: { universityId: string }) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  
  // New program form state
  const [newProgram, setNewProgram] = useState({
    name_en: '',
    name_cn: '',
    degree_type: 'Bachelor',
    major: '',
    discipline: '',
    teaching_language: 'English',
    duration_months: '',
    tuition_per_year: '',
    tuition_currency: 'CNY',
    scholarship_available: false,
    description: '',
    is_active: true,
  })

  // Batch programs state
  const [batchPrograms, setBatchPrograms] = useState('')

  const degreeTypes = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate', 'Diploma']
  const disciplines = [
    'Engineering', 'Science', 'Medicine', 'Business', 'Economics', 'Law',
    'Education', 'Arts', 'Humanities', 'Agriculture', 'Computer Science', 'Other'
  ]
  const teachingLanguages = ['Chinese', 'English', 'Bilingual']

  useEffect(() => {
    fetchPrograms()
  }, [universityId])

  const fetchPrograms = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/universities/${universityId}/programs?status=all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load programs')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setNewProgram({
      name_en: '',
      name_cn: '',
      degree_type: 'Bachelor',
      major: '',
      discipline: '',
      teaching_language: 'English',
      duration_months: '',
      tuition_per_year: '',
      tuition_currency: 'CNY',
      scholarship_available: false,
      description: '',
      is_active: true,
    })
    setEditingProgram(null)
  }

  const handleAddProgram = async () => {
    if (!newProgram.name_en) {
      toast.error('Please enter program name')
      return
    }

    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/universities/${universityId}/programs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProgram,
          duration_months: newProgram.duration_months ? parseInt(newProgram.duration_months) : null,
          tuition_per_year: newProgram.tuition_per_year ? parseFloat(newProgram.tuition_per_year) : null,
        }),
      })

      if (response.ok) {
        toast.success('Program added successfully')
        setIsAddDialogOpen(false)
        resetForm()
        fetchPrograms()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add program')
      }
    } catch (error) {
      console.error('Error adding program:', error)
      toast.error('Failed to add program')
    }
  }

  const handleEditProgram = async () => {
    if (!editingProgram || !newProgram.name_en) {
      toast.error('Please enter program name')
      return
    }

    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProgram,
          duration_months: newProgram.duration_months ? parseInt(newProgram.duration_months) : null,
          tuition_per_year: newProgram.tuition_per_year ? parseFloat(newProgram.tuition_per_year) : null,
        }),
      })

      if (response.ok) {
        toast.success('Program updated successfully')
        setIsAddDialogOpen(false)
        resetForm()
        fetchPrograms()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update program')
      }
    } catch (error) {
      console.error('Error updating program:', error)
      toast.error('Failed to update program')
    }
  }

  const openEditDialog = (program: Program) => {
    setEditingProgram(program)
    setNewProgram({
      name_en: program.name_en,
      name_cn: program.name_cn || '',
      degree_type: program.degree_type,
      major: program.major || program.name_en,
      discipline: program.discipline || '',
      teaching_language: program.teaching_language || 'English',
      duration_months: program.duration_months?.toString() || '',
      tuition_per_year: program.tuition_per_year?.toString() || '',
      tuition_currency: program.tuition_currency || 'CNY',
      scholarship_available: program.scholarship_available || false,
      description: program.description || '',
      is_active: program.is_active,
    })
    setIsAddDialogOpen(true)
  }

  const handleBatchAdd = async () => {
    if (!batchPrograms.trim()) {
      toast.error('Please enter program data')
      return
    }

    // Parse batch data - one program per line, format: name|degree|major|discipline|tuition
    const lines = batchPrograms.split('\n').filter(line => line.trim())
    const programsToAdd = lines.map(line => {
      const parts = line.split('|').map(p => p.trim())
      return {
        name_en: parts[0] || '',
        degree_type: parts[1] || 'Bachelor',
        major: parts[2] || parts[0] || '',
        discipline: parts[3] || '',
        tuition_per_year: parts[4] ? parseFloat(parts[4]) : null,
        teaching_language: 'English',
        tuition_currency: 'CNY',
        is_active: true,
      }
    }).filter(p => p.name_en)

    if (programsToAdd.length === 0) {
      toast.error('No valid programs found')
      return
    }

    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/universities/${universityId}/programs`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programs: programsToAdd }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.count} programs added successfully`)
        setIsBatchDialogOpen(false)
        setBatchPrograms('')
        fetchPrograms()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add programs')
      }
    } catch (error) {
      console.error('Error batch adding programs:', error)
      toast.error('Failed to add programs')
    }
  }

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return

    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Program deleted')
        fetchPrograms()
      } else {
        toast.error('Failed to delete program')
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast.error('Failed to delete program')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconListDetails className="h-5 w-5" />
                Programs ({programs.length})
              </CardTitle>
              <CardDescription>
                Manage programs offered by this university
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsBatchDialogOpen(true)}>
                Batch Add
              </Button>
              <Button size="sm" type="button" onClick={() => setIsAddDialogOpen(true)}>
                Add Program
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No programs added yet. Click &quot;Add Program&quot; to add the first program.
            </div>
          ) : (
            <div className="space-y-2">
              {programs.map((program) => (
                <div
                  key={program.id as string}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{program.name_en as string}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{program.degree_type as string}</Badge>
                      <span>{program.major as string}</span>
                      {program.tuition_per_year && (
                        <span>• ¥{Number(program.tuition_per_year).toLocaleString()}/year</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={program.is_active ? "default" : "secondary"}>
                      {program.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(program)}
                      title="Edit program"
                    >
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProgram(program.id as string)}
                      title="Delete program"
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Program Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</CardTitle>
              <CardDescription>
                {editingProgram ? 'Update program information' : 'Add a new program to this university'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Program Name (English) *</Label>
                  <Input
                    value={newProgram.name_en}
                    onChange={(e) => setNewProgram({ ...newProgram, name_en: e.target.value })}
                    placeholder="e.g., Computer Science and Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program Name (Chinese)</Label>
                  <Input
                    value={newProgram.name_cn}
                    onChange={(e) => setNewProgram({ ...newProgram, name_cn: e.target.value })}
                    placeholder="e.g., 计算机科学与技术"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Degree Type *</Label>
                  <Select value={newProgram.degree_type} onValueChange={(v) => setNewProgram({ ...newProgram, degree_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {degreeTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Major *</Label>
                  <Input
                    value={newProgram.major}
                    onChange={(e) => setNewProgram({ ...newProgram, major: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discipline</Label>
                  <Select value={newProgram.discipline} onValueChange={(v) => setNewProgram({ ...newProgram, discipline: v })}>
                    <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
                    <SelectContent>
                      {disciplines.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teaching Language</Label>
                  <Select value={newProgram.teaching_language} onValueChange={(v) => setNewProgram({ ...newProgram, teaching_language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {teachingLanguages.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Duration (months)</Label>
                  <Input
                    type="number"
                    value={newProgram.duration_months}
                    onChange={(e) => setNewProgram({ ...newProgram, duration_months: e.target.value })}
                    placeholder="e.g., 48"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tuition/Year</Label>
                  <Input
                    type="number"
                    value={newProgram.tuition_per_year}
                    onChange={(e) => setNewProgram({ ...newProgram, tuition_per_year: e.target.value })}
                    placeholder="e.g., 25000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={newProgram.tuition_currency} onValueChange={(v) => setNewProgram({ ...newProgram, tuition_currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Program description..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newProgram.scholarship_available}
                    onCheckedChange={(c) => setNewProgram({ ...newProgram, scholarship_available: c })}
                  />
                  <Label className="font-normal">Scholarship Available</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newProgram.is_active}
                    onCheckedChange={(c) => setNewProgram({ ...newProgram, is_active: c })}
                  />
                  <Label className="font-normal">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={editingProgram ? handleEditProgram : handleAddProgram}>
                  {editingProgram ? 'Update Program' : 'Add Program'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Add Dialog */}
      {isBatchDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Batch Add Programs</CardTitle>
              <CardDescription>
                Add multiple programs at once. One program per line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Format:</p>
                <code className="text-xs bg-background px-2 py-1 rounded block">
                  Program Name | Degree | Major | Discipline | Tuition
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  • All fields are optional except Program Name<br/>
                  • Degree options: Bachelor, Master, PhD, Associate, Certificate, Diploma<br/>
                  • Discipline options: Engineering, Science, Medicine, Business, Economics, Law, Education, Arts, Humanities, Agriculture, Computer Science, Other<br/>
                  • Tuition is per year in CNY
                </p>
              </div>
              <div className="space-y-2">
                <Label>Program Data</Label>
                <Textarea
                  value={batchPrograms}
                  onChange={(e) => setBatchPrograms(e.target.value)}
                  placeholder={"Computer Science and Technology|Bachelor|Computer Science|Engineering|25000\nBusiness Administration|Master|MBA|Business|35000\nElectronic Engineering|Bachelor|Electronics|Engineering|28000"}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBatchAdd}>Add Programs</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Scholarships Management Component
function ScholarshipsManagement({ universityId }: { universityId: string }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null)
  
  const [scholarshipForm, setScholarshipForm] = useState({
    name_en: '',
    name_cn: '',
    type: 'University',
    coverage_percentage: '',
    coverage_tuition: true,
    coverage_accommodation: false,
    coverage_stipend: false,
    coverage_medical: false,
    stipend_amount: '',
    stipend_currency: 'CNY',
    description: '',
    eligibility: '',
    application_process: '',
    deadline: '',
    is_active: true,
  })

  const scholarshipTypes = [
    'Full', 'Partial', 'Merit-based', 'Need-based', 
    'Government', 'University', 'CSC', 'Provincial', 'Other'
  ]

  useEffect(() => {
    fetchScholarships()
  }, [universityId])

  const fetchScholarships = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/universities/${universityId}/scholarships`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setScholarships(data.scholarships || [])
      }
    } catch (error) {
      console.error('Error fetching scholarships:', error)
      toast.error('Failed to load scholarships')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setScholarshipForm({
      name_en: '',
      name_cn: '',
      type: 'University',
      coverage_percentage: '',
      coverage_tuition: true,
      coverage_accommodation: false,
      coverage_stipend: false,
      coverage_medical: false,
      stipend_amount: '',
      stipend_currency: 'CNY',
      description: '',
      eligibility: '',
      application_process: '',
      deadline: '',
      is_active: true,
    })
    setEditingScholarship(null)
  }

  const handleSubmit = async () => {
    if (!scholarshipForm.name_en) {
      toast.error('Please enter scholarship name')
      return
    }

    try {
      const token = localStorage.getItem('sica_auth_token')
      const url = editingScholarship
        ? `/api/admin/universities/${universityId}/scholarships/${editingScholarship.id}`
        : `/api/admin/universities/${universityId}/scholarships`
      const method = editingScholarship ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scholarshipForm,
          coverage_percentage: scholarshipForm.coverage_percentage ? parseInt(scholarshipForm.coverage_percentage) : null,
          stipend_amount: scholarshipForm.stipend_amount ? parseFloat(scholarshipForm.stipend_amount) : null,
        }),
      })

      if (response.ok) {
        toast.success(editingScholarship ? 'Scholarship updated' : 'Scholarship added')
        setIsAddDialogOpen(false)
        resetForm()
        fetchScholarships()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save scholarship')
      }
    } catch (error) {
      console.error('Error saving scholarship:', error)
      toast.error('Failed to save scholarship')
    }
  }

  const handleEdit = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship)
    setScholarshipForm({
      name_en: scholarship.name_en || '',
      name_cn: scholarship.name_cn || '',
      type: scholarship.type || 'University',
      coverage_percentage: scholarship.coverage_percentage?.toString() || '',
      coverage_tuition: scholarship.coverage_tuition ?? false,
      coverage_accommodation: scholarship.coverage_accommodation ?? false,
      coverage_stipend: scholarship.coverage_stipend ?? false,
      coverage_medical: scholarship.coverage_medical ?? false,
      stipend_amount: scholarship.stipend_amount?.toString() || '',
      stipend_currency: scholarship.stipend_currency || 'CNY',
      description: scholarship.description || '',
      eligibility: scholarship.eligibility || '',
      application_process: scholarship.application_process as string || '',
      deadline: scholarship.deadline as string || '',
      is_active: scholarship.is_active as boolean ?? true,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (scholarshipId: string) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) return

    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch(`/api/admin/universities/${universityId}/scholarships/${scholarshipId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success('Scholarship deleted')
        fetchScholarships()
      } else {
        toast.error('Failed to delete scholarship')
      }
    } catch (error) {
      console.error('Error deleting scholarship:', error)
      toast.error('Failed to delete scholarship')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconWorld className="h-5 w-5" />
                Scholarships ({scholarships.length})
              </CardTitle>
              <CardDescription>
                Manage scholarships offered by this university
              </CardDescription>
            </div>
            <Button size="sm" type="button" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              Add Scholarship
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scholarships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scholarships added yet. Click &quot;Add Scholarship&quot; to add the first one.
            </div>
          ) : (
            <div className="space-y-2">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.id as string}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{scholarship.name_en as string}</span>
                      <Badge variant="outline" className="text-xs">{scholarship.type as string}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {scholarship.coverage_percentage && <span>{scholarship.coverage_percentage}% coverage</span>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scholarship.coverage_tuition && <Badge variant="secondary" className="text-xs">Tuition</Badge>}
                        {scholarship.coverage_accommodation && <Badge variant="secondary" className="text-xs">Accommodation</Badge>}
                        {scholarship.coverage_stipend && <Badge variant="secondary" className="text-xs">Stipend</Badge>}
                        {scholarship.coverage_medical && <Badge variant="secondary" className="text-xs">Medical</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={scholarship.is_active ? "default" : "secondary"}>
                      {scholarship.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(scholarship)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(scholarship.id as string)}>
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Scholarship Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</CardTitle>
              <CardDescription>
                {editingScholarship ? 'Update scholarship information' : 'Add a new scholarship for this university'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scholarship Name (English) *</Label>
                  <Input
                    value={scholarshipForm.name_en}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, name_en: e.target.value })}
                    placeholder="e.g., Chinese Government Scholarship"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scholarship Name (Chinese)</Label>
                  <Input
                    value={scholarshipForm.name_cn}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, name_cn: e.target.value })}
                    placeholder="e.g., 中国政府奖学金"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={scholarshipForm.type} onValueChange={(v) => setScholarshipForm({ ...scholarshipForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {scholarshipTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coverage Percentage</Label>
                  <Input
                    type="number"
                    value={scholarshipForm.coverage_percentage}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, coverage_percentage: e.target.value })}
                    placeholder="e.g., 100"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <Separator />
              <div>
                <Label className="mb-2 block">Coverage Includes</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scholarshipForm.coverage_tuition}
                      onCheckedChange={(c) => setScholarshipForm({ ...scholarshipForm, coverage_tuition: c })}
                    />
                    <Label className="font-normal">Tuition</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scholarshipForm.coverage_accommodation}
                      onCheckedChange={(c) => setScholarshipForm({ ...scholarshipForm, coverage_accommodation: c })}
                    />
                    <Label className="font-normal">Accommodation</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scholarshipForm.coverage_stipend}
                      onCheckedChange={(c) => setScholarshipForm({ ...scholarshipForm, coverage_stipend: c })}
                    />
                    <Label className="font-normal">Monthly Stipend</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scholarshipForm.coverage_medical}
                      onCheckedChange={(c) => setScholarshipForm({ ...scholarshipForm, coverage_medical: c })}
                    />
                    <Label className="font-normal">Medical Insurance</Label>
                  </div>
                </div>
              </div>

              {scholarshipForm.coverage_stipend && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stipend Amount (Monthly)</Label>
                    <Input
                      type="number"
                      value={scholarshipForm.stipend_amount}
                      onChange={(e) => setScholarshipForm({ ...scholarshipForm, stipend_amount: e.target.value })}
                      placeholder="e.g., 3000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={scholarshipForm.stipend_currency} onValueChange={(v) => setScholarshipForm({ ...scholarshipForm, stipend_currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNY">CNY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={scholarshipForm.description}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, description: e.target.value })}
                  placeholder="Brief description of the scholarship..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Eligibility Requirements</Label>
                <Textarea
                  value={scholarshipForm.eligibility}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, eligibility: e.target.value })}
                  placeholder="Who can apply..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Application Process</Label>
                <Textarea
                  value={scholarshipForm.application_process}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, application_process: e.target.value })}
                  placeholder="How to apply..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Application Deadline</Label>
                <Input
                  value={scholarshipForm.deadline}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, deadline: e.target.value })}
                  placeholder="e.g., March 31, 2025"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={scholarshipForm.is_active}
                  onCheckedChange={(c) => setScholarshipForm({ ...scholarshipForm, is_active: c })}
                />
                <Label className="font-normal">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingScholarship ? 'Update Scholarship' : 'Add Scholarship'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

function EditUniversityContent({ universityId }: { universityId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData)

  useEffect(() => {
    async function fetchUniversity() {
      try {
        const token = localStorage.getItem('sica_auth_token')
        const response = await fetch(`/api/admin/universities/${universityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const u = data.university || data
          setFormData({
            name_en: u.name_en || '',
            name_cn: u.name_cn || '',
            short_name: u.short_name || '',
            slug: u.slug || '',
            founded_year: u.founded_year?.toString() || '',
            website: u.website || '',
            province: u.province || '',
            city: u.city || '',
            address: u.address || '',
            address_en: u.address_en || '',
            address_cn: u.address_cn || '',
            country: u.country || 'China',
            latitude: u.latitude?.toString() || '',
            longitude: u.longitude?.toString() || '',
            type: Array.isArray(u.type) ? u.type : (u.type ? [u.type] : []),
            category: u.category || '',
            tier: u.tier || '',
            ranking_national: u.ranking_national?.toString() || '',
            ranking_international: u.ranking_international?.toString() || '',
            student_count: u.student_count?.toString() || '',
            international_student_count: u.international_student_count?.toString() || '',
            faculty_count: u.faculty_count?.toString() || '',
            logo_url: u.logo_url || '',
            cover_image_url: u.cover_image_url || '',
            og_image: u.og_image || '',
            images: Array.isArray(u.images) ? u.images.join('\n') : (u.images || ''),
            video_urls: Array.isArray(u.video_urls) ? u.video_urls.join('\n') : (u.video_urls || ''),
            teaching_languages: Array.isArray(u.teaching_languages) ? u.teaching_languages : [],
            description: u.description || '',
            description_en: u.description_en || '',
            description_cn: u.description_cn || '',
            facilities: u.facilities || '',
            facilities_en: u.facilities_en || '',
            facilities_cn: u.facilities_cn || '',
            accommodation_info: u.accommodation_info || '',
            accommodation_info_en: u.accommodation_info_en || '',
            accommodation_info_cn: u.accommodation_info_cn || '',
            contact_email: u.contact_email || '',
            contact_phone: u.contact_phone || '',
            tuition_min: u.tuition_min?.toString() || '',
            tuition_max: u.tuition_max?.toString() || '',
            tuition_currency: u.tuition_currency || 'CNY',
            default_tuition_per_year: u.default_tuition_per_year?.toString() || '',
            default_tuition_currency: u.default_tuition_currency || 'CNY',
            use_default_tuition: u.use_default_tuition || false,
            scholarship_available: u.scholarship_available || false,
            scholarship_percentage: u.scholarship_percentage?.toString() || '',
            has_application_fee: u.has_application_fee || false,
            application_deadline: u.application_deadline || '',
            intake_months: Array.isArray(u.intake_months) ? u.intake_months : [],
            csca_required: u.csca_required || false,
            acceptance_flexibility: u.acceptance_flexibility || '',
            meta_title: u.meta_title || '',
            meta_description: u.meta_description || '',
            meta_keywords: Array.isArray(u.meta_keywords) ? u.meta_keywords.join(', ') : (u.meta_keywords || ''),
            is_active: u.is_active ?? true,
          })
        } else {
          toast.error('Failed to load university')
          router.push('/admin/v2/universities')
        }
      } catch (error) {
        console.error('Error fetching university:', error)
        toast.error('Failed to load university')
        router.push('/admin/v2/universities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUniversity()
  }, [universityId, router])

  const handleTypeToggle = (typeValue: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(typeValue)
        ? prev.type.filter(t => t !== typeValue)
        : [...prev.type, typeValue]
    }))
  }

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      teaching_languages: prev.teaching_languages.includes(lang)
        ? prev.teaching_languages.filter(l => l !== lang)
        : [...prev.teaching_languages, lang]
    }))
  }

  const handleIntakeToggle = (month: string) => {
    setFormData(prev => ({
      ...prev,
      intake_months: prev.intake_months.includes(month)
        ? prev.intake_months.filter(m => m !== month)
        : [...prev.intake_months, month]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name_en || !formData.province || !formData.city) {
      toast.error('Please fill in all required fields (Name, Province, City)')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('sica_auth_token')
      
      const submitData = {
        ...formData,
        ranking_national: formData.ranking_national ? parseInt(formData.ranking_national) : null,
        ranking_international: formData.ranking_international ? parseInt(formData.ranking_international) : null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        student_count: formData.student_count ? parseInt(formData.student_count) : null,
        international_student_count: formData.international_student_count ? parseInt(formData.international_student_count) : null,
        faculty_count: formData.faculty_count ? parseInt(formData.faculty_count) : null,
        tuition_min: formData.tuition_min ? parseFloat(formData.tuition_min) : null,
        tuition_max: formData.tuition_max ? parseFloat(formData.tuition_max) : null,
        default_tuition_per_year: formData.default_tuition_per_year ? parseFloat(formData.default_tuition_per_year) : null,
        scholarship_percentage: formData.scholarship_percentage ? parseInt(formData.scholarship_percentage) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: formData.images ? formData.images.split('\n').map(url => url.trim()).filter(Boolean) : null,
        video_urls: formData.video_urls ? formData.video_urls.split('\n').map(url => url.trim()).filter(Boolean) : null,
        meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
      }

      const response = await fetch(`/api/admin/universities/${universityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success('University updated successfully')
        router.push(`/admin/v2/universities/${universityId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update university')
      }
    } catch (error) {
      console.error('Error updating university:', error)
      toast.error('Failed to update university')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/v2/universities">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Universities
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/v2/universities/${universityId}`}>
              View University
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={formData.is_active ? "default" : "secondary"}>
            {formData.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:inline-grid">
            <TabsTrigger value="basic" className="gap-1">
              <IconBuilding className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1">
              <IconMapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="classification" className="gap-1">
              <IconTag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Classification</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-1">
              <IconPhoto className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-1">
              <IconSchool className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Academic</span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="gap-1">
              <IconListDetails className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Programs</span>
            </TabsTrigger>
            <TabsTrigger value="scholarships" className="gap-1">
              <IconWorld className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scholarships</span>
            </TabsTrigger>
            <TabsTrigger value="tuition" className="gap-1">
              <IconCurrencyDollar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tuition</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1">
              <IconSearch className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    University names, website, and founding details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name_en">English Name *</Label>
                      <Input
                        id="name_en"
                        placeholder="e.g., Tsinghua University"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name_cn">Chinese Name</Label>
                      <Input
                        id="name_cn"
                        placeholder="e.g., 清华大学"
                        value={formData.name_cn}
                        onChange={(e) => setFormData({ ...formData, name_cn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name / Abbreviation</Label>
                      <Input
                        id="short_name"
                        placeholder="e.g., THU"
                        value={formData.short_name}
                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="e.g., tsinghua-university"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://www.example.edu.cn"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded_year">Founded Year</Label>
                      <Input
                        id="founded_year"
                        type="number"
                        placeholder="e.g., 1911"
                        value={formData.founded_year}
                        onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconPhone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        placeholder="admissions@university.edu.cn"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        placeholder="+86 10 1234 5678"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this university visible to students
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Scholarship Available</Label>
                      <p className="text-sm text-muted-foreground">
                        University offers scholarships to international students
                      </p>
                    </div>
                    <Switch
                      checked={formData.scholarship_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, scholarship_available: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                  <CardDescription>
                    Address and geographic coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="China"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => setFormData({ ...formData, province: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov) => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Beijing"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Full street address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="address_en">Address (English)</Label>
                      <Textarea
                        id="address_en"
                        placeholder="Address in English"
                        value={formData.address_en}
                        onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_cn">Address (Chinese)</Label>
                      <Textarea
                        id="address_cn"
                        placeholder="中文地址"
                        value={formData.address_cn}
                        onChange={(e) => setFormData({ ...formData, address_cn: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 39.9042"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 116.4074"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classification Tab */}
            <TabsContent value="classification" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Classification & Rankings
                  </CardTitle>
                  <CardDescription>
                    University type, category, and ranking information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Classification Type</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select all that apply (985, 211, Double First-Class, etc.)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {classificationTypes.map((ct) => (
                        <Badge
                          key={ct.value}
                          variant={formData.type.includes(ct.value) ? "default" : "outline"}
                          className={`cursor-pointer ${formData.type.includes(ct.value) ? '' : ct.color}`}
                          onClick={() => handleTypeToggle(ct.value)}
                        >
                          {ct.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">University Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {universityCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">University Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tier 1">Tier 1 (Top)</SelectItem>
                          <SelectItem value="Tier 2">Tier 2</SelectItem>
                          <SelectItem value="Tier 3">Tier 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ranking_national">National Ranking</Label>
                      <Input
                        id="ranking_national"
                        type="number"
                        placeholder="e.g., 1"
                        value={formData.ranking_national}
                        onChange={(e) => setFormData({ ...formData, ranking_national: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ranking_international">International Ranking</Label>
                      <Input
                        id="ranking_international"
                        type="number"
                        placeholder="e.g., 20"
                        value={formData.ranking_international}
                        onChange={(e) => setFormData({ ...formData, ranking_international: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Student & Faculty Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="student_count">Total Students</Label>
                      <Input
                        id="student_count"
                        type="number"
                        placeholder="e.g., 40000"
                        value={formData.student_count}
                        onChange={(e) => setFormData({ ...formData, student_count: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="international_student_count">International Students</Label>
                      <Input
                        id="international_student_count"
                        type="number"
                        placeholder="e.g., 5000"
                        value={formData.international_student_count}
                        onChange={(e) => setFormData({ ...formData, international_student_count: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty_count">Faculty Members</Label>
                      <Input
                        id="faculty_count"
                        type="number"
                        placeholder="e.g., 3000"
                        value={formData.faculty_count}
                        onChange={(e) => setFormData({ ...formData, faculty_count: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconPhoto className="h-5 w-5" />
                    Images & Media
                  </CardTitle>
                  <CardDescription>
                    Logo, cover image, gallery, and videos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                    {formData.logo_url && (
                      <div className="flex justify-center p-4 bg-muted rounded-lg mt-2">
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="h-16 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="cover_image_url">Cover Image URL</Label>
                    <Input
                      id="cover_image_url"
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="og_image">Open Graph Image (SEO)</Label>
                    <Input
                      id="og_image"
                      type="url"
                      placeholder="https://example.com/og-image.jpg"
                      value={formData.og_image}
                      onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="images">Gallery Images (One URL per line)</Label>
                    <Textarea
                      id="images"
                      placeholder={"https://example.com/img1.jpg\nhttps://example.com/img2.jpg\nhttps://example.com/img3.jpg"}
                      value={formData.images}
                      onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one image URL per line. Images will be displayed in the university gallery.
                    </p>
                    {formData.images && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {formData.images.split('\n').filter(Boolean).slice(0, 4).map((url, idx) => (
                          <div key={idx} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                            <img 
                              src={url.trim()} 
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video_urls">Video URLs (One URL per line)</Label>
                    <Textarea
                      id="video_urls"
                      placeholder={"https://youtube.com/watch?v=xxx\nhttps://vimeo.com/xxx"}
                      value={formData.video_urls}
                      onChange={(e) => setFormData({ ...formData, video_urls: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one video URL per line. Supports YouTube, Vimeo, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSchool className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                  <CardDescription>
                    Teaching languages, description, facilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Teaching Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {teachingLanguageOptions.map((lang) => (
                        <Badge
                          key={lang}
                          variant={formData.teaching_languages.includes(lang) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleLanguageToggle(lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (General)</Label>
                    <Textarea
                      id="description"
                      placeholder="General description..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="description_en">Description (English)</Label>
                      <Textarea
                        id="description_en"
                        placeholder="Description in English..."
                        rows={4}
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description_cn">Description (Chinese)</Label>
                      <Textarea
                        id="description_cn"
                        placeholder="中文描述..."
                        rows={4}
                        value={formData.description_cn}
                        onChange={(e) => setFormData({ ...formData, description_cn: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facilities">Facilities (General)</Label>
                    <Textarea
                      id="facilities"
                      placeholder="Campus facilities..."
                      rows={3}
                      value={formData.facilities}
                      onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="facilities_en">Facilities (English)</Label>
                      <Textarea
                        id="facilities_en"
                        placeholder="Facilities in English..."
                        rows={3}
                        value={formData.facilities_en}
                        onChange={(e) => setFormData({ ...formData, facilities_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facilities_cn">Facilities (Chinese)</Label>
                      <Textarea
                        id="facilities_cn"
                        placeholder="设施介绍（中文）..."
                        rows={3}
                        value={formData.facilities_cn}
                        onChange={(e) => setFormData({ ...formData, facilities_cn: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accommodation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accommodation_info">Accommodation Info (General)</Label>
                    <Textarea
                      id="accommodation_info"
                      placeholder="Housing information..."
                      rows={3}
                      value={formData.accommodation_info}
                      onChange={(e) => setFormData({ ...formData, accommodation_info: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_info_en">Accommodation (English)</Label>
                      <Textarea
                        id="accommodation_info_en"
                        placeholder="Accommodation in English..."
                        rows={3}
                        value={formData.accommodation_info_en}
                        onChange={(e) => setFormData({ ...formData, accommodation_info_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_info_cn">Accommodation (Chinese)</Label>
                      <Textarea
                        id="accommodation_info_cn"
                        placeholder="住宿信息（中文）..."
                        rows={3}
                        value={formData.accommodation_info_cn}
                        onChange={(e) => setFormData({ ...formData, accommodation_info_cn: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <ProgramsManagement universityId={universityId} />
            </TabsContent>

            {/* Scholarships Tab */}
            <TabsContent value="scholarships" className="space-y-6">
              <ScholarshipsManagement universityId={universityId} />
            </TabsContent>

            {/* Tuition Tab */}
            <TabsContent value="tuition" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Tuition & Scholarships
                  </CardTitle>
                  <CardDescription>
                    Tuition fees and scholarship information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="tuition_min">Minimum Tuition</Label>
                      <Input
                        id="tuition_min"
                        type="number"
                        placeholder="e.g., 20000"
                        value={formData.tuition_min}
                        onChange={(e) => setFormData({ ...formData, tuition_min: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_max">Maximum Tuition</Label>
                      <Input
                        id="tuition_max"
                        type="number"
                        placeholder="e.g., 50000"
                        value={formData.tuition_max}
                        onChange={(e) => setFormData({ ...formData, tuition_max: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_currency">Currency</Label>
                      <Select
                        value={formData.tuition_currency}
                        onValueChange={(value) => setFormData({ ...formData, tuition_currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Use Default Tuition</Label>
                      <p className="text-sm text-muted-foreground">
                        Use a single default tuition amount
                      </p>
                    </div>
                    <Switch
                      checked={formData.use_default_tuition}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_default_tuition: checked })}
                    />
                  </div>
                  
                  {formData.use_default_tuition && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="default_tuition_per_year">Default Annual Tuition</Label>
                        <Input
                          id="default_tuition_per_year"
                          type="number"
                          placeholder="e.g., 30000"
                          value={formData.default_tuition_per_year}
                          onChange={(e) => setFormData({ ...formData, default_tuition_per_year: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="default_tuition_currency">Default Currency</Label>
                        <Select
                          value={formData.default_tuition_currency}
                          onValueChange={(value) => setFormData({ ...formData, default_tuition_currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((curr) => (
                              <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scholarships</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Scholarship Available</Label>
                      <p className="text-sm text-muted-foreground">
                        University offers scholarships
                      </p>
                    </div>
                    <Switch
                      checked={formData.scholarship_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, scholarship_available: checked })}
                    />
                  </div>
                  
                  {formData.scholarship_available && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_percentage">Scholarship Coverage (%)</Label>
                        <Input
                          id="scholarship_percentage"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g., 50"
                          value={formData.scholarship_percentage}
                          onChange={(e) => setFormData({ ...formData, scholarship_percentage: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Average scholarship coverage percentage
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Has Application Fee</Label>
                      <p className="text-sm text-muted-foreground">
                        University charges an application fee
                      </p>
                    </div>
                    <Switch
                      checked={formData.has_application_fee}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_application_fee: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSearch className="h-5 w-5" />
                    SEO & Meta Tags
                  </CardTitle>
                  <CardDescription>
                    Search engine optimization settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      placeholder="SEO title (max 60 characters)"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.meta_title.length}/60 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      placeholder="SEO description (max 160 characters)"
                      rows={3}
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                    <Input
                      id="meta_keywords"
                      placeholder="keyword1, keyword2, keyword3"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate keywords with commas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    Admissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal",
                              !formData.application_deadline && "text-muted-foreground"
                            )}
                          >
                            <IconCalendar className="mr-2 h-4 w-4" />
                            {formData.application_deadline
                              ? format(new Date(formData.application_deadline), "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.application_deadline ? new Date(formData.application_deadline) : undefined}
                            onSelect={(date) => setFormData({ 
                              ...formData, 
                              application_deadline: date ? format(date, "yyyy-MM-dd") : "" 
                            })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {formData.application_deadline && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData({ ...formData, application_deadline: "" })}
                          type="button"
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Intake Months</Label>
                    <div className="flex flex-wrap gap-2">
                      {intakeMonths.map((month) => (
                        <Badge
                          key={month}
                          variant={formData.intake_months.includes(month) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => handleIntakeToggle(month)}
                        >
                          {month}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CSCA Required</Label>
                      <p className="text-sm text-muted-foreground">
                        CSCA clearance certificate required
                      </p>
                    </div>
                    <Switch
                      checked={formData.csca_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, csca_required: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="acceptance_flexibility">Acceptance Flexibility</Label>
                    <Select
                      value={formData.acceptance_flexibility}
                      onValueChange={(value) => setFormData({ ...formData, acceptance_flexibility: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flexibility level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strict">Strict</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Fixed Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-4 px-6 z-50 lg:ml-64">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-sm text-muted-foreground">
                Editing: <span className="font-medium text-foreground">{formData.name_en || 'New University'}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/admin/v2/universities/${universityId}`}>
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </form>
    </div>
  )
}

export default function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
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
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Edit University" />
          <EditUniversityContent universityId={resolvedParams.id} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
