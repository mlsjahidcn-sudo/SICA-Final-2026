'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  IconArrowLeft,
  IconLoader2,
  IconUser,
  IconEPassport,
  IconSchool,
  IconUsers,
  IconStar,
  IconFileText,
  IconCheck,
  IconPlus,
  IconTrash,
  IconBriefcase,
  IconLanguage,
  IconTrophy,
  IconFlask,
  IconCurrencyDollar,
  IconBrandWechat,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import type {
  EducationHistoryEntry,
  WorkExperienceEntry,
  FamilyMemberEntry,
  ExtracurricularActivityEntry,
  AwardEntry,
  PublicationEntry,
  ResearchExperienceEntry,
  ScholarshipApplicationData,
  FinancialGuaranteeData,
} from '@/lib/student-api';

interface FormData {
  email: string;
  full_name: string;
  phone: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  current_address: string;
  postal_code: string;
  permanent_address: string;
  chinese_name: string;
  marital_status: string;
  religion: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  passport_number: string;
  passport_expiry_date: string;
  passport_issuing_country: string;
  education_history: EducationHistoryEntry[];
  work_experience: WorkExperienceEntry[];
  hsk_level: string;
  hsk_score: string;
  ielts_score: string;
  toefl_score: string;
  family_members: FamilyMemberEntry[];
  extracurricular_activities: ExtracurricularActivityEntry[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  research_experience: ResearchExperienceEntry[];
  scholarship_application: ScholarshipApplicationData;
  financial_guarantee: FinancialGuaranteeData;
  study_mode: string;
  funding_source: string;
  wechat_id: string;
}

const emptyFormData: FormData = {
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
};

export default function PartnerV2EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch student data on mount
  useEffect(() => {
    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
        if (!token) {
          toast.error('Please sign in first');
          router.push('/signin');
          return;
        }

        const response = await fetch(`/api/partner/students/${resolvedParams.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const s = data.student;
          const p = s.profile || {};

          setFormData({
            email: s.email || '',
            full_name: s.full_name || '',
            phone: s.phone || '',
            nationality: p.nationality || '',
            date_of_birth: p.date_of_birth || '',
            gender: p.gender || '',
            current_address: p.current_address || '',
            postal_code: p.postal_code || '',
            permanent_address: p.permanent_address || '',
            chinese_name: p.chinese_name || '',
            marital_status: p.marital_status || '',
            religion: p.religion || '',
            emergency_contact_name: p.emergency_contact_name || '',
            emergency_contact_phone: p.emergency_contact_phone || '',
            emergency_contact_relationship: p.emergency_contact_relationship || '',
            passport_number: p.passport_number || '',
            passport_expiry_date: p.passport_expiry_date || '',
            passport_issuing_country: p.passport_issuing_country || '',
            education_history: Array.isArray(p.education_history) ? p.education_history : [],
            work_experience: Array.isArray(p.work_experience) ? p.work_experience : [],
            hsk_level: p.hsk_level != null ? String(p.hsk_level) : '',
            hsk_score: p.hsk_score != null ? String(p.hsk_score) : '',
            ielts_score: p.ielts_score || '',
            toefl_score: p.toefl_score != null ? String(p.toefl_score) : '',
            family_members: Array.isArray(p.family_members) ? p.family_members : [],
            extracurricular_activities: Array.isArray(p.extracurricular_activities) ? p.extracurricular_activities : [],
            awards: Array.isArray(p.awards) ? p.awards : [],
            publications: Array.isArray(p.publications) ? p.publications : [],
            research_experience: Array.isArray(p.research_experience) ? p.research_experience : [],
            scholarship_application: (p.scholarship_application && typeof p.scholarship_application === 'object' && !Array.isArray(p.scholarship_application)) ? p.scholarship_application : {},
            financial_guarantee: (p.financial_guarantee && typeof p.financial_guarantee === 'object' && !Array.isArray(p.financial_guarantee)) ? p.financial_guarantee : {},
            study_mode: p.study_mode || 'full_time',
            funding_source: p.funding_source || '',
            wechat_id: p.wechat_id || '',
          });
        } else {
          toast.error('Student not found');
          router.push('/partner-v2/students');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        toast.error('Failed to load student');
        router.push('/partner-v2/students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [resolvedParams.id, router]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = <T,>(field: keyof FormData, item: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as T[]), item],
    }));
  };

  const removeArrayItem = (field: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as unknown[]).filter((_, i) => i !== index),
    }));
  };

  const updateArrayItem = <T,>(field: keyof FormData, index: number, item: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as T[]).map((existing, i) => i === index ? item : existing),
    }));
  };

  const updateObjectField = (field: 'scholarship_application' | 'financial_guarantee', key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...(prev[field] as Record<string, string>), [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.full_name) {
      toast.error('Full name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        router.push('/signin');
        return;
      }

      // Build the update payload
      const updateData: Record<string, unknown> = {
        full_name: formData.full_name,
        phone: formData.phone || null,
      };

      // Build student_profile object
      const studentProfile: Record<string, unknown> = {};
      const simpleFields = [
        'nationality', 'date_of_birth', 'gender', 'current_address', 'postal_code',
        'permanent_address', 'chinese_name', 'marital_status', 'religion',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
        'passport_number', 'passport_expiry_date', 'passport_issuing_country',
        'ielts_score', 'study_mode', 'funding_source', 'wechat_id',
      ];
      for (const f of simpleFields) {
        studentProfile[f] = (formData as unknown as Record<string, unknown>)[f] || null;
      }

      // Numeric fields
      studentProfile.hsk_level = formData.hsk_level ? Number(formData.hsk_level) : null;
      studentProfile.hsk_score = formData.hsk_score ? Number(formData.hsk_score) : null;
      studentProfile.toefl_score = formData.toefl_score ? Number(formData.toefl_score) : null;

      // Array fields
      const arrayFields = ['education_history', 'work_experience', 'family_members', 'extracurricular_activities', 'awards', 'publications', 'research_experience'];
      for (const f of arrayFields) {
        studentProfile[f] = Array.isArray((formData as unknown as Record<string, unknown>)[f]) ? (formData as unknown as Record<string, unknown>)[f] : null;
      }

      // Object fields
      studentProfile.scholarship_application = (formData.scholarship_application && typeof formData.scholarship_application === 'object' && Object.keys(formData.scholarship_application).length > 0) ? formData.scholarship_application : null;
      studentProfile.financial_guarantee = (formData.financial_guarantee && typeof formData.financial_guarantee === 'object' && Object.keys(formData.financial_guarantee).length > 0) ? formData.financial_guarantee : null;

      updateData.student_profile = studentProfile;

      const response = await fetch(`/api/partner/students/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Student updated successfully!');
        router.push(`/partner-v2/students/${resolvedParams.id}`);
      } else {
        let errorMsg = 'Failed to update student';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      const response = await fetch(`/api/partner/students/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        router.push('/partner-v2/students');
      } else {
        let errorMsg = 'Failed to delete student';
        try {
          const errData = await response.json();
          errorMsg = errData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Student</h1>
            <p className="text-muted-foreground text-sm">Update student information for {formData.full_name}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              {isDeleting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconTrash className="h-4 w-4 mr-2" />}
              Delete Student
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{formData.full_name}</strong>? This action cannot be undone. Students with active applications cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-6">
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

            {/* ============ Personal Tab ============ */}
            <TabsContent value="personal" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
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

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
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

                <Separator className="my-6" />

                <h4 className="text-base font-semibold mb-3">Emergency Contact</h4>
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
            <TabsContent value="passport" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Passport Information</h3>
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
            <TabsContent value="academic" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconSchool className="h-5 w-5" />
                    Education History
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('education_history', { institution: '', degree: '', field_of_study: '', start_date: '', gpa: '', city: '', country: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Education
                  </Button>
                </div>
                {formData.education_history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconSchool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No education history added yet</p>
                    <p className="text-sm">Click &quot;Add Education&quot; to add an entry</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.education_history.map((edu, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('education_history', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={edu.start_date} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={edu.end_date || ''} onChange={(e) => updateArrayItem('education_history', idx, { ...edu, end_date: e.target.value })} />
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconBriefcase className="h-5 w-5" />
                    Work Experience
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('work_experience', { company: '', position: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Experience
                  </Button>
                </div>
                {formData.work_experience.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconBriefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No work experience added yet</p>
                    <p className="text-sm">Click &quot;Add Experience&quot; to add an entry</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.work_experience.map((work, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('work_experience', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={work.start_date} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={work.end_date || ''} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, end_date: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea value={work.description || ''} onChange={(e) => updateArrayItem('work_experience', idx, { ...work, description: e.target.value })} placeholder="Job description" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <IconLanguage className="h-5 w-5" />
                  Language Test Scores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </TabsContent>

            {/* ============ Family Tab ============ */}
            <TabsContent value="family" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Family Members</h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('family_members', { name: '', relationship: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Family Member
                  </Button>
                </div>
                {formData.family_members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <IconUsers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No family members added yet</p>
                    <p className="text-sm">Click &quot;Add Family Member&quot; to add an entry</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.family_members.map((member, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('family_members', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ============ Additional Tab ============ */}
            <TabsContent value="additional" className="space-y-4">
              {/* Extracurricular Activities */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconStar className="h-5 w-5" />
                    Extracurricular Activities
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('extracurricular_activities', { activity: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Activity
                  </Button>
                </div>
                {formData.extracurricular_activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No activities added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.extracurricular_activities.map((act, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('extracurricular_activities', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={act.start_date} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={act.end_date || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, end_date: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea value={act.description || ''} onChange={(e) => updateArrayItem('extracurricular_activities', idx, { ...act, description: e.target.value })} placeholder="Description" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Awards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconTrophy className="h-5 w-5" />
                    Awards
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('awards', { title: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Award
                  </Button>
                </div>
                {formData.awards.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No awards added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.awards.map((award, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('awards', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={award.date || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, date: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea value={award.description || ''} onChange={(e) => updateArrayItem('awards', idx, { ...award, description: e.target.value })} placeholder="Description" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Publications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconFileText className="h-5 w-5" />
                    Publications
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('publications', { title: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Publication
                  </Button>
                </div>
                {formData.publications.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No publications added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.publications.map((pub, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('publications', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={pub.publication_date || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, publication_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>URL</Label>
                              <Input value={pub.url || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea value={pub.description || ''} onChange={(e) => updateArrayItem('publications', idx, { ...pub, description: e.target.value })} placeholder="Description" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Research Experience */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconFlask className="h-5 w-5" />
                    Research Experience
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('research_experience', { topic: '', start_date: '' })}>
                    <IconPlus className="h-4 w-4 mr-1" /> Add Research
                  </Button>
                </div>
                {formData.research_experience.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center border-2 border-dashed rounded-lg">No research experience added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.research_experience.map((res, idx) => (
                      <Card key={idx} className="relative">
                        <CardContent className="pt-4">
                          <div className="absolute top-3 right-3">
                            <Button variant="ghost" size="icon-sm" onClick={() => removeArrayItem('research_experience', idx)}>
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" value={res.start_date} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={res.end_date || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, end_date: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea value={res.description || ''} onChange={(e) => updateArrayItem('research_experience', idx, { ...res, description: e.target.value })} placeholder="Description" />
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
            <TabsContent value="preferences" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Study Preferences</h3>
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

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
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
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={formData.scholarship_application.notes || ''} onChange={(e) => updateObjectField('scholarship_application', 'notes', e.target.value)} placeholder="Additional notes" />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Financial Guarantee
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
