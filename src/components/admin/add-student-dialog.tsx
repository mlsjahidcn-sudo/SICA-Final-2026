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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { IconUserPlus } from "@tabler/icons-react"
import { toast } from "sonner"

interface AddStudentDialogProps {
  onStudentAdded?: () => void
  trigger?: React.ReactNode
}

export function AddStudentDialog({ onStudentAdded, trigger }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Account info
    email: "",
    password: "",
    full_name: "",
    // Personal info
    nationality: "",
    date_of_birth: "",
    gender: "",
    passport_number: "",
    passport_expiry_date: "",
    current_address: "",
    wechat_id: "",
    // Emergency contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    // Education
    highest_education: "",
    institution_name: "",
    field_of_study: "",
    graduation_date: "",
    gpa: "",
    // Language scores
    hsk_level: "",
    hsk_score: "",
    ielts_score: "",
    toefl_score: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error("Email, full name, and password are required")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
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
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      toast.success('Student created successfully')
      setOpen(false)
      setFormData({
        email: "",
        password: "",
        full_name: "",
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
      onStudentAdded?.()
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create student')
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
          <Button>
            <IconUserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a new student account. Fill in the required fields and any optional information.
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
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
            Create Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
