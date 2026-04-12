"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { IconEdit } from "@tabler/icons-react"
import { toast } from "sonner"

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

interface EditStudentDialogProps {
  student: Student
  onStudentUpdated?: () => void
  trigger?: React.ReactNode
}

export function EditStudentDialog({ student, onStudentUpdated, trigger }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: student.full_name || "",
    phone: student.phone || "",
    is_active: student.is_active ?? true,
    nationality: student.students?.nationality || "",
    date_of_birth: student.students?.date_of_birth || "",
    gender: student.students?.gender || "",
    passport_number: student.students?.passport_number || "",
    passport_expiry_date: student.students?.passport_expiry_date || "",
    current_address: student.students?.current_address || "",
    wechat_id: student.students?.wechat_id || "",
    emergency_contact_name: student.students?.emergency_contact_name || "",
    emergency_contact_phone: student.students?.emergency_contact_phone || "",
    emergency_contact_relationship: student.students?.emergency_contact_relationship || "",
    highest_education: student.students?.highest_education || "",
    institution_name: student.students?.institution_name || "",
    field_of_study: student.students?.field_of_study || "",
    graduation_date: student.students?.graduation_date || "",
    gpa: student.students?.gpa || "",
    hsk_level: student.students?.hsk_level?.toString() || "",
    hsk_score: student.students?.hsk_score?.toString() || "",
    ielts_score: student.students?.ielts_score || "",
    toefl_score: student.students?.toefl_score?.toString() || "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        full_name: student.full_name || "",
        phone: student.phone || "",
        is_active: student.is_active ?? true,
        nationality: student.students?.nationality || "",
        date_of_birth: student.students?.date_of_birth || "",
        gender: student.students?.gender || "",
        passport_number: student.students?.passport_number || "",
        passport_expiry_date: student.students?.passport_expiry_date || "",
        current_address: student.students?.current_address || "",
        wechat_id: student.students?.wechat_id || "",
        emergency_contact_name: student.students?.emergency_contact_name || "",
        emergency_contact_phone: student.students?.emergency_contact_phone || "",
        emergency_contact_relationship: student.students?.emergency_contact_relationship || "",
        highest_education: student.students?.highest_education || "",
        institution_name: student.students?.institution_name || "",
        field_of_study: student.students?.field_of_study || "",
        graduation_date: student.students?.graduation_date || "",
        gpa: student.students?.gpa || "",
        hsk_level: student.students?.hsk_level?.toString() || "",
        hsk_score: student.students?.hsk_score?.toString() || "",
        ielts_score: student.students?.ielts_score || "",
        toefl_score: student.students?.toefl_score?.toString() || "",
      })
    }
  }, [open, student])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.full_name) {
      toast.error("Full name is required")
      return
    }

    setIsLoading(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()

      const response = await fetch(`/api/admin/students/${student.id}`, {
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
      setOpen(false)
      onStudentUpdated?.()
    } catch (error) {
      console.error('Error updating student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update student')
    } finally {
      setIsLoading(false)
    }
  }

  const nationalities = [
    'China', 'Nigeria', 'Pakistan', 'India', 'Bangladesh', 'Indonesia', 
    'Thailand', 'Vietnam', 'Russia', 'Kazakhstan', 'South Korea', 'Japan',
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Brazil', 'Mexico', 'Egypt', 'Turkey'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] w-full pr-4">
            <TabsContent value="account" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Email (read-only)</Label>
                  <Input value={student.email} disabled className="bg-muted" />
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
            
            <TabsContent value="personal" className="space-y-4 mt-4">
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
              <div className="border-t pt-4 mt-4">
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
            
            <TabsContent value="education" className="space-y-4 mt-4">
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
            
            <TabsContent value="language" className="space-y-4 mt-4">
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
          </ScrollArea>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
