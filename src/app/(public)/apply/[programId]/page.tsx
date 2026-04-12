'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Send,
  User,
  GraduationCap,
  Globe,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Program {
  id: string;
  name_en: string;
  name_cn: string | null;
  degree_type: string;
  universities: {
    id: string;
    name_en: string;
    name_cn: string | null;
    city: string;
    province: string;
  };
}

const GENDERS = ['Male', 'Female', 'Other'];
const NATIONALITIES = [
  'Afghanistan', 'Algeria', 'Argentina', 'Australia', 'Bangladesh', 'Brazil', 'Canada',
  'Chile', 'China', 'Colombia', 'Egypt', 'France', 'Germany', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco', 'Nepal',
  'Nigeria', 'Pakistan', 'Philippines', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Thailand', 'Turkey', 'UAE', 'UK', 'USA',
  'Ukraine', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zimbabwe', 'Other'
];
const DEGREES = ['High School', 'Bachelor', 'Master', 'PhD'];
const CHINESE_LEVELS = ['None', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Native'];
const ENGLISH_LEVELS = ['None', 'Beginner', 'Intermediate', 'Advanced', 'Native'];
const ENGLISH_TESTS = ['IELTS', 'TOEFL', 'TOEIC', 'Cambridge', 'Duolingo', 'None'];

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.programId as string;
  const { user, loading: authLoading } = useAuth();
  
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Personal Info
    passport_number: '',
    passport_first_name: '',
    passport_last_name: '',
    nationality: '',
    date_of_birth: '',
    gender: '',
    // Contact
    email: '',
    phone: '',
    current_address: '',
    permanent_address: '',
    // Education
    highest_degree: '',
    graduation_school: '',
    graduation_date: '',
    gpa: '',
    // Language
    chinese_level: '',
    chinese_test_score: '',
    chinese_test_date: '',
    english_level: '',
    english_test_type: '',
    english_test_score: '',
    english_test_date: '',
    // Study Plan
    study_plan: '',
    research_interest: '',
    career_goals: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/student/login?redirect=/apply/' + programId);
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router, programId]);

  useEffect(() => {
    if (user?.role === 'student' && programId) {
      fetchProgram();
    }
  }, [user, programId]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`);
      if (response.ok) {
        const data = await response.json();
        setProgram(data.program);
        
        // Pre-fill email from user profile
        if (user?.email) {
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      } else {
        toast.error('Program not found');
        router.push('/programs');
      }
    } catch (error) {
      toast.error('Failed to load program');
      router.push('/programs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.passport_number && formData.passport_first_name && 
                  formData.passport_last_name && formData.nationality && 
                  formData.date_of_birth && formData.gender && formData.email);
      case 2:
        return !!(formData.highest_degree && formData.graduation_school && formData.graduation_date);
      case 3:
        return true; // Language is optional
      case 4:
        return !!(formData.study_plan && formData.study_plan.length >= 200);
      default:
        return false;
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      if (!token) {
        toast.error('Please login again');
        return;
      }
      
      if (!applicationId) {
        // Create new application
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_id: programId,
            university_id: program?.universities.id,
            ...formData,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setApplicationId(data.application.id);
          toast.success('Draft saved');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to save draft');
        }
      } else {
        // Update existing application
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Draft saved');
        } else {
          toast.error('Failed to save draft');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      if (!token) {
        toast.error('Please login again');
        return;
      }

      // Save first if not saved
      if (!applicationId) {
        const saveResponse = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_id: programId,
            university_id: program?.universities.id,
            ...formData,
          }),
        });

        if (saveResponse.ok) {
          const data = await saveResponse.json();
          setApplicationId(data.application.id);
          
          // Submit the application
          await submitApplication(data.application.id, token);
        } else {
          toast.error('Failed to save application');
        }
      } else {
        // Update and submit
        await fetch(`/api/applications/${applicationId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        await submitApplication(applicationId, token);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitApplication = async (id: string, token: string) => {
    const response = await fetch(`/api/applications/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      toast.success('Application submitted successfully!');
      router.push('/student/applications');
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to submit application');
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/programs/${programId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Apply for Program</h1>
          {program && (
            <p className="text-muted-foreground">
              {program.name_en} at {program.universities.name_en}
            </p>
          )}
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {[
                { num: 1, label: 'Personal', icon: User },
                { num: 2, label: 'Education', icon: GraduationCap },
                { num: 3, label: 'Language', icon: Globe },
                { num: 4, label: 'Study Plan', icon: FileText },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                    currentStep >= step.num 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.num ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {idx < 3 && (
                    <div className={`w-8 sm:w-16 h-1 mx-2 rounded ${
                      currentStep > step.num ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / totalSteps) * 100} />
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {
                currentStep === 1 ? 'Personal Information' :
                currentStep === 2 ? 'Education Background' :
                currentStep === 3 ? 'Language Proficiency' :
                'Study Plan'
              }
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Please provide your personal details as shown on your passport'}
              {currentStep === 2 && 'Tell us about your educational background'}
              {currentStep === 3 && 'What is your language proficiency?'}
              {currentStep === 4 && 'Share your study plan and goals'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Passport Number *</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number}
                      onChange={(e) => handleChange('passport_number', e.target.value)}
                      placeholder="AB1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Select value={formData.nationality} onValueChange={(v) => handleChange('nationality', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATIONALITIES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_first_name">First Name (as on passport) *</Label>
                    <Input
                      id="passport_first_name"
                      value={formData.passport_first_name}
                      onChange={(e) => handleChange('passport_first_name', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport_last_name">Last Name (as on passport) *</Label>
                    <Input
                      id="passport_last_name"
                      value={formData.passport_last_name}
                      onChange={(e) => handleChange('passport_last_name', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <Textarea
                    id="current_address"
                    value={formData.current_address}
                    onChange={(e) => handleChange('current_address', e.target.value)}
                    placeholder="Your current address..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="highest_degree">Highest Degree *</Label>
                    <Select value={formData.highest_degree} onValueChange={(v) => handleChange('highest_degree', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduation_date">Graduation Date *</Label>
                    <Input
                      id="graduation_date"
                      type="month"
                      value={formData.graduation_date}
                      onChange={(e) => handleChange('graduation_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation_school">Graduation School/University *</Label>
                  <Input
                    id="graduation_school"
                    value={formData.graduation_school}
                    onChange={(e) => handleChange('graduation_school', e.target.value)}
                    placeholder="University of Example"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (if applicable)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={formData.gpa}
                    onChange={(e) => handleChange('gpa', e.target.value)}
                    placeholder="3.5"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Language */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Chinese Proficiency</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={formData.chinese_level} onValueChange={(v) => handleChange('chinese_level', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHINESE_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>HSK Score</Label>
                      <Input
                        type="number"
                        value={formData.chinese_test_score}
                        onChange={(e) => handleChange('chinese_test_score', e.target.value)}
                        placeholder="180"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Test Date</Label>
                      <Input
                        type="date"
                        value={formData.chinese_test_date}
                        onChange={(e) => handleChange('chinese_test_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">English Proficiency</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={formData.english_level} onValueChange={(v) => handleChange('english_level', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENGLISH_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Test Type</Label>
                      <Select value={formData.english_test_type} onValueChange={(v) => handleChange('english_test_type', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENGLISH_TESTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Score</Label>
                      <Input
                        value={formData.english_test_score}
                        onChange={(e) => handleChange('english_test_score', e.target.value)}
                        placeholder="6.5 or 90"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Test Date</Label>
                      <Input
                        type="date"
                        value={formData.english_test_date}
                        onChange={(e) => handleChange('english_test_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Study Plan */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="study_plan">Study Plan * (minimum 200 words)</Label>
                  <Textarea
                    id="study_plan"
                    value={formData.study_plan}
                    onChange={(e) => handleChange('study_plan', e.target.value)}
                    placeholder="Describe your study plan, why you chose this program, and what you hope to achieve..."
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.study_plan.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="research_interest">Research Interest (if applicable)</Label>
                  <Textarea
                    id="research_interest"
                    value={formData.research_interest}
                    onChange={(e) => handleChange('research_interest', e.target.value)}
                    placeholder="Describe your research interests..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="career_goals">Career Goals</Label>
                  <Textarea
                    id="career_goals"
                    value={formData.career_goals}
                    onChange={(e) => handleChange('career_goals', e.target.value)}
                    placeholder="Describe your career goals..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-8">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Draft
                </Button>
              </div>

              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
