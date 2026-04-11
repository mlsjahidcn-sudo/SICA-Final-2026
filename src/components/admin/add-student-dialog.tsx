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
    // Personal info (required)
    full_name: "",
    email: "",
    phone: "",
    // Personal details
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
    // Only require full_name
    if (!formData.full_name) {
      toast.error("Full name is required")
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
          skip_user_creation: true, // Flag to skip user account creation
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      toast.success('Student created successfully')
      setOpen(false)
      setFormData({
        full_name: "",
        email: "",
        phone: "",
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
            Enter student information. Only full name is required.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="Enter nationality"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Personal Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
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
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_number">Passport Number</Label>
                  <Input
                    id="passport_number"
                    value={formData.passport_number}
                    onChange={(e) => handleInputChange("passport_number", e.target.value)}
                    placeholder="Enter passport number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport_expiry_date">Passport Expiry</Label>
                  <Input
                    id="passport_expiry_date"
                    type="date"
                    value={formData.passport_expiry_date}
                    onChange={(e) => handleInputChange("passport_expiry_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <Input
                    id="current_address"
                    value={formData.current_address}
                    onChange={(e) => handleInputChange("current_address", e.target.value)}
                    placeholder="Enter current address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wechat_id">WeChat ID</Label>
                  <Input
                    id="wechat_id"
                    value={formData.wechat_id}
                    onChange={(e) => handleInputChange("wechat_id", e.target.value)}
                    placeholder="Enter WeChat ID"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                    placeholder="Enter contact phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                    placeholder="Enter relationship"
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Education Background</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highest_education">Highest Education</Label>
                  <Select value={formData.highest_education} onValueChange={(v) => handleInputChange("highest_education", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="associate">Associate Degree</SelectItem>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution_name">Institution Name</Label>
                  <Input
                    id="institution_name"
                    value={formData.institution_name}
                    onChange={(e) => handleInputChange("institution_name", e.target.value)}
                    placeholder="Enter institution name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_of_study">Field of Study</Label>
                  <Input
                    id="field_of_study"
                    value={formData.field_of_study}
                    onChange={(e) => handleInputChange("field_of_study", e.target.value)}
                    placeholder="Enter field of study"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduation_date">Graduation Date</Label>
                  <Input
                    id="graduation_date"
                    type="date"
                    value={formData.graduation_date}
                    onChange={(e) => handleInputChange("graduation_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    value={formData.gpa}
                    onChange={(e) => handleInputChange("gpa", e.target.value)}
                    placeholder="Enter GPA"
                  />
                </div>
              </div>
            </div>

            {/* Language Scores */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Language Scores</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hsk_level">HSK Level</Label>
                  <Select value={formData.hsk_level} onValueChange={(v) => handleInputChange("hsk_level", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select HSK level" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Input
                    id="hsk_score"
                    type="number"
                    value={formData.hsk_score}
                    onChange={(e) => handleInputChange("hsk_score", e.target.value)}
                    placeholder="Enter HSK score"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ielts_score">IELTS Score</Label>
                  <Input
                    id="ielts_score"
                    value={formData.ielts_score}
                    onChange={(e) => handleInputChange("ielts_score", e.target.value)}
                    placeholder="e.g., 6.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toefl_score">TOEFL Score</Label>
                  <Input
                    id="toefl_score"
                    type="number"
                    value={formData.toefl_score}
                    onChange={(e) => handleInputChange("toefl_score", e.target.value)}
                    placeholder="Enter TOEFL score"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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
