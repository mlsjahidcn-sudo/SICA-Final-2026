'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import {
  ArrowLeft,
  Loader2,
  Save,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

const PROVINCES = [
  'Beijing', 'Shanghai', 'Guangdong', 'Jiangsu', 'Zhejiang',
  'Sichuan', 'Hubei', 'Shaanxi', 'Shandong', 'Tianjin',
  'Chongqing', 'Fujian', 'Anhui', 'Henan', 'Hebei',
  'Hunan', 'Jiangxi', 'Liaoning', 'Jilin', 'Heilongjiang',
];

const UNIVERSITY_TYPES = [
  { value: '985', label: '985 Project University' },
  { value: '211', label: '211 Project University' },
  { value: 'double_first_class', label: 'Double First-Class University' },
  { value: 'public', label: 'Public University' },
  { value: 'private', label: 'Private University' },
];

const CATEGORIES = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'medical', label: 'Medical' },
  { value: 'technical', label: 'Technical/Engineering' },
  { value: 'language', label: 'Language' },
  { value: 'business', label: 'Business/Economics' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'normal', label: 'Normal (Teacher Training)' },
  { value: 'arts', label: 'Arts' },
  { value: 'science', label: 'Science' },
];

const LANGUAGES = ['Chinese', 'English', 'French', 'German', 'Japanese', 'Korean', 'Russian'];

const TIERS = ['S', 'A', 'B', 'C'];
const ACCEPTANCE_FLEXIBILITY = ['High', 'Medium', 'Low'];
const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

interface UniversityFormData {
  name_en: string;
  name_cn: string;
  short_name: string;
  logo_url: string;
  cover_image_url: string;
  province: string;
  city: string;
  address: string;
  address_en: string;
  address_cn: string;
  country: string;
  website: string;
  type: string[];
  category: string;
  ranking_national: string;
  ranking_international: string;
  founded_year: string;
  student_count: string;
  international_student_count: string;
  faculty_count: string;
  description: string;
  description_en: string;
  description_cn: string;
  facilities: string;
  facilities_en: string;
  facilities_cn: string;
  accommodation_info: string;
  accommodation_info_en: string;
  accommodation_info_cn: string;
  contact_email: string;
  contact_phone: string;
  latitude: string;
  longitude: string;
  scholarship_available: boolean;
  is_active: boolean;
  teaching_languages: string[];
  // New fields
  tuition_min: string;
  tuition_max: string;
  tuition_currency: string;
  images: string;
  video_urls: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string;
  slug: string;
  application_deadline: string;
  intake_months: string[];
  default_tuition_per_year: string;
  default_tuition_currency: string;
  use_default_tuition: boolean;
  scholarship_percentage: string;
  tuition_bachelor: string;
  tuition_master: string;
  tuition_phd: string;
  scholarship_bachelor: string;
  scholarship_master: string;
  scholarship_phd: string;
  tier: string;
  acceptance_flexibility: string;
  csca_required: boolean;
  has_application_fee: boolean;
  accommodation_fee: string;
  accommodation_fee_currency: string;
  view_count: string;
}

export default function EditUniversityPage() {
  const router = useRouter();
  const params = useParams();
  const universityId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiUniversityName, setAiUniversityName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<UniversityFormData>({
    name_en: '',
    name_cn: '',
    short_name: '',
    logo_url: '',
    cover_image_url: '',
    province: '',
    city: '',
    address: '',
    address_en: '',
    address_cn: '',
    country: '',
    website: '',
    type: [],
    category: '',
    ranking_national: '',
    ranking_international: '',
    founded_year: '',
    student_count: '',
    international_student_count: '',
    faculty_count: '',
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
    latitude: '',
    longitude: '',
    scholarship_available: false,
    is_active: true,
    teaching_languages: [],
    // New fields
    tuition_min: '',
    tuition_max: '',
    tuition_currency: 'CNY',
    images: '',
    video_urls: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image: '',
    slug: '',
    application_deadline: '',
    intake_months: [],
    default_tuition_per_year: '',
    default_tuition_currency: 'CNY',
    use_default_tuition: false,
    scholarship_percentage: '',
    tuition_bachelor: '',
    tuition_master: '',
    tuition_phd: '',
    scholarship_bachelor: '',
    scholarship_master: '',
    scholarship_phd: '',
    tier: '',
    acceptance_flexibility: '',
    csca_required: false,
    has_application_fee: false,
    accommodation_fee: '',
    accommodation_fee_currency: 'CNY',
    view_count: '',
  });

  const fetchUniversity = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch(`/api/admin/universities/${universityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const u = data.university;
        setFormData({
          name_en: u.name_en || '',
          name_cn: u.name_cn || '',
          short_name: u.short_name || '',
          logo_url: u.logo_url || '',
          cover_image_url: u.cover_image_url || '',
          province: u.province || '',
          city: u.city || '',
          address: u.address || '',
          address_en: u.address_en || '',
          address_cn: u.address_cn || '',
          country: u.country || '',
          website: u.website || '',
          type: Array.isArray(u.type) ? u.type : [],
          category: u.category || '',
          ranking_national: u.ranking_national?.toString() || '',
          ranking_international: u.ranking_international?.toString() || '',
          founded_year: u.founded_year?.toString() || '',
          student_count: u.student_count?.toString() || '',
          international_student_count: u.international_student_count?.toString() || '',
          faculty_count: u.faculty_count?.toString() || '',
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
          latitude: u.latitude?.toString() || '',
          longitude: u.longitude?.toString() || '',
          scholarship_available: u.scholarship_available || false,
          is_active: u.is_active ?? true,
          teaching_languages: u.teaching_languages || [],
          // New fields
          tuition_min: u.tuition_min?.toString() || '',
          tuition_max: u.tuition_max?.toString() || '',
          tuition_currency: u.tuition_currency || 'CNY',
          images: Array.isArray(u.images) ? u.images.join('\n') : '',
          video_urls: Array.isArray(u.video_urls) ? u.video_urls.join('\n') : '',
          meta_title: u.meta_title || '',
          meta_description: u.meta_description || '',
          meta_keywords: Array.isArray(u.meta_keywords) ? u.meta_keywords.join(', ') : '',
          og_image: u.og_image || '',
          slug: u.slug || '',
          application_deadline: u.application_deadline || '',
          intake_months: Array.isArray(u.intake_months) ? u.intake_months.map(String) : [],
          default_tuition_per_year: u.default_tuition_per_year?.toString() || '',
          default_tuition_currency: u.default_tuition_currency || 'CNY',
          use_default_tuition: u.use_default_tuition || false,
          scholarship_percentage: u.scholarship_percentage?.toString() || '',
          tuition_bachelor: u.tuition_by_degree?.bachelor?.toString() || '',
          tuition_master: u.tuition_by_degree?.master?.toString() || '',
          tuition_phd: u.tuition_by_degree?.phd?.toString() || '',
          scholarship_bachelor: u.scholarship_by_degree?.bachelor?.toString() || '',
          scholarship_master: u.scholarship_by_degree?.master?.toString() || '',
          scholarship_phd: u.scholarship_by_degree?.phd?.toString() || '',
          tier: u.tier || '',
          acceptance_flexibility: u.acceptance_flexibility || '',
          csca_required: u.csca_required || false,
          has_application_fee: u.has_application_fee || false,
          accommodation_fee: u.accommodation_fee?.toString() || '',
          accommodation_fee_currency: u.accommodation_fee_currency || 'CNY',
          view_count: u.view_count?.toString() || '',
        });
      } else {
        toast.error('Failed to load university');
        router.push('/admin/universities');
      }
    } catch {
      toast.error('Failed to load university');
      router.push('/admin/universities');
    } finally {
      setIsLoading(false);
    }
  }, [universityId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    } else if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin' && universityId) {
      fetchUniversity();
    }
  }, [user, universityId, fetchUniversity]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      teaching_languages: prev.teaching_languages.includes(lang)
        ? prev.teaching_languages.filter((l) => l !== lang)
        : [...prev.teaching_languages, lang],
    }));
  };

  const handleTypeToggle = (selectedType: string) => {
    setFormData((prev) => {
      const currentTypes = Array.isArray(prev.type) ? prev.type : [];
      const isSelected = currentTypes.includes(selectedType);
      
      if (isSelected) {
        return {
          ...prev,
          type: currentTypes.filter((t) => t !== selectedType),
        };
      } else {
        return {
          ...prev,
          type: [...currentTypes, selectedType],
        };
      }
    });
  };

  const handleIntakeMonthToggle = (month: string) => {
    setFormData((prev) => {
      const currentMonths = Array.isArray(prev.intake_months) ? prev.intake_months : [];
      const isSelected = currentMonths.includes(month);
      
      if (isSelected) {
        return {
          ...prev,
          intake_months: currentMonths.filter((m) => m !== month),
        };
      } else {
        return {
          ...prev,
          intake_months: [...currentMonths, month],
        };
      }
    });
  };

  const generateUniversityInfo = async () => {
    if (!aiUniversityName.trim()) {
      toast.error('Please enter a university name');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/admin/universities/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name_en: aiUniversityName }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiUniversity = data.university;
        setFormData((prev) => ({
          ...prev,
          name_en: aiUniversity.name_en || prev.name_en,
          name_cn: aiUniversity.name_cn || prev.name_cn,
          description_en: aiUniversity.description_en || prev.description_en,
          description_cn: aiUniversity.description_cn || prev.description_cn,
          facilities_en: aiUniversity.facilities_en || prev.facilities_en,
          facilities_cn: aiUniversity.facilities_cn || prev.facilities_cn,
          accommodation_info_en: aiUniversity.accommodation_info_en || prev.accommodation_info_en,
          accommodation_info_cn: aiUniversity.accommodation_info_cn || prev.accommodation_info_cn,
          address_en: aiUniversity.address_en || prev.address_en,
          address_cn: aiUniversity.address_cn || prev.address_cn,
          province: aiUniversity.province || prev.province,
          city: aiUniversity.city || prev.city,
          type: aiUniversity.type || prev.type,
          category: aiUniversity.category || prev.category,
          founded_year: aiUniversity.founded_year ? aiUniversity.founded_year.toString() : prev.founded_year,
          website: aiUniversity.website || prev.website,
          ranking_national: aiUniversity.ranking_national ? aiUniversity.ranking_national.toString() : prev.ranking_national,
          ranking_international: aiUniversity.ranking_international ? aiUniversity.ranking_international.toString() : prev.ranking_international,
          student_count: aiUniversity.student_count ? aiUniversity.student_count.toString() : prev.student_count,
          international_student_count: aiUniversity.international_student_count ? aiUniversity.international_student_count.toString() : prev.international_student_count,
          faculty_count: aiUniversity.faculty_count ? aiUniversity.faculty_count.toString() : prev.faculty_count,
          meta_title: aiUniversity.meta_title || prev.meta_title,
          meta_description: aiUniversity.meta_description || prev.meta_description,
          meta_keywords: aiUniversity.meta_keywords ? JSON.stringify(aiUniversity.meta_keywords, null, 2) : prev.meta_keywords,
        }));
        toast.success('University information generated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate university information');
      }
    } catch {
      toast.error('Failed to generate university information');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_en || !formData.province || !formData.city || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sica_auth_token');

      const response = await fetch(`/api/admin/universities/${universityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ranking_national: formData.ranking_national ? parseInt(formData.ranking_national) : null,
          ranking_international: formData.ranking_international ? parseInt(formData.ranking_international) : null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          student_count: formData.student_count ? parseInt(formData.student_count) : null,
          international_student_count: formData.international_student_count ? parseInt(formData.international_student_count) : null,
          faculty_count: formData.faculty_count ? parseInt(formData.faculty_count) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          // New numeric fields
          tuition_min: formData.tuition_min ? parseFloat(formData.tuition_min) : null,
          tuition_max: formData.tuition_max ? parseFloat(formData.tuition_max) : null,
          default_tuition_per_year: formData.default_tuition_per_year ? parseFloat(formData.default_tuition_per_year) : null,
          scholarship_percentage: formData.scholarship_percentage ? parseInt(formData.scholarship_percentage) : null,
          accommodation_fee: formData.accommodation_fee ? parseFloat(formData.accommodation_fee) : null,
          accommodation_fee_currency: formData.accommodation_fee_currency,
          view_count: formData.view_count ? parseInt(formData.view_count) : null,
          // JSON fields
          images: formData.images ? formData.images.split('\n').map((url: string) => url.trim()).filter((url: string) => url.length > 0) : [],
          video_urls: formData.video_urls ? formData.video_urls.split('\n').map((url: string) => url.trim()).filter((url: string) => url.length > 0) : [],
          meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map((keyword: string) => keyword.trim()).filter((keyword: string) => keyword.length > 0) : [],
          // Build tuition and scholarship by degree objects
          tuition_by_degree: (() => {
            const obj: Record<string, number> = {};
            if (formData.tuition_bachelor) obj.bachelor = parseFloat(formData.tuition_bachelor);
            if (formData.tuition_master) obj.master = parseFloat(formData.tuition_master);
            if (formData.tuition_phd) obj.phd = parseFloat(formData.tuition_phd);
            return Object.keys(obj).length > 0 ? obj : null;
          })(),
          scholarship_by_degree: (() => {
            const obj: Record<string, number> = {};
            if (formData.scholarship_bachelor) obj.bachelor = parseInt(formData.scholarship_bachelor);
            if (formData.scholarship_master) obj.master = parseInt(formData.scholarship_master);
            if (formData.scholarship_phd) obj.phd = parseInt(formData.scholarship_phd);
            return Object.keys(obj).length > 0 ? obj : null;
          })(),
        }),
      });

      if (response.ok) {
        toast.success('University updated successfully');
        router.push('/admin/universities');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update university');
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
      <div className="container px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/universities">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Universities
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit University</h1>
          <p className="text-muted-foreground">
            Update university information
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="flex gap-1 w-full overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
              <TabsTrigger value="ai-generator" className="shrink-0 flex-none">AI Generator</TabsTrigger>
              <TabsTrigger value="basic" className="shrink-0 flex-none">Basic Info</TabsTrigger>
              <TabsTrigger value="location" className="shrink-0 flex-none">Location</TabsTrigger>
              <TabsTrigger value="classification" className="shrink-0 flex-none">Classification</TabsTrigger>
              <TabsTrigger value="tuition" className="shrink-0 flex-none">Tuition</TabsTrigger>
              <TabsTrigger value="media" className="shrink-0 flex-none">Media</TabsTrigger>
              <TabsTrigger value="seo" className="shrink-0 flex-none">SEO</TabsTrigger>
              <TabsTrigger value="advanced" className="shrink-0 flex-none">Advanced</TabsTrigger>
            </TabsList>

            {/* AI Generator */}
            <TabsContent value="ai-generator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI University Info Generator</CardTitle>
                  <CardDescription>
                    Enter a university name to automatically generate detailed bilingual information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-university-name">University Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ai-university-name"
                        value={aiUniversityName}
                        onChange={(e) => setAiUniversityName(e.target.value)}
                        placeholder="e.g., Tsinghua University"
                        className="flex-1"
                      />
                      <Button 
                        onClick={generateUniversityInfo} 
                        disabled={isGenerating || !aiUniversityName.trim()}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate'
                        )}
                      </Button>
                    </div>
                  </div>
                  {(formData.description_en || formData.description_cn || formData.facilities_en || formData.facilities_cn || formData.accommodation_info_en || formData.accommodation_info_cn) && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Generated Content Preview:</h4>
                      {formData.description_en && (
                        <div className="space-y-2">
                          <Label>Description (EN)</Label>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formData.description_en}</p>
                        </div>
                      )}
                      {formData.description_cn && (
                        <div className="space-y-2">
                          <Label>Description (CN)</Label>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formData.description_cn}</p>
                        </div>
                      )}
                      {formData.facilities_en && (
                        <div className="space-y-2">
                          <Label>Facilities (EN)</Label>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formData.facilities_en}</p>
                        </div>
                      )}
                      {formData.facilities_cn && (
                        <div className="space-y-2">
                          <Label>Facilities (CN)</Label>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formData.facilities_cn}</p>
                        </div>
                      )}

                      {/* SEO Preview */}
                      {(formData.meta_title || formData.meta_description || formData.meta_keywords) && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            SEO Preview
                          </h4>
                          {formData.meta_title && (
                            <div className="space-y-2">
                              <Label>Meta Title</Label>
                              <p className="text-sm text-primary font-medium bg-primary/5 p-3 rounded">
                                {formData.meta_title}
                              </p>
                            </div>
                          )}
                          {formData.meta_description && (
                            <div className="space-y-2">
                              <Label>Meta Description</Label>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                                {formData.meta_description}
                              </p>
                            </div>
                          )}
                          {formData.meta_keywords && (
                            <div className="space-y-2">
                              <Label>Meta Keywords</Label>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  try {
                                    const keywords = JSON.parse(formData.meta_keywords);
                                    return Array.isArray(keywords) ? keywords.map((keyword, idx) => (
                                      <Badge key={idx} variant="secondary">{keyword}</Badge>
                                    )) : null;
                                  } catch {
                                    return <span className="text-sm text-muted-foreground">{formData.meta_keywords}</span>;
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name_en">English Name *</Label>
                      <Input
                        id="name_en"
                        value={formData.name_en}
                        onChange={(e) => handleChange('name_en', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name_cn">Chinese Name</Label>
                      <Input
                        id="name_cn"
                        value={formData.name_cn}
                        onChange={(e) => handleChange('name_cn', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name</Label>
                      <Input
                        id="short_name"
                        value={formData.short_name}
                        onChange={(e) => handleChange('short_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleChange('slug', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => handleChange('logo_url', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover_image_url">Cover Image URL</Label>
                      <Input
                        id="cover_image_url"
                        type="url"
                        value={formData.cover_image_url}
                        onChange={(e) => handleChange('cover_image_url', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Default)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description_en">Description (English)</Label>
                      <Textarea
                        id="description_en"
                        value={formData.description_en}
                        onChange={(e) => handleChange('description_en', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description_cn">Description (Chinese)</Label>
                      <Textarea
                        id="description_cn"
                        value={formData.description_cn}
                        onChange={(e) => handleChange('description_cn', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facilities & Accommodation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facilities">Facilities (Default)</Label>
                    <Textarea
                      id="facilities"
                      value={formData.facilities}
                      onChange={(e) => handleChange('facilities', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facilities_en">Facilities (English)</Label>
                      <Textarea
                        id="facilities_en"
                        value={formData.facilities_en}
                        onChange={(e) => handleChange('facilities_en', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facilities_cn">Facilities (Chinese)</Label>
                      <Textarea
                        id="facilities_cn"
                        value={formData.facilities_cn}
                        onChange={(e) => handleChange('facilities_cn', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodation_info">Accommodation Info (Default)</Label>
                    <Textarea
                      id="accommodation_info"
                      value={formData.accommodation_info}
                      onChange={(e) => handleChange('accommodation_info', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_info_en">Accommodation Info (English)</Label>
                      <Textarea
                        id="accommodation_info_en"
                        value={formData.accommodation_info_en}
                        onChange={(e) => handleChange('accommodation_info_en', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_info_cn">Accommodation Info (Chinese)</Label>
                      <Textarea
                        id="accommodation_info_cn"
                        value={formData.accommodation_info_cn}
                        onChange={(e) => handleChange('accommodation_info_cn', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="founded_year">Founded Year</Label>
                      <Input
                        id="founded_year"
                        type="number"
                        value={formData.founded_year}
                        onChange={(e) => handleChange('founded_year', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_count">Total Students</Label>
                      <Input
                        id="student_count"
                        type="number"
                        value={formData.student_count}
                        onChange={(e) => handleChange('student_count', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="international_student_count">International Students</Label>
                      <Input
                        id="international_student_count"
                        type="number"
                        value={formData.international_student_count}
                        onChange={(e) => handleChange('international_student_count', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty_count">Faculty</Label>
                      <Input
                        id="faculty_count"
                        type="number"
                        value={formData.faculty_count}
                        onChange={(e) => handleChange('faculty_count', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="view_count">View Count</Label>
                      <Input
                        id="view_count"
                        type="number"
                        value={formData.view_count}
                        onChange={(e) => handleChange('view_count', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location */}
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => handleChange('province', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address (Default)</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_en">Address (English)</Label>
                      <Input
                        id="address_en"
                        value={formData.address_en}
                        onChange={(e) => handleChange('address_en', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_cn">Address (Chinese)</Label>
                      <Input
                        id="address_cn"
                        value={formData.address_cn}
                        onChange={(e) => handleChange('address_cn', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => handleChange('latitude', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => handleChange('longitude', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classification */}
            <TabsContent value="classification" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classification & Ranking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label>University Type *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {UNIVERSITY_TYPES.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type.value}`}
                              checked={Array.isArray(formData.type) ? formData.type.includes(type.value) : false}
                              onCheckedChange={() => handleTypeToggle(type.value)}
                            />
                            <Label htmlFor={`type-${type.value}`} className="text-sm font-normal cursor-pointer">
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
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
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ranking_national">National Ranking</Label>
                      <Input
                        id="ranking_national"
                        type="number"
                        value={formData.ranking_national}
                        onChange={(e) => handleChange('ranking_national', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ranking_international">International Ranking</Label>
                      <Input
                        id="ranking_international"
                        type="number"
                        value={formData.ranking_international}
                        onChange={(e) => handleChange('ranking_international', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tier">Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => handleChange('tier', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((tier) => (
                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acceptance_flexibility">Acceptance Flexibility</Label>
                      <Select
                        value={formData.acceptance_flexibility}
                        onValueChange={(value) => handleChange('acceptance_flexibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flexibility" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCEPTANCE_FLEXIBILITY.map((flex) => (
                            <SelectItem key={flex} value={flex}>{flex}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teaching Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => (
                        <Badge
                          key={lang}
                          variant={formData.teaching_languages.includes(lang) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleLanguageToggle(lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tuition */}
            <TabsContent value="tuition" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tuition & Scholarship</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tuition_min">Tuition Min</Label>
                      <Input
                        id="tuition_min"
                        type="number"
                        step="0.01"
                        value={formData.tuition_min}
                        onChange={(e) => handleChange('tuition_min', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_max">Tuition Max</Label>
                      <Input
                        id="tuition_max"
                        type="number"
                        step="0.01"
                        value={formData.tuition_max}
                        onChange={(e) => handleChange('tuition_max', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_currency">Currency</Label>
                      <Input
                        id="tuition_currency"
                        value={formData.tuition_currency}
                        onChange={(e) => handleChange('tuition_currency', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use_default_tuition"
                        checked={formData.use_default_tuition}
                        onCheckedChange={(checked) => handleChange('use_default_tuition', checked as boolean)}
                      />
                      <Label htmlFor="use_default_tuition" className="cursor-pointer">
                        Use Default Tuition
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default_tuition_per_year">Default Tuition/Year</Label>
                      <Input
                        id="default_tuition_per_year"
                        type="number"
                        step="0.01"
                        value={formData.default_tuition_per_year}
                        onChange={(e) => handleChange('default_tuition_per_year', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default_tuition_currency">Default Currency</Label>
                      <Input
                        id="default_tuition_currency"
                        value={formData.default_tuition_currency}
                        onChange={(e) => handleChange('default_tuition_currency', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scholarship_percentage">Scholarship %</Label>
                      <Input
                        id="scholarship_percentage"
                        type="number"
                        value={formData.scholarship_percentage}
                        onChange={(e) => handleChange('scholarship_percentage', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tuition by Degree */}
                  <div className="space-y-3">
                    <Label>Tuition by Degree</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tuition_bachelor">Bachelor</Label>
                        <Input
                          id="tuition_bachelor"
                          type="number"
                          step="0.01"
                          value={formData.tuition_bachelor}
                          onChange={(e) => handleChange('tuition_bachelor', e.target.value)}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tuition_master">Master</Label>
                        <Input
                          id="tuition_master"
                          type="number"
                          step="0.01"
                          value={formData.tuition_master}
                          onChange={(e) => handleChange('tuition_master', e.target.value)}
                          placeholder="15000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tuition_phd">PhD</Label>
                        <Input
                          id="tuition_phd"
                          type="number"
                          step="0.01"
                          value={formData.tuition_phd}
                          onChange={(e) => handleChange('tuition_phd', e.target.value)}
                          placeholder="20000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scholarship by Degree */}
                  <div className="space-y-3">
                    <Label>Scholarship by Degree (%)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_bachelor">Bachelor</Label>
                        <Input
                          id="scholarship_bachelor"
                          type="number"
                          value={formData.scholarship_bachelor}
                          onChange={(e) => handleChange('scholarship_bachelor', e.target.value)}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_master">Master</Label>
                        <Input
                          id="scholarship_master"
                          type="number"
                          value={formData.scholarship_master}
                          onChange={(e) => handleChange('scholarship_master', e.target.value)}
                          placeholder="70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_phd">PhD</Label>
                        <Input
                          id="scholarship_phd"
                          type="number"
                          value={formData.scholarship_phd}
                          onChange={(e) => handleChange('scholarship_phd', e.target.value)}
                          placeholder="80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Application Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleChange('application_deadline', e.target.value)}
                    />
                  </div>

                  {/* Accommodation Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_fee">Accommodation Cost (per year)</Label>
                      <Input
                        id="accommodation_fee"
                        type="number"
                        step="0.01"
                        value={formData.accommodation_fee}
                        onChange={(e) => handleChange('accommodation_fee', e.target.value)}
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_fee_currency">Accommodation Currency</Label>
                      <Input
                        id="accommodation_fee_currency"
                        value={formData.accommodation_fee_currency}
                        onChange={(e) => handleChange('accommodation_fee_currency', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Intake Months */}
                  <div className="space-y-3">
                    <Label>Intake Months</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {MONTHS.map((month) => (
                        <div key={month.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`intake-${month.value}`}
                            checked={formData.intake_months.includes(month.value)}
                            onCheckedChange={() => handleIntakeMonthToggle(month.value)}
                          />
                          <Label htmlFor={`intake-${month.value}`} className="text-sm font-normal cursor-pointer">
                            {month.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media & Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="images">Images (One URL per line)</Label>
                    <Textarea
                      id="images"
                      value={formData.images}
                      onChange={(e) => handleChange('images', e.target.value)}
                      rows={4}
                      placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video_urls">Video URLs (One URL per line)</Label>
                    <Textarea
                      id="video_urls"
                      value={formData.video_urls}
                      onChange={(e) => handleChange('video_urls', e.target.value)}
                      rows={3}
                      placeholder="https://example.com/video1.mp4"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facilities">Facilities</Label>
                      <Textarea
                        id="facilities"
                        value={formData.facilities}
                        onChange={(e) => handleChange('facilities', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accommodation_info">Accommodation Info</Label>
                      <Textarea
                        id="accommodation_info"
                        value={formData.accommodation_info}
                        onChange={(e) => handleChange('accommodation_info', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO & Meta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => handleChange('meta_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => handleChange('meta_description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_keywords">Meta Keywords (Comma-separated)</Label>
                    <Textarea
                      id="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={(e) => handleChange('meta_keywords', e.target.value)}
                      rows={3}
                      placeholder="study in china, international students, university"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og_image">OG Image URL</Label>
                    <Input
                      id="og_image"
                      type="url"
                      value={formData.og_image}
                      onChange={(e) => handleChange('og_image', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleChange('contact_email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => handleChange('contact_phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 pt-4">
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        Active (Visible Publicly)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="csca_required"
                        checked={formData.csca_required}
                        onCheckedChange={(checked) => handleChange('csca_required', checked as boolean)}
                      />
                      <Label htmlFor="csca_required" className="cursor-pointer">
                        CSCA Required
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_application_fee"
                        checked={formData.has_application_fee}
                        onCheckedChange={(checked) => handleChange('has_application_fee', checked as boolean)}
                      />
                      <Label htmlFor="has_application_fee" className="cursor-pointer">
                        Has Application Fee
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-8">
            <Link href="/admin/universities">
              <Button variant="outline" type="button">
                Cancel
              </Button>
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
