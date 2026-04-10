"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
  IconTag,
  IconCurrencyDollar,
  IconSparkles,
  IconRefresh
} from "@tabler/icons-react"

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

// Type for AI generated data
interface AIGeneratedData {
  name_en: string;
  name_cn: string;
  description: string;
  province: string;
  city: string;
  type: string;
  category: string;
  established_year: number | null;
  website_url: string | null;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  short_name?: string;
  ranking_national?: number;
  ranking_world?: number;
  scholarship_available?: boolean;
  scholarship_percentage?: number;
  logo_url?: string;
  cover_image_url?: string;
}

export default function NewUniversityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_cn: '',
    short_name: '',
    slug: '',
    province: '',
    city: '',
    type: [] as string[],
    category: '',
    tier: '',
    ranking_national: '',
    ranking_world: '',
    website_url: '',
    description: '',
    logo_url: '',
    cover_image_url: '',
    tuition_min: '',
    tuition_max: '',
    tuition_currency: 'CNY',
    scholarship_available: false,
    scholarship_percentage: '',
    established_year: '',
    is_active: true,
  })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  const handleTypeToggle = (typeValue: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(typeValue)
        ? prev.type.filter(t => t !== typeValue)
        : [...prev.type, typeValue]
    }))
  }

  // AI Generate function
  const handleAIGenerate = async () => {
    if (!formData.name_en.trim()) {
      toast.error('Please enter a university name first')
      return
    }

    setIsGenerating(true)
    try {
      const { getValidToken } = await import('@/lib/auth-token')
      const token = await getValidToken()
      
      const response = await fetch('/api/admin/universities/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_en: formData.name_en,
          name_cn: formData.name_cn || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate university info')
      }

      const data = await response.json()
      const generated: AIGeneratedData = data.university

      // Map AI response to form data
      const updatedFormData = {
        ...formData,
        name_en: generated.name_en || formData.name_en,
        name_cn: generated.name_cn || formData.name_cn,
        short_name: generated.short_name || formData.short_name,
        province: generated.province || formData.province,
        city: generated.city || formData.city,
        category: mapCategory(generated.category) || formData.category,
        established_year: generated.established_year?.toString() || formData.established_year,
        website_url: generated.website_url || formData.website_url,
        description: generated.description || formData.description,
        ranking_national: generated.ranking_national?.toString() || formData.ranking_national,
        ranking_world: generated.ranking_world?.toString() || formData.ranking_world,
        logo_url: generated.logo_url || formData.logo_url,
        cover_image_url: generated.cover_image_url || formData.cover_image_url,
        scholarship_available: generated.scholarship_available ?? formData.scholarship_available,
        scholarship_percentage: generated.scholarship_percentage?.toString() || formData.scholarship_percentage,
        // Generate slug from name if not set
        slug: formData.slug || generateSlug(generated.name_en || formData.name_en),
      }

      // Handle type classification
      if (generated.type) {
        const typeMap: Record<string, string> = {
          '985': '985',
          '211': '211',
          'double_first_class': 'Double First-Class',
          'public': 'Provincial',
          'private': 'Provincial',
        }
        const mappedType = typeMap[generated.type.toLowerCase().replace(/[-\s]/g, '_')]
        if (mappedType && !updatedFormData.type.includes(mappedType)) {
          updatedFormData.type = [...updatedFormData.type, mappedType]
        }
      }

      setFormData(updatedFormData)
      setAiGenerated(true)
      toast.success('University info generated successfully! Review and edit as needed.')
    } catch (error) {
      console.error('Error generating university:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate university info')
    } finally {
      setIsGenerating(false)
    }
  }

  // Map AI category to our category list
  const mapCategory = (aiCategory: string | undefined): string => {
    if (!aiCategory) return ''
    const categoryMap: Record<string, string> = {
      'comprehensive': 'Comprehensive',
      'technical': 'Science & Technology',
      'science & technology': 'Science & Technology',
      'technology': 'Science & Technology',
      'medical': 'Medical',
      'agriculture': 'Agricultural',
      'agricultural': 'Agricultural',
      'normal': 'Normal (Teacher Training)',
      'teacher training': 'Normal (Teacher Training)',
      'finance': 'Finance & Economics',
      'economics': 'Finance & Economics',
      'business': 'Finance & Economics',
      'language': 'Language',
      'arts': 'Arts',
      'law': 'Law',
      'sports': 'Sports',
      'pharmaceutical': 'Pharmaceutical',
      'aerospace': 'Aerospace',
      'maritime': 'Maritime',
      'petroleum': 'Petroleum',
      'forestry': 'Forestry',
    }
    return categoryMap[aiCategory.toLowerCase()] || aiCategory
  }

  // Generate URL slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
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
      const response = await fetch('/api/admin/universities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ranking_national: formData.ranking_national ? parseInt(formData.ranking_national) : null,
          ranking_world: formData.ranking_world ? parseInt(formData.ranking_world) : null,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          tuition_min: formData.tuition_min ? parseFloat(formData.tuition_min) : null,
          tuition_max: formData.tuition_max ? parseFloat(formData.tuition_max) : null,
          scholarship_percentage: formData.scholarship_percentage ? parseInt(formData.scholarship_percentage) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('University created successfully')
        router.push(`/admin/v2/universities/${data.university.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create university')
      }
    } catch (error) {
      console.error('Error creating university:', error)
      toast.error('Failed to create university')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Add New University" />
          <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/v2/universities">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Back to Universities
                </Link>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Generation Card */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSparkles className="h-5 w-5 text-primary" />
                    AI-Powered University Generation
                  </CardTitle>
                  <CardDescription>
                    Enter a university name and let AI fill in all the details automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="ai_name_en">University Name</Label>
                      <Input
                        id="ai_name_en"
                        placeholder="e.g., Tsinghua University or 清华大学"
                        value={formData.name_en}
                        onChange={(e) => {
                          setFormData({ ...formData, name_en: e.target.value })
                          setAiGenerated(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAIGenerate()
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="ai_name_cn">Chinese Name (optional)</Label>
                      <Input
                        id="ai_name_cn"
                        placeholder="e.g., 清华大学"
                        value={formData.name_cn}
                        onChange={(e) => setFormData({ ...formData, name_cn: e.target.value })}
                      />
                    </div>
                    <Button 
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={isGenerating || !formData.name_en.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : aiGenerated ? (
                        <>
                          <IconRefresh className="mr-2 h-4 w-4" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <IconSparkles className="mr-2 h-4 w-4" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>
                  {aiGenerated && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      AI-generated content loaded. Review and edit fields below as needed.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Enter the essential details about the university
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name_en">English Name *</Label>
                      <Input
                        id="name_en"
                        placeholder="e.g., Tsinghua University"
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name_cn">Chinese Name</Label>
                      <Input
                        id="name_cn"
                        placeholder="e.g., 清华大学"
                        value={formData.name_cn}
                        onChange={(e) => setFormData({ ...formData, name_cn: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name / Abbreviation</Label>
                      <Input
                        id="short_name"
                        placeholder="e.g., THU"
                        value={formData.short_name}
                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="e.g., tsinghua-university"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website_url">Website</Label>
                      <Input
                        id="website_url"
                        type="url"
                        placeholder="https://www.example.edu.cn"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="established_year">Founded Year</Label>
                      <Input
                        id="established_year"
                        type="number"
                        placeholder="e.g., 1911"
                        value={formData.established_year}
                        onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => setFormData({ ...formData, province: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov) => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Beijing"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Classification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Classification & Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Classification Type</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select all that apply
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {classificationTypes.map((ct) => (
                        <Badge
                          key={ct.value}
                          variant={formData.type.includes(ct.value) ? "default" : "outline"}
                          className={`cursor-pointer ${formData.type.includes(ct.value) ? '' : ct.color}`}
                          onClick={() => handleTypeToggle(ct.value)}
                        >
                          {ct.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">University Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {universityCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">University Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tier 1">Tier 1 (Top)</SelectItem>
                          <SelectItem value="Tier 2">Tier 2</SelectItem>
                          <SelectItem value="Tier 3">Tier 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ranking_national">National Ranking</Label>
                      <Input
                        id="ranking_national"
                        type="number"
                        placeholder="e.g., 1"
                        value={formData.ranking_national}
                        onChange={(e) => setFormData({ ...formData, ranking_national: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ranking_world">International Ranking</Label>
                      <Input
                        id="ranking_world"
                        type="number"
                        placeholder="e.g., 20"
                        value={formData.ranking_world}
                        onChange={(e) => setFormData({ ...formData, ranking_world: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">General Description</Label>
                    <Textarea
                      id="description"
                      placeholder="University description..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="University description..."
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover_image_url">Cover Image URL</Label>
                      <Input
                        id="cover_image_url"
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={formData.cover_image_url}
                        onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tuition */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Tuition & Scholarships
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="tuition_min">Minimum Tuition</Label>
                      <Input
                        id="tuition_min"
                        type="number"
                        placeholder="e.g., 20000"
                        value={formData.tuition_min}
                        onChange={(e) => setFormData({ ...formData, tuition_min: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_max">Maximum Tuition</Label>
                      <Input
                        id="tuition_max"
                        type="number"
                        placeholder="e.g., 50000"
                        value={formData.tuition_max}
                        onChange={(e) => setFormData({ ...formData, tuition_max: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tuition_currency">Currency</Label>
                      <Select
                        value={formData.tuition_currency}
                        onValueChange={(value) => setFormData({ ...formData, tuition_currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNY">CNY</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Scholarship Available</Label>
                      <p className="text-sm text-muted-foreground">
                        University offers scholarships to international students
                      </p>
                    </div>
                    <Switch
                      checked={formData.scholarship_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, scholarship_available: checked })}
                    />
                  </div>
                  
                  {formData.scholarship_available && (
                    <div className="space-y-2">
                      <Label htmlFor="scholarship_percentage">Scholarship Coverage (%)</Label>
                      <Input
                        id="scholarship_percentage"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 50"
                        value={formData.scholarship_percentage}
                        onChange={(e) => setFormData({ ...formData, scholarship_percentage: e.target.value })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this university visible to students
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fixed Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-4 px-6 z-50 lg:ml-64">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="text-sm text-muted-foreground">
                    Creating new university
                    {aiGenerated && <span className="ml-2 text-green-600 dark:text-green-400">(AI-generated)</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/admin/v2/universities">
                        Cancel
                      </Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <IconDeviceFloppy className="mr-2 h-4 w-4" />
                          Create University
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
