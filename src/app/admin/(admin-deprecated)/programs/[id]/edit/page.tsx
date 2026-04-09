'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const DEGREE_LEVELS = [
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'language', label: 'Language Program' },
  { value: 'pre_university', label: 'Pre-University' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
];

const CATEGORIES = [
  'Engineering', 'Business', 'Medicine', 'Arts', 'Science',
  'Law', 'Education', 'Agriculture', 'Economics', 'Management',
  'Computer Science', 'Architecture', 'Philosophy', 'Literature',
  'History', 'Languages', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
];

const SCHOLARSHIP_TYPES = ['CSC', 'University', 'Provincial', 'Local Government'];
const APPLICATION_DOCUMENTS = [
  'Passport', 'Transcript', 'Degree Certificate', 'Recommendation Letter',
  'Study Plan', 'CV/Resume', 'Language Certificate', 'Photo',
  'Health Certificate', 'Bank Statement', 'Police Clearance',
];
const TEACHING_LANGUAGES = ['Chinese', 'English', 'French', 'German', 'Japanese', 'Korean', 'Russian'];

interface ProgramFormData {
  university_id: string;
  name_en: string;
  name_cn: string;
  code: string;
  description: string;
  degree_level: string;
  category: string;
  sub_category: string;
  duration_years: string;
  duration_months: string;
  start_month: string;
  application_deadline_type: string;
  teaching_languages: string[];
  language_requirement: string;
  min_gpa: string;
  entrance_exam_required: boolean;
  entrance_exam_details: string;
  tuition_per_year: string;
  tuition_currency: string;
  tuition_remarks: string;
  scholarship_available: boolean;
  scholarship_types: string[];
  scholarship_details: string;
  application_fee: string;
  application_fee_currency: string;
  application_documents: string[];
  application_requirements: string;
  capacity: string;
  status: string;
  is_featured: boolean;
  tags: string[];
  newTag: string;
}

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProgramFormData>({
    university_id: '',
    name_en: '',
    name_cn: '',
    code: '',
    description: '',
    degree_level: '',
    category: '',
    sub_category: '',
    duration_years: '',
    duration_months: '',
    start_month: '',
    application_deadline_type: 'fixed',
    teaching_languages: [],
    language_requirement: '',
    min_gpa: '',
    entrance_exam_required: false,
    entrance_exam_details: '',
    tuition_per_year: '',
    tuition_currency: 'CNY',
    tuition_remarks: '',
    scholarship_available: false,
    scholarship_types: [],
    scholarship_details: '',
    application_fee: '',
    application_fee_currency: 'CNY',
    application_documents: [],
    application_requirements: '',
    capacity: '',
    status: 'active',
    is_featured: false,
    tags: [],
    newTag: '',
  });

  const fetchProgram = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/programs/${programId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const p = data.program;
        setFormData({
          university_id: p.university_id,
          name_en: p.name_en || '',
          name_cn: p.name_cn || '',
          code: p.code || '',
          description: p.description || '',
          degree_level: p.degree_level || '',
          category: p.category || '',
          sub_category: p.sub_category || '',
          duration_years: p.duration_years?.toString() || '',
          duration_months: p.duration_months?.toString() || '',
          start_month: p.start_month || '',
          application_deadline_type: p.application_deadline_type || 'fixed',
          teaching_languages: p.teaching_languages || [],
          language_requirement: p.language_requirement || '',
          min_gpa: p.min_gpa?.toString() || '',
          entrance_exam_required: p.entrance_exam_required || false,
          entrance_exam_details: p.entrance_exam_details || '',
          tuition_per_year: p.tuition_per_year?.toString() || '',
          tuition_currency: p.tuition_currency || 'CNY',
          tuition_remarks: p.tuition_remarks || '',
          scholarship_available: p.scholarship_available || false,
          scholarship_types: p.scholarship_types || [],
          scholarship_details: p.scholarship_details || '',
          application_fee: p.application_fee?.toString() || '',
          application_fee_currency: p.application_fee_currency || 'CNY',
          application_documents: p.application_documents || [],
          application_requirements: p.application_requirements || '',
          capacity: p.capacity?.toString() || '',
          status: p.status || 'active',
          is_featured: p.is_featured || false,
          tags: p.tags || [],
          newTag: '',
        });
      } else {
        toast.error('Failed to load program');
        router.push('/admin/programs');
      }
    } catch {
      toast.error('Failed to load program');
      router.push('/admin/programs');
    } finally {
      setIsLoading(false);
    }
  }, [programId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin' && programId) {
      fetchProgram();
    }
  }, [user, programId, fetchProgram]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'teaching_languages' | 'scholarship_types' | 'application_documents', item: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: '',
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_en || !formData.degree_level) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration_years: formData.duration_years ? parseFloat(formData.duration_years) : null,
          duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
          min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
          tuition_per_year: formData.tuition_per_year ? parseFloat(formData.tuition_per_year) : null,
          application_fee: formData.application_fee ? parseFloat(formData.application_fee) : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      });

      if (response.ok) {
        toast.success('Program updated successfully');
        router.push('/admin/programs');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update program');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin' || isLoading) {
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
        <div className="mb-8">
          <Link href="/admin/programs">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Program</h1>
          <p className="text-muted-foreground">Update program information</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Program Name (English) *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_cn">Program Name (Chinese)</Label>
                  <Input
                    id="name_cn"
                    value={formData.name_cn}
                    onChange={(e) => handleChange('name_cn', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Program Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree_level">Degree Level *</Label>
                  <Select
                    value={formData.degree_level}
                    onValueChange={(value) => handleChange('degree_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_category">Sub-Category</Label>
                  <Input
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) => handleChange('sub_category', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Duration & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Years)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.duration_years}
                    onChange={(e) => handleChange('duration_years', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Months)</Label>
                  <Input
                    type="number"
                    value={formData.duration_months}
                    onChange={(e) => handleChange('duration_months', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Month</Label>
                  <Select
                    value={formData.start_month}
                    onValueChange={(value) => handleChange('start_month', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="September">September</SelectItem>
                      <SelectItem value="March">March</SelectItem>
                      <SelectItem value="February">February</SelectItem>
                      <SelectItem value="Rolling">Rolling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language & Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Language & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Teaching Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {TEACHING_LANGUAGES.map((lang) => (
                    <Badge
                      key={lang}
                      variant={formData.teaching_languages.includes(lang) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('teaching_languages', lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language Requirement</Label>
                  <Input
                    value={formData.language_requirement}
                    onChange={(e) => handleChange('language_requirement', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum GPA</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.min_gpa}
                    onChange={(e) => handleChange('min_gpa', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="entrance_exam_required"
                  checked={formData.entrance_exam_required}
                  onCheckedChange={(checked) => handleChange('entrance_exam_required', checked as boolean)}
                />
                <Label htmlFor="entrance_exam_required" className="cursor-pointer">
                  Entrance Exam Required
                </Label>
              </div>

              {formData.entrance_exam_required && (
                <div className="space-y-2">
                  <Label>Exam Details</Label>
                  <Textarea
                    value={formData.entrance_exam_details}
                    onChange={(e) => handleChange('entrance_exam_details', e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tuition & Scholarship */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Tuition & Scholarship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tuition per Year</Label>
                  <Input
                    type="number"
                    value={formData.tuition_per_year}
                    onChange={(e) => handleChange('tuition_per_year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.tuition_currency}
                    onValueChange={(value) => handleChange('tuition_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application Fee</Label>
                  <Input
                    type="number"
                    value={formData.application_fee}
                    onChange={(e) => handleChange('application_fee', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scholarship_available"
                  checked={formData.scholarship_available}
                  onCheckedChange={(checked) => handleChange('scholarship_available', checked as boolean)}
                />
                <Label htmlFor="scholarship_available" className="cursor-pointer">
                  Scholarship Available
                </Label>
              </div>

              {formData.scholarship_available && (
                <div className="space-y-2">
                  <Label>Scholarship Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {SCHOLARSHIP_TYPES.map((type) => (
                      <Badge
                        key={type}
                        variant={formData.scholarship_types.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem('scholarship_types', type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application & Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Application & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Required Documents</Label>
                <div className="flex flex-wrap gap-2">
                  {APPLICATION_DOCUMENTS.map((doc) => (
                    <Badge
                      key={doc}
                      variant={formData.application_documents.includes(doc) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('application_documents', doc)}
                    >
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleChange('is_featured', checked as boolean)}
                />
                <Label htmlFor="is_featured" className="cursor-pointer">
                  Featured Program
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => handleChange('newTag', e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/programs">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
