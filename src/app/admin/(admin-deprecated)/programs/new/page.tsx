'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  ArrowLeft,
  Loader2,
  Save,
} from 'lucide-react';
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

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
}

export default function NewProgramPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);

  const [formData, setFormData] = useState({
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
    teaching_languages: [] as string[],
    language_requirement: '',
    min_gpa: '',
    entrance_exam_required: false,
    entrance_exam_details: '',
    tuition_per_year: '',
    tuition_currency: 'CNY',
    tuition_remarks: '',
    scholarship_available: false,
    scholarship_types: [] as string[],
    scholarship_details: '',
    application_fee: '',
    application_fee_currency: 'CNY',
    application_documents: [] as string[],
    application_requirements: '',
    capacity: '',
    status: 'active',
    is_featured: false,
    tags: [] as string[],
    newTag: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUniversities();
    }
  }, [user]);

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/admin/universities?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      }
    } catch {
      toast.error('Failed to load universities');
    } finally {
      setIsLoadingUniversities(false);
    }
  };

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

    if (!formData.university_id || !formData.name_en || !formData.degree_level) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
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
        toast.success('Program created successfully');
        router.push('/admin/programs');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create program');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
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
          <h1 className="text-3xl font-bold mb-2">Add New Program</h1>
          <p className="text-muted-foreground">Create a new educational program</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* University & Basic Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university_id">University *</Label>
                <Select
                  value={formData.university_id}
                  onValueChange={(value) => handleChange('university_id', value)}
                  disabled={isLoadingUniversities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name_en} {uni.name_cn && `(${uni.name_cn})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Program Name (English) *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    placeholder="Computer Science and Technology"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_cn">Program Name (Chinese)</Label>
                  <Input
                    id="name_cn"
                    value={formData.name_cn}
                    onChange={(e) => handleChange('name_cn', e.target.value)}
                    placeholder="计算机科学与技术"
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
                    placeholder="CS001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree_level">Degree Level *</Label>
                  <Select
                    value={formData.degree_level}
                    onValueChange={(value) => handleChange('degree_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree level" />
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
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
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
                    placeholder="Software Engineering"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Program description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Duration & Schedule */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Duration & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_years">Duration (Years)</Label>
                  <Input
                    id="duration_years"
                    type="number"
                    step="0.5"
                    value={formData.duration_years}
                    onChange={(e) => handleChange('duration_years', e.target.value)}
                    placeholder="4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_months">Duration (Months)</Label>
                  <Input
                    id="duration_months"
                    type="number"
                    value={formData.duration_months}
                    onChange={(e) => handleChange('duration_months', e.target.value)}
                    placeholder="48"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_month">Start Month</Label>
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

              <div className="space-y-2">
                <Label htmlFor="application_deadline_type">Application Deadline Type</Label>
                <Select
                  value={formData.application_deadline_type}
                  onValueChange={(value) => handleChange('application_deadline_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Deadline</SelectItem>
                    <SelectItem value="rolling">Rolling Admission</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="language_requirement">Language Requirement</Label>
                  <Input
                    id="language_requirement"
                    value={formData.language_requirement}
                    onChange={(e) => handleChange('language_requirement', e.target.value)}
                    placeholder="HSK 4 or IELTS 6.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_gpa">Minimum GPA</Label>
                  <Input
                    id="min_gpa"
                    type="number"
                    step="0.1"
                    value={formData.min_gpa}
                    onChange={(e) => handleChange('min_gpa', e.target.value)}
                    placeholder="3.0"
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
                  <Label htmlFor="entrance_exam_details">Exam Details</Label>
                  <Textarea
                    id="entrance_exam_details"
                    value={formData.entrance_exam_details}
                    onChange={(e) => handleChange('entrance_exam_details', e.target.value)}
                    placeholder="Details about the entrance exam..."
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
                  <Label htmlFor="tuition_per_year">Tuition per Year</Label>
                  <Input
                    id="tuition_per_year"
                    type="number"
                    value={formData.tuition_per_year}
                    onChange={(e) => handleChange('tuition_per_year', e.target.value)}
                    placeholder="25000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tuition_currency">Currency</Label>
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
                  <Label htmlFor="application_fee">Application Fee</Label>
                  <Input
                    id="application_fee"
                    type="number"
                    value={formData.application_fee}
                    onChange={(e) => handleChange('application_fee', e.target.value)}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tuition_remarks">Tuition Remarks</Label>
                <Textarea
                  id="tuition_remarks"
                  value={formData.tuition_remarks}
                  onChange={(e) => handleChange('tuition_remarks', e.target.value)}
                  placeholder="Additional information about tuition..."
                  rows={2}
                />
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
                <>
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
                  <div className="space-y-2">
                    <Label htmlFor="scholarship_details">Scholarship Details</Label>
                    <Textarea
                      id="scholarship_details"
                      value={formData.scholarship_details}
                      onChange={(e) => handleChange('scholarship_details', e.target.value)}
                      placeholder="Details about available scholarships..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Application Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Application Requirements</CardTitle>
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

              <div className="space-y-2">
                <Label htmlFor="application_requirements">Additional Requirements</Label>
                <Textarea
                  id="application_requirements"
                  value={formData.application_requirements}
                  onChange={(e) => handleChange('application_requirements', e.target.value)}
                  placeholder="Additional application requirements..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Max Students)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  placeholder="100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Tags */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Status & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-6 pt-6">
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
                </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Program
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
