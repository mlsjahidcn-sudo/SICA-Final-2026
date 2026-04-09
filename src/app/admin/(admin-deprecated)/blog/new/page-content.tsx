'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  IconFileText,
  IconArrowLeft,
  IconSparkles,
  IconSettings,
  IconSearch,
  IconEye,
  IconLoader2,
  IconCheck,
  IconTrash,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_en: string;
  name_cn: string | null;
  slug: string;
}

interface Tag {
  id: string;
  name_en: string;
  name_cn: string | null;
  slug: string;
}

interface BlogPostFormData {
  title_en: string;
  title_cn: string;
  slug: string;
  excerpt_en: string;
  excerpt_cn: string;
  content_en: string;
  content_cn: string;
  featured_image_url: string;
  featured_image_alt: string;
  category_id: string;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  allow_comments: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  tags: string[];
}

export default function NewBlogPost() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generationContent, setGenerationContent] = useState('');

  const [formData, setFormData] = useState<BlogPostFormData>({
    title_en: '',
    title_cn: '',
    slug: '',
    excerpt_en: '',
    excerpt_cn: '',
    content_en: '',
    content_cn: '',
    featured_image_url: '',
    featured_image_alt: '',
    category_id: '',
    author_name: '',
    status: 'draft' as const,
    is_featured: false,
    allow_comments: true,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    tags: [],
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  // Auto-generate slug when English title changes
  useEffect(() => {
    if (formData.title_en && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title_en) }));
    }
  }, [formData.title_en]);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags'),
        ]);
        
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories);
        }
        
        if (tagRes.ok) {
          const data = await tagRes.json();
          setAvailableTags(data.tags);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Handle AI generation
  const handleAIGenerate = async (type: string, prompt?: string) => {
    setIsGenerating(type);
    setGenerationContent('');
    
    try {
      const token = localStorage.getItem('sica_auth_token');
      const response = await fetch('/api/admin/blog/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          prompt,
          topic: formData.title_en,
          existingContent: type === 'content' ? formData.content_en : 
                         type === 'excerpt' || type === 'seo_description' ? formData.excerpt_en :
                         formData.content_en,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') {
                setIsGenerating(null);
                return;
              }
              
              try {
                const data = JSON.parse(dataStr);
                if (data.content) {
                  setGenerationContent(prev => prev + data.content);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(null);
    }
  };

  // Apply generated content
  const applyGeneratedContent = (type: string) => {
    switch (type) {
      case 'title':
        setFormData(prev => ({ ...prev, title_en: generationContent.trim() }));
        break;
      case 'excerpt':
        setFormData(prev => ({ ...prev, excerpt_en: generationContent.trim() }));
        break;
      case 'content':
        setFormData(prev => ({ ...prev, content_en: generationContent.trim() }));
        break;
      case 'seo_title':
        setFormData(prev => ({ ...prev, seo_title: generationContent.trim() }));
        break;
      case 'seo_description':
        setFormData(prev => ({ ...prev, seo_description: generationContent.trim() }));
        break;
    }
    setGenerationContent('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published' | 'archived' = formData.status) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('sica_auth_token');
      const tagsArray = formData.seo_keywords ? formData.seo_keywords.split(',').map(t => t.trim()).filter(t => t) : [];
      
      const payload = {
        ...formData,
        status: saveAs,
        tags: formData.tags,
        seo_keywords: tagsArray,
      };

      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Post created successfully!');
        router.push('/admin/blog');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              New Blog Post
            </h1>
            <p className="text-muted-foreground text-sm">
              Create a new blog post
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
          >
            Save Draft
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconCheck className="h-4 w-4" />
            )}
            Publish Post
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title_en">Title (English) *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIGenerate('title')}
                    disabled={isGenerating === 'title'}
                    className="gap-1"
                  >
                    {isGenerating === 'title' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                  placeholder="Enter post title"
                />
              </div>

              {/* AI Generation Preview for Title */}
              {isGenerating === 'title' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-2">Generating title...</p>
                    <p className="font-medium">{generationContent}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => applyGeneratedContent('title')}>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsGenerating(null);
                        setGenerationContent('');
                      }}>
                        <IconTrash className="h-4 w-4 mr-2" />
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt_en">Excerpt (English)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIGenerate('excerpt')}
                    disabled={isGenerating === 'excerpt'}
                    className="gap-1"
                  >
                    {isGenerating === 'excerpt' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="excerpt_en"
                  value={formData.excerpt_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt_en: e.target.value }))}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>

              {/* AI Generation Preview for Excerpt */}
              {isGenerating === 'excerpt' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-2">Generating excerpt...</p>
                    <p>{generationContent}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => applyGeneratedContent('excerpt')}>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsGenerating(null);
                        setGenerationContent('');
                      }}>
                        <IconTrash className="h-4 w-4 mr-2" />
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content_en">Content (English) *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIGenerate('content')}
                    disabled={isGenerating === 'content'}
                    className="gap-1"
                  >
                    {isGenerating === 'content' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                  placeholder="Write your post content (Markdown supported)"
                  className="min-h-[400px] font-mono"
                />
              </div>

              {/* AI Generation Preview for Content */}
              {isGenerating === 'content' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-2">Generating content...</p>
                    <div className="whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {generationContent}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => applyGeneratedContent('content')}>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsGenerating(null);
                        setGenerationContent('');
                      }}>
                        <IconTrash className="h-4 w-4 mr-2" />
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIGenerate('seo_title')}
                    disabled={isGenerating === 'seo_title'}
                    className="gap-1"
                  >
                    {isGenerating === 'seo_title' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title (max 60 characters)"
                  maxLength={60}
                />
              </div>

              {isGenerating === 'seo_title' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-2">Generating SEO title...</p>
                    <p>{generationContent}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => applyGeneratedContent('seo_title')}>
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsGenerating(null);
                        setGenerationContent('');
                      }}>
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIGenerate('seo_description')}
                    disabled={isGenerating === 'seo_description'}
                    className="gap-1"
                  >
                    {isGenerating === 'seo_description' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="Meta description (150-160 characters)"
                  maxLength={160}
                  rows={3}
                />
              </div>

              {isGenerating === 'seo_description' && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-2">Generating meta description...</p>
                    <p>{generationContent}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => applyGeneratedContent('seo_description')}>
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsGenerating(null);
                        setGenerationContent('');
                      }}>
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="seo_keywords">Keywords (comma separated)</Label>
                <Input
                  id="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Author name"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">Featured Post</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_comments">Allow Comments</Label>
                  <Switch
                    id="allow_comments"
                    checked={formData.allow_comments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_comments: checked }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
