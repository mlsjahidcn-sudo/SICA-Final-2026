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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconUser,
  IconId,
  IconSchool,
  IconLanguage
} from "@tabler/icons-react"

interface Student {
  id: string
  email: string | null
  full_name: string
  phone?: string | null
  is_active?: boolean
  students?: {
    id: string
    nationality?: string
    date_of_birth?: string
    gender?: string
    passport_number?: string
    passport_expiry_date?: string
    current_address?: string
    wechat_id?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    highest_education?: string
    institution_name?: string
    field_of_study?: string
    graduation_date?: string
    gpa?: string
    hsk_level?: number | string
    hsk_score?: number | string
    ielts_score?: string
    toefl_score?: number | string
  } | null
}

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    is_active: true,
    nationality: "",
    date_of_birth: "",
    gender: "",
    passport_number: "",
    passport_expiry_date: "",
    current_address: "",
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
      setStudent(data)
      
      // Populate form data
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        is_active: data.is_active ?? true,
        nationality: data.students?.nationality || "",
        date_of_birth: data.students?.date_of_birth || "",
        gender: data.students?.gender || "",
        passport_number: data.students?.passport_number || "",
        passport_expiry_date: data.students?.passport_expiry_date || "",
        current_address: data.students?.current_address || "",
        wechat_id: data.students?.wechat_id || "",
        emergency_contact_name: data.students?.emergency_contact_name || "",
        emergency_contact_phone: data.students?.emergency_contact_phone || "",
        emergency_contact_relationship: data.students?.emergency_contact_relationship || "",
        highest_education: data.students?.highest_education || "",
        institution_name: data.students?.institution_name || "",
        field_of_study: data.students?.field_of_study || "",
        graduation_date: data.students?.graduation_date || "",
        gpa: data.students?.gpa || "",
        hsk_level: data.students?.hsk_level != null ? String(data.students.hsk_level) : "",
        hsk_score: data.students?.hsk_score != null ? String(data.students.hsk_score) : "",
        ielts_score: data.students?.ielts_score || "",
        toefl_score: data.students?.toefl_score != null ? String(data.students.toefl_score) : "",
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
          passport_number: formData.passport_number || null,
          passport_expiry_date: formData.passport_expiry_date || null,
          current_address: formData.current_address || null,
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
            <Card>
              <CardHeader>
                <CardTitle>Edit Student</CardTitle>
                <CardDescription>
                  Update student information. Email cannot be changed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="account" className="gap-2">
                      <IconUser className="h-4 w-4" />
                      Account
                    </TabsTrigger>
                    <TabsTrigger value="personal" className="gap-2">
                      <IconId className="h-4 w-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="education" className="gap-2">
                      <IconSchool className="h-4 w-4" />
                      Education
                    </TabsTrigger>
                    <TabsTrigger value="language" className="gap-2">
                      <IconLanguage className="h-4 w-4" />
                      Language
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="account" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Email (read-only)</Label>
                          <Input value={student.email || ""} disabled className="bg-muted" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="+1 234 567 8900"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="is_active">Status</Label>
                          <Select
                            value={formData.is_active ? "active" : "inactive"}
                            onValueChange={(value) => handleInputChange('is_active', value === "active")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="personal" className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="nationality">Nationality</Label>
                          <Select
                            value={formData.nationality}
                            onValueChange={(value) => handleInputChange('nationality', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                            <SelectContent>
                              {nationalities.map(n => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) => handleInputChange('gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="passport_number">Passport Number</Label>
                          <Input
                            id="passport_number"
                            placeholder="AB1234567"
                            value={formData.passport_number}
                            onChange={(e) => handleInputChange('passport_number', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="passport_expiry_date">Passport Expiry</Label>
                          <Input
                            id="passport_expiry_date"
                            type="date"
                            value={formData.passport_expiry_date}
                            onChange={(e) => handleInputChange('passport_expiry_date', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="wechat_id">WeChat ID</Label>
                          <Input
                            id="wechat_id"
                            placeholder="wechat_id"
                            value={formData.wechat_id}
                            onChange={(e) => handleInputChange('wechat_id', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="current_address">Current Address</Label>
                        <Input
                          id="current_address"
                          placeholder="123 Main St, City, Country"
                          value={formData.current_address}
                          onChange={(e) => handleInputChange('current_address', e.target.value)}
                        />
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Emergency Contact</h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="grid gap-2">
                            <Label htmlFor="emergency_contact_name">Name</Label>
                            <Input
                              id="emergency_contact_name"
                              placeholder="Contact name"
                              value={formData.emergency_contact_name}
                              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="emergency_contact_phone">Phone</Label>
                            <Input
                              id="emergency_contact_phone"
                              placeholder="+1 234 567 8900"
                              value={formData.emergency_contact_phone}
                              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                            <Input
                              id="emergency_contact_relationship"
                              placeholder="Parent, Spouse, etc."
                              value={formData.emergency_contact_relationship}
                              onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="education" className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="highest_education">Highest Education</Label>
                          <Select
                            value={formData.highest_education}
                            onValueChange={(value) => handleInputChange('highest_education', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high_school">High School</SelectItem>
                              <SelectItem value="associate">Associate Degree</SelectItem>
                              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                              <SelectItem value="master">Master's Degree</SelectItem>
                              <SelectItem value="phd">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gpa">GPA</Label>
                          <Input
                            id="gpa"
                            placeholder="3.5 / 4.0"
                            value={formData.gpa}
                            onChange={(e) => handleInputChange('gpa', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="institution_name">Institution Name</Label>
                          <Input
                            id="institution_name"
                            placeholder="University name"
                            value={formData.institution_name}
                            onChange={(e) => handleInputChange('institution_name', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="field_of_study">Field of Study</Label>
                          <Input
                            id="field_of_study"
                            placeholder="Computer Science"
                            value={formData.field_of_study}
                            onChange={(e) => handleInputChange('field_of_study', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="graduation_date">Graduation Date</Label>
                          <Input
                            id="graduation_date"
                            type="date"
                            value={formData.graduation_date}
                            onChange={(e) => handleInputChange('graduation_date', e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="language" className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="hsk_level">HSK Level</Label>
                          <Select
                            value={formData.hsk_level}
                            onValueChange={(value) => handleInputChange('hsk_level', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map(level => (
                                <SelectItem key={level} value={level.toString()}>HSK {level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="hsk_score">HSK Score</Label>
                          <Input
                            id="hsk_score"
                            type="number"
                            placeholder="180"
                            value={formData.hsk_score}
                            onChange={(e) => handleInputChange('hsk_score', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ielts_score">IELTS Score</Label>
                          <Input
                            id="ielts_score"
                            placeholder="7.0"
                            value={formData.ielts_score}
                            onChange={(e) => handleInputChange('ielts_score', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="toefl_score">TOEFL Score</Label>
                          <Input
                            id="toefl_score"
                            type="number"
                            placeholder="100"
                            value={formData.toefl_score}
                            onChange={(e) => handleInputChange('toefl_score', e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                <Separator className="my-6" />

                <div className="flex items-center justify-end gap-2">
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
              </CardContent>
            </Card>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
