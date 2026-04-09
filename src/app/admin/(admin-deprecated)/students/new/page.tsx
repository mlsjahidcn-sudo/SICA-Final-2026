'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  IconArrowLeft,
  IconLoader2,
  IconUser,
  IconUserShield,
  IconBook,
  IconFileText,
  IconCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';

export default function AdminAddStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  const [formData, setFormData] = useState({
    // Account
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    partner_id: '',
    // Personal
    nationality: '',
    date_of_birth: '',
    gender: '',
    passport_number: '',
    passport_expiry_date: '',
    current_address: '',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    // Academic
    highest_education: '',
    institution_name: '',
    field_of_study: '',
    graduation_date: '',
    gpa: '',
    hsk_level: '',
    hsk_score: '',
    ielts_score: '',
    toefl_score: '',
    // Additional
    personal_statement: '',
    study_plan: '',
    admin_notes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (action: 'save' | 'save_apply' = 'save') => {
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error('Email, full name, and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Student created successfully!');
        
        if (action === 'save_apply') {
          router.push(`/admin/applications/new?student=${data.student.id}`);
        } else {
          router.push(`/admin/students/${data.student.id}`);
        }
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add New Student</h1>
          <p className="text-muted-foreground text-sm">Create a new student account</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <IconUserShield className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center gap-2">
                <IconBook className="h-4 w-4" />
                Academic
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <IconFileText className="h-4 w-4" />
                Additional
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    placeholder="Student's full name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(val) => handleInputChange('role', val)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_id">Assign to Partner (Optional)</Label>
                  <Select value={formData.partner_id} onValueChange={(val) => handleInputChange('partner_id', val)}>
                    <SelectTrigger id="partner_id">
                      <SelectValue placeholder="Select a partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Partner</SelectItem>
                      {/* Partners will be loaded here dynamically */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Personal Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Country of nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(val) => handleInputChange('gender', val)}>
                    <SelectTrigger id="gender">
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
                  <Label htmlFor="passport_number">Passport Number</Label>
                  <Input
                    id="passport_number"
                    placeholder="Passport number"
                    value={formData.passport_number}
                    onChange={(e) => handleInputChange('passport_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                  <Input
                    id="passport_expiry_date"
                    type="date"
                    value={formData.passport_expiry_date}
                    onChange={(e) => handleInputChange('passport_expiry_date', e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Label htmlFor="current_address">Current Address</Label>
                <Textarea
                  id="current_address"
                  placeholder="Current residential address"
                  value={formData.current_address}
                  onChange={(e) => handleInputChange('current_address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permanent_address">Permanent Address</Label>
                <Textarea
                  id="permanent_address"
                  placeholder="Permanent home address"
                  value={formData.permanent_address}
                  onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                />
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    placeholder="Contact name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    placeholder="Contact phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    placeholder="e.g. Parent, Guardian"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highest_education">Highest Education</Label>
                  <Input
                    id="highest_education"
                    placeholder="e.g. Bachelor's Degree"
                    value={formData.highest_education}
                    onChange={(e) => handleInputChange('highest_education', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution_name">Institution Name</Label>
                  <Input
                    id="institution_name"
                    placeholder="Name of school/university"
                    value={formData.institution_name}
                    onChange={(e) => handleInputChange('institution_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_of_study">Field of Study</Label>
                  <Input
                    id="field_of_study"
                    placeholder="Major/Field of study"
                    value={formData.field_of_study}
                    onChange={(e) => handleInputChange('field_of_study', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduation_date">Graduation Date</Label>
                  <Input
                    id="graduation_date"
                    type="date"
                    value={formData.graduation_date}
                    onChange={(e) => handleInputChange('graduation_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    placeholder="e.g. 3.8"
                    value={formData.gpa}
                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hsk_level">HSK Level (Chinese)</Label>
                  <Input
                    id="hsk_level"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="1-6"
                    value={formData.hsk_level}
                    onChange={(e) => handleInputChange('hsk_level', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsk_score">HSK Score</Label>
                  <Input
                    id="hsk_score"
                    type="number"
                    placeholder="HSK score"
                    value={formData.hsk_score}
                    onChange={(e) => handleInputChange('hsk_score', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ielts_score">IELTS Score</Label>
                  <Input
                    id="ielts_score"
                    type="number"
                    step="0.5"
                    placeholder="e.g. 6.5"
                    value={formData.ielts_score}
                    onChange={(e) => handleInputChange('ielts_score', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toefl_score">TOEFL Score</Label>
                  <Input
                    id="toefl_score"
                    type="number"
                    placeholder="e.g. 90"
                    value={formData.toefl_score}
                    onChange={(e) => handleInputChange('toefl_score', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Additional Tab */}
            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personal_statement">Personal Statement</Label>
                <Textarea
                  id="personal_statement"
                  placeholder="Student's personal statement"
                  className="min-h-[120px]"
                  value={formData.personal_statement}
                  onChange={(e) => handleInputChange('personal_statement', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_plan">Study Plan in China</Label>
                <Textarea
                  id="study_plan"
                  placeholder="Student's study plan"
                  className="min-h-[120px]"
                  value={formData.study_plan}
                  onChange={(e) => handleInputChange('study_plan', e.target.value)}
                />
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes (Private)</Label>
                <Textarea
                  id="admin_notes"
                  placeholder="Private admin notes"
                  className="min-h-[100px]"
                  value={formData.admin_notes}
                  onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit('save')}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconCheck className="h-4 w-4" />
              )}
              Save Student
            </Button>
            <Button
              onClick={() => handleSubmit('save_apply')}
              disabled={isSubmitting}
            >
              Save & Create Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
