"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageContainer } from "@/components/admin"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { 
  IconArrowLeft,
  IconBuilding,
  IconDeviceFloppy,
  IconMapPin,
  IconSchool,
  IconCurrencyDollar,
  IconWorld,
  IconPhoto,
  IconCalendar,
  IconTag,
  IconListDetails,
  IconPencil,
  IconX,
  IconSeo,
  IconSettings,
  IconTrophy,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const provinces = [
  'Beijing', 'Shanghai', 'Tianjin', 'Chongqing',
  'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 
  'Hubei', 'Sichuan', 'Henan', 'Hebei', 
  'Hunan', 'Anhui', 'Fujian', 'Liaoning',
  'Shaanxi', 'Jilin', 'Heilongjiang', 'Jiangxi',
  'Yunnan', 'Guizhou', 'Guangxi', 'Hainan',
  'Gansu', 'Qinghai', 'Ningxia', 'Xinjiang',
  'Inner Mongolia', 'Tibet'
]

const universityCategories = [
  'Comprehensive',
  'Science & Technology',
  'Medical',
  'Agricultural',
  'Normal (Teacher Training)',
  'Finance & Economics',
  'Language',
  'Arts',
  'Law',
  'Sports',
  'Pharmaceutical',
  'Aerospace',
  'Maritime',
  'Petroleum',
  'Forestry'
]

const classificationTypes = [
  { value: '985', label: '985 Project', color: 'bg-red-500/10 text-red-600 border-red-200' },
  { value: '211', label: '211 Project', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'Double First-Class', label: 'Double First-Class', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { value: 'Provincial', label: 'Provincial Key', color: 'bg-green-500/10 text-green-600 border-green-200' },
]

const currencies = ['CNY', 'USD', 'EUR', 'GBP']

const intakeMonthOptions = [
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
]

const tierOptions = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5']

// Interface matching actual database schema
interface UniversityFormData {
  // Basic Info
  name_en: string
  name_cn: string
  slug: string
  established_year: string
  website_url: string
  
  // Location
  province: string
  city: string
  country: string
  location: string
  
  // Classification
  type: string[]
  category: string
  tier: string
  ranking_national: string
  ranking_world: string
  
  // Media
  logo_url: string
  cover_image_url: string
  og_image: string
  image_url: string
  images: string
  video_urls: string
  
  // Description
  description: string
  facilities: string
  accommodation_available: boolean
  
  // Tuition & Scholarships
  tuition_min: string
  tuition_max: string
  tuition_currency: string
  default_tuition_per_year: string
  default_tuition_currency: string
  use_default_tuition: boolean
  scholarship_available: boolean
  scholarship_percentage: string
  scholarship_info: string
  scholarship_info_cn: string
  
  // Admissions
  has_application_fee: boolean
  application_deadline: string
  intake_months: string[]
  csca_required: boolean
  acceptance_flexibility: string
  
  // SEO
  meta_title: string
  meta_description: string
  meta_keywords: string
  
  // Tags
  tags: string
  
  // Settings
  is_active: boolean
}

const initialFormData: UniversityFormData = {
  name_en: '',
  name_cn: '',
  slug: '',
  established_year: '',
  website_url: '',
  province: '',
  city: '',
  country: 'China',
  location: '',
  type: [],
  category: '',
  tier: '',
  ranking_national: '',
  ranking_world: '',
  logo_url: '',
  cover_image_url: '',
  og_image: '',
  image_url: '',
  images: '',
  video_urls: '',
  description: '',
  facilities: '',
  accommodation_available: false,
  tuition_min: '',
  tuition_max: '',
  tuition_currency: 'CNY',
  default_tuition_per_year: '',
  default_tuition_currency: 'CNY',
  use_default_tuition: false,
  scholarship_available: false,
  scholarship_percentage: '',
  scholarship_info: '',
  scholarship_info_cn: '',
  has_application_fee: false,
  application_deadline: '',
  intake_months: [],
  csca_required: false,
  acceptance_flexibility: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  tags: '',
  is_active: true,
}

export default function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, loading: authLoading } = useAuth()
  
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    )
  }
  
  return (
    <PageContainer title="Edit University">
      <EditUniversityContent universityId={resolvedParams.id} />
    </PageContainer>
  )
}

function EditUniversityContent({ universityId }: { universityId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData)

  useEffect(() => {
    async function fetchUniversity() {
      try {
        const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
        const response = await fetch(`/api/admin/universities/${universityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const u = data.university || data
          setFormData({
            name_en: u.name_en || '',
            name_cn: u.name_cn || '',
            slug: u.slug || '',
            established_year: u.established_year?.toString() || '',
            website_url: u.website_url || '',
            province: u.province || '',
            city: u.city || '',
            country: u.country || 'China',
            location: u.location || '',
            type: Array.isArray(u.type) ? u.type : [],
            category: u.category || '',
            tier: u.tier || '',
            ranking_national: u.ranking_national?.toString() || '',
            ranking_world: u.ranking_world?.toString() || '',
            logo_url: u.logo_url || '',
            cover_image_url: u.cover_image_url || '',
            og_image: u.og_image || '',
            image_url: u.image_url || '',
            images: Array.isArray(u.images) ? u.images.join('\n') : (u.images || ''),
            video_urls: Array.isArray(u.video_urls) ? u.video_urls.join('\n') : (u.video_urls || ''),
            description: u.description || '',
            facilities: u.facilities || '',
            accommodation_available: u.accommodation_available || false,
            tuition_min: u.tuition_min?.toString() || '',
            tuition_max: u.tuition_max?.toString() || '',
            tuition_currency: u.tuition_currency || 'CNY',
            default_tuition_per_year: u.default_tuition_per_year?.toString() || '',
            default_tuition_currency: u.default_tuition_currency || 'CNY',
            use_default_tuition: u.use_default_tuition || false,
            scholarship_available: u.scholarship_available || false,
            scholarship_percentage: u.scholarship_percentage?.toString() || '',
            scholarship_info: u.scholarship_info || '',
            scholarship_info_cn: u.scholarship_info_cn || '',
            has_application_fee: u.has_application_fee || false,
            application_deadline: u.application_deadline || '',
            intake_months: Array.isArray(u.intake_months) ? u.intake_months.map(String) : [],
            csca_required: u.csca_required || false,
            acceptance_flexibility: u.acceptance_flexibility || '',
            meta_title: u.meta_title || '',
            meta_description: u.meta_description || '',
            meta_keywords: Array.isArray(u.meta_keywords) ? u.meta_keywords.join(', ') : (u.meta_keywords || ''),
            tags: Array.isArray(u.tags) ? u.tags.join(', ') : (u.tags || ''),
            is_active: u.is_active !== false,
          })
        } else {
          toast.error('Failed to load university')
          router.push('/admin/v2/universities')
        }
      } catch (error) {
        console.error('Error fetching university:', error)
        toast.error('Failed to load university')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUniversity()
  }, [universityId, router])

  const handleInputChange = (field: keyof UniversityFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleIntakeMonth = (month: string) => {
    setFormData(prev => ({
      ...prev,
      intake_months: prev.intake_months.includes(month)
        ? prev.intake_months.filter(m => m !== month)
        : [...prev.intake_months, month]
    }))
  }

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch(`/api/admin/universities/${universityId}/seo/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const seo = data.seo
        
        setFormData(prev => ({
          ...prev,
          meta_title: seo.meta_title || prev.meta_title,
          meta_description: seo.meta_description || prev.meta_description,
          meta_keywords: seo.meta_keywords || prev.meta_keywords,
          tags: seo.tags || prev.tags,
        }))
        toast.success('SEO content generated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate SEO content')
      }
    } catch (error) {
      console.error('Error generating SEO:', error)
      toast.error('Failed to generate SEO content')
    } finally {
      setIsGeneratingSeo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name_en || !formData.province || !formData.city) {
      toast.error('Please fill in all required fields (Name, Province, City)')
      return
    }

    setIsSubmitting(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken()
      
      const submitData = {
        ...formData,
        established_year: formData.established_year ? parseInt(formData.established_year) : null,
        ranking_national: formData.ranking_national ? parseInt(formData.ranking_national) : null,
        ranking_world: formData.ranking_world ? parseInt(formData.ranking_world) : null,
        tuition_min: formData.tuition_min ? parseFloat(formData.tuition_min) : null,
        tuition_max: formData.tuition_max ? parseFloat(formData.tuition_max) : null,
        default_tuition_per_year: formData.default_tuition_per_year ? parseFloat(formData.default_tuition_per_year) : null,
        scholarship_percentage: formData.scholarship_percentage ? parseInt(formData.scholarship_percentage) : null,
        images: formData.images ? formData.images.split('\n').map(url => url.trim()).filter(Boolean) : null,
        video_urls: formData.video_urls ? formData.video_urls.split('\n').map(url => url.trim()).filter(Boolean) : null,
        meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        intake_months: formData.intake_months.map(Number).filter(n => n >= 1 && n <= 12),
      }

      const response = await fetch(`/api/admin/universities/${universityId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success('University updated successfully')
        router.push(`/admin/v2/universities/${universityId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update university')
      }
    } catch (error) {
      console.error('Error updating university:', error)
      toast.error('Failed to update university')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/v2/universities/${universityId}`}>
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit University</h1>
            <p className="text-sm text-muted-foreground">{formData.name_en || 'University'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/v2/universities/${universityId}`}>
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="basic" className="gap-1">
              <IconBuilding className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1">
              <IconMapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="classification" className="gap-1">
              <IconTag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Classification</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-1">
              <IconPhoto className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-1">
              <IconSchool className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Academic</span>
            </TabsTrigger>
            <TabsTrigger value="tuition" className="gap-1">
              <IconCurrencyDollar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tuition</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1">
              <IconSeo className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>University name and basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_en">Name (English) *</Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => handleInputChange('name_en', e.target.value)}
                      placeholder="e.g., Tsinghua University"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_cn">Name (Chinese)</Label>
                    <Input
                      id="name_cn"
                      value={formData.name_cn}
                      onChange={(e) => handleInputChange('name_cn', e.target.value)}
                      placeholder="e.g., 清华大学"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="e.g., tsinghua-university"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="established_year">Established Year</Label>
                    <Input
                      id="established_year"
                      type="number"
                      value={formData.established_year}
                      onChange={(e) => handleInputChange('established_year', e.target.value)}
                      placeholder="e.g., 1911"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="e.g., https://www.tsinghua.edu.cn"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active (visible on website)</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>University location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => handleInputChange('province', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(province => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g., Beijing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="e.g., China"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location Description</Label>
                  <Textarea
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Additional location information or address"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Classification & Rankings</CardTitle>
                <CardDescription>University type, category, and rankings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>University Type(s)</Label>
                    <div className="flex flex-wrap gap-2">
                      {classificationTypes.map(type => (
                        <Badge
                          key={type.value}
                          variant={formData.type.includes(type.value) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            formData.type.includes(type.value) 
                              ? type.color 
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => {
                            const newTypes = formData.type.includes(type.value)
                              ? formData.type.filter(t => t !== type.value)
                              : [...formData.type, type.value]
                            handleInputChange('type', newTypes as any)
                          }}
                        >
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to select multiple types
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {universityCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select
                      value={formData.tier}
                      onValueChange={(value) => handleInputChange('tier', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tierOptions.map(tier => (
                          <SelectItem key={tier} value={tier}>{tier}</SelectItem>
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
                      onChange={(e) => handleInputChange('ranking_national', e.target.value)}
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ranking_world">World Ranking</Label>
                    <Input
                      id="ranking_world"
                      type="number"
                      value={formData.ranking_world}
                      onChange={(e) => handleInputChange('ranking_world', e.target.value)}
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Media & Images</CardTitle>
                <CardDescription>University logos, images, and videos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => handleInputChange('logo_url', e.target.value)}
                      placeholder="Logo image URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_image_url">Cover Image URL</Label>
                    <Input
                      id="cover_image_url"
                      type="url"
                      value={formData.cover_image_url}
                      onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                      placeholder="Cover image URL"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Main Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="Main image URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og_image">OG Image URL (Social)</Label>
                    <Input
                      id="og_image"
                      type="url"
                      value={formData.og_image}
                      onChange={(e) => handleInputChange('og_image', e.target.value)}
                      placeholder="OpenGraph image for social sharing"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">Additional Images (one URL per line)</Label>
                  <Textarea
                    id="images"
                    value={formData.images}
                    onChange={(e) => handleInputChange('images', e.target.value)}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_urls">Video URLs (one URL per line)</Label>
                  <Textarea
                    id="video_urls"
                    value={formData.video_urls}
                    onChange={(e) => handleInputChange('video_urls', e.target.value)}
                    placeholder="https://youtube.com/watch?v=xxx&#10;https://vimeo.com/xxx"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Description, facilities, and accommodation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="University description..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilities">Facilities</Label>
                  <Textarea
                    id="facilities"
                    value={formData.facilities}
                    onChange={(e) => handleInputChange('facilities', e.target.value)}
                    placeholder="Library, labs, sports facilities, etc."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="accommodation_available"
                    checked={formData.accommodation_available}
                    onCheckedChange={(checked) => handleInputChange('accommodation_available', checked)}
                  />
                  <Label htmlFor="accommodation_available">Accommodation Available</Label>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h4 className="font-medium">Admissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_application_fee"
                        checked={formData.has_application_fee}
                        onCheckedChange={(checked) => handleInputChange('has_application_fee', checked)}
                      />
                      <Label htmlFor="has_application_fee">Has Application Fee</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="csca_required"
                        checked={formData.csca_required}
                        onCheckedChange={(checked) => handleInputChange('csca_required', checked)}
                      />
                      <Label htmlFor="csca_required">CSCA Required</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intake Months</Label>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {intakeMonthOptions.map(month => (
                        <Badge
                          key={month.value}
                          variant={formData.intake_months.includes(month.value) ? 'default' : 'outline'}
                          className="cursor-pointer justify-center"
                          onClick={() => toggleIntakeMonth(month.value)}
                        >
                          {month.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acceptance_flexibility">Acceptance Flexibility</Label>
                    <Input
                      id="acceptance_flexibility"
                      value={formData.acceptance_flexibility}
                      onChange={(e) => handleInputChange('acceptance_flexibility', e.target.value)}
                      placeholder="e.g., Flexible, Strict, Conditional"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tuition Tab */}
          <TabsContent value="tuition" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tuition & Scholarships</CardTitle>
                <CardDescription>Tuition fees and scholarship information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tuition_min">Min Tuition</Label>
                    <Input
                      id="tuition_min"
                      type="number"
                      value={formData.tuition_min}
                      onChange={(e) => handleInputChange('tuition_min', e.target.value)}
                      placeholder="e.g., 15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuition_max">Max Tuition</Label>
                    <Input
                      id="tuition_max"
                      type="number"
                      value={formData.tuition_max}
                      onChange={(e) => handleInputChange('tuition_max', e.target.value)}
                      placeholder="e.g., 45000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tuition_currency">Currency</Label>
                    <Select
                      value={formData.tuition_currency}
                      onValueChange={(value) => handleInputChange('tuition_currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_tuition_per_year">Default Tuition/Year</Label>
                    <Input
                      id="default_tuition_per_year"
                      type="number"
                      value={formData.default_tuition_per_year}
                      onChange={(e) => handleInputChange('default_tuition_per_year', e.target.value)}
                      placeholder="Default annual tuition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_tuition_currency">Default Currency</Label>
                    <Select
                      value={formData.default_tuition_currency}
                      onValueChange={(value) => handleInputChange('default_tuition_currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use_default_tuition"
                        checked={formData.use_default_tuition}
                        onCheckedChange={(checked) => handleInputChange('use_default_tuition', checked)}
                      />
                      <Label htmlFor="use_default_tuition">Use Default</Label>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h4 className="font-medium">Scholarships</h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="scholarship_available"
                      checked={formData.scholarship_available}
                      onCheckedChange={(checked) => handleInputChange('scholarship_available', checked)}
                    />
                    <Label htmlFor="scholarship_available">Scholarship Available</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scholarship_percentage">Scholarship Percentage</Label>
                    <Input
                      id="scholarship_percentage"
                      type="number"
                      value={formData.scholarship_percentage}
                      onChange={(e) => handleInputChange('scholarship_percentage', e.target.value)}
                      placeholder="e.g., 50 (for 50%)"
                    />
                  </div>
                  {formData.scholarship_available && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_info">Scholarship Information (English)</Label>
                        <Textarea
                          id="scholarship_info"
                          value={formData.scholarship_info}
                          onChange={(e) => handleInputChange('scholarship_info', e.target.value)}
                          placeholder="Enter detailed scholarship information in English..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scholarship_info_cn">Scholarship Information (Chinese)</Label>
                        <Textarea
                          id="scholarship_info_cn"
                          value={formData.scholarship_info_cn}
                          onChange={(e) => handleInputChange('scholarship_info_cn', e.target.value)}
                          placeholder="输入奖学金详细信息（中文）..."
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Search engine optimization and meta tags</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSeo}
                    disabled={isGeneratingSeo}
                    className="gap-2"
                  >
                    {isGeneratingSeo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    placeholder="SEO title for search engines"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 50-60 characters. Current: {formData.meta_title.length} characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="SEO description for search engines"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 150-160 characters. Current: {formData.meta_description.length} characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords (comma separated)</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </>
  )
}
