'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { ContentAnalysisPanel } from '@/components/admin-v2/content-analysis-panel';
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
  IconLink,
  IconMessageCircleQuestion,
  IconCode,
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

interface InternalLinkSuggestion {
  post_slug: string;
  anchor_text: string;
  reason: string;
}

interface FAQ {
  question: string;
  answer: string;
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
  faqs: FAQ[];
  internal_links: InternalLinkSuggestion[];
}

interface BlogEditorProps {
  isEdit?: boolean;
  postId?: string;
}

export default function BlogEditor({ isEdit = false, postId }: BlogEditorProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEdit);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

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
    faqs: [],
    internal_links: [],
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
    if (!isEdit && formData.title_en && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title_en) }));
    }
  }, [formData.title_en, isEdit]);

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

  // Fetch post if editing
  useEffect(() => {
    if (isEdit && postId) {
      const fetchPost = async () => {
        try {
          const res = await fetch(`/api/admin/blog/${postId}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              title_en: data.post.title_en || '',
              title_cn: data.post.title_cn || '',
              slug: data.post.slug || '',
              excerpt_en: data.post.excerpt_en || '',
              excerpt_cn: data.post.excerpt_cn || '',
              content_en: data.post.content_en || '',
              content_cn: data.post.content_cn || '',
              featured_image_url: data.post.featured_image_url || '',
              featured_image_alt: data.post.featured_image_alt || '',
              category_id: data.post.category_id || '',
              author_name: data.post.author_name || '',
              status: data.post.status || 'draft',
              is_featured: data.post.is_featured || false,
              allow_comments: data.post.allow_comments !== false,
              seo_title: data.post.seo_title || '',
              seo_description: data.post.seo_description || '',
              seo_keywords: data.post.seo_keywords?.join(', ') || '',
              tags: data.post.tags?.map((t: Tag) => t.id) || [],
              faqs: data.post.faqs || [],
              internal_links: data.post.internal_links || [],
            });
          }
        } catch (error) {
          console.error('Error fetching post:', error);
        } finally {
          setInitialLoad(false);
        }
      };
      
      fetchPost();
    }
  }, [isEdit, postId]);

  // Handle full content generation
  const handleFullGenerate = async (topic: string) => {
    if (!topic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Generating complete blog post package...');

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch('/api/admin/blog/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'full_content',
          topic,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // Buffer to hold incomplete lines
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6);
              if (dataStr === '[DONE]') {
                continue;
              }
              
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'progress') {
                  // Update progress
                  setGenerationStep('Generating content...');
                } else if (data.type === 'complete') {
                  // Apply the complete generated data
                  const generated = data.data;
                  setFormData(prev => ({
                    ...prev,
                    title_en: generated.title_en || prev.title_en,
                    title_cn: generated.title_cn || prev.title_cn,
                    slug: generated.slug || prev.slug,
                    excerpt_en: generated.excerpt_en || prev.excerpt_en,
                    excerpt_cn: generated.excerpt_cn || prev.excerpt_cn,
                    content_en: generated.content_en || prev.content_en,
                    content_cn: generated.content_cn || prev.content_cn,
                    seo_title: generated.seo_title || prev.seo_title,
                    seo_description: generated.seo_description || prev.seo_description,
                    seo_keywords: generated.seo_keywords?.join(', ') || prev.seo_keywords,
                    faqs: generated.faqs || prev.faqs,
                  }));
                  toast.success('Complete blog post generated successfully!');
                } else if (data.type === 'error') {
                  toast.error(data.error || 'Failed to generate content');
                }
              } catch (e) {
                console.error('Parse error for line:', trimmedLine, e);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Handle internal link suggestions
  const handleSuggestLinks = async () => {
    if (!formData.title_en && !formData.content_en) {
      toast.error('Please enter a title or content first');
      return;
    }

    setIsGeneratingLinks(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const response = await fetch('/api/admin/blog/ai/suggest-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: formData.title_en,
          content: formData.content_en,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          internal_links: data.suggestions || [],
        }));
        toast.success(`Found ${data.suggestions?.length || 0} link suggestions!`);
      } else {
        toast.error('Failed to get link suggestions');
      }
    } catch (error) {
      console.error('Link suggestion error:', error);
      toast.error('Failed to get link suggestions');
    } finally {
      setIsGeneratingLinks(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published' | 'archived' = formData.status) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.title_en || !formData.title_en.trim()) {
      toast.error('Title (English) is required');
      return;
    }

    if (!formData.slug || !formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Slug must be lowercase, alphanumeric, and use hyphens instead of spaces (e.g., "my-blog-post")');
      return;
    }

    if (!formData.content_en || !formData.content_en.trim()) {
      toast.error('Content (English) is required');
      return;
    }

    setLoading(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const tagsArray = formData.seo_keywords ? formData.seo_keywords.split(',').map(t => t.trim()).filter(t => t) : [];
      
      const payload = {
        ...formData,
        status: saveAs,
        tags: formData.tags,
        seo_keywords: tagsArray,
      };

      let res;
      if (isEdit && postId) {
        res = await fetch(`/api/admin/blog/${postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(isEdit ? 'Post updated successfully!' : 'Post created successfully!');
        router.push('/admin/v2/blog');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save post. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              {isEdit ? 'Edit Blog Post' : 'New Blog Post'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEdit ? 'Update your blog post' : 'Create a new blog post'}
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
            {isEdit ? 'Update Post' : 'Publish Post'}
          </Button>
        </div>
      </div>

      {/* Quick Generate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5" />
            AI Quick Generate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Enter a topic (e.g., 'Why study computer science in China')"
              value={formData.title_en}
              onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
              className="flex-1"
            />
            <Button
              onClick={() => handleFullGenerate(formData.title_en)}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconSparkles className="h-4 w-4" />
              )}
              {isGenerating ? generationStep : 'Generate All Content'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {/* Title */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title (English) *</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="Enter post title in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_cn">标题 (中文)</Label>
                  <Input
                    id="title_cn"
                    value={formData.title_cn}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_cn: e.target.value }))}
                    placeholder="输入中文标题"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase, alphanumeric, hyphens only)
                </p>
              </div>

              {/* Excerpt */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="excerpt_en">Excerpt (English)</Label>
                  <Textarea
                    id="excerpt_en"
                    value={formData.excerpt_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt_en: e.target.value }))}
                    placeholder="Brief summary of the post in English"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt_cn">摘要 (中文)</Label>
                  <Textarea
                    id="excerpt_cn"
                    value={formData.excerpt_cn}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt_cn: e.target.value }))}
                    placeholder="中文摘要"
                    rows={3}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content_en">Content (English) *</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                  placeholder="Write your post content in English (Markdown supported)"
                  className="min-h-[400px] font-mono"
                />
              </div>

              {/* Content Chinese */}
              <div className="space-y-2">
                <Label htmlFor="content_cn">内容 (中文)</Label>
                <Textarea
                  id="content_cn"
                  value={formData.content_cn}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_cn: e.target.value }))}
                  placeholder="输入中文内容 (支持 Markdown)"
                  className="min-h-[400px] font-mono"
                />
              </div>
            </div>
          </TabsContent>

          {/* Internal Links Tab */}
          <TabsContent value="links" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <IconLink className="h-5 w-5" />
                  Internal Link Suggestions
                </CardTitle>
                <Button
                  onClick={handleSuggestLinks}
                  disabled={isGeneratingLinks}
                  size="sm"
                  className="gap-2"
                >
                  {isGeneratingLinks ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconSparkles className="h-4 w-4" />
                  )}
                  Suggest Links
                </Button>
              </CardHeader>
              <CardContent>
                {formData.internal_links.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Click &quot;Suggest Links&quot; to get relevant internal link suggestions
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.internal_links.map((link, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium">Anchor Text: {link.anchor_text}</p>
                              <p className="text-sm text-muted-foreground">Slug: {link.post_slug}</p>
                              <p className="text-xs text-muted-foreground mt-2">{link.reason}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                internal_links: prev.internal_links.filter((_, i) => i !== index),
                              }))}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <IconMessageCircleQuestion className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    faqs: [...prev.faqs, { question: '', answer: '' }],
                  }))}
                >
                  Add FAQ
                </Button>
              </CardHeader>
              <CardContent>
                {formData.faqs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No FAQs yet. Click &quot;Add FAQ&quot; to add some, or use AI generation!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.faqs.map((faq, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <Label>Question</Label>
                                <Input
                                  value={faq.question}
                                  onChange={(e) => {
                                    const newFaqs = [...formData.faqs];
                                    newFaqs[index].question = e.target.value;
                                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                  }}
                                  placeholder="Enter question"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Answer</Label>
                                <Textarea
                                  value={faq.answer}
                                  onChange={(e) => {
                                    const newFaqs = [...formData.faqs];
                                    newFaqs[index].answer = e.target.value;
                                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                  }}
                                  placeholder="Enter answer"
                                  rows={3}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                faqs: prev.faqs.filter((_, i) => i !== index),
                              }))}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain similar to existing implementation */}
          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featured_image_url">Featured Image URL</Label>
                <Input
                  id="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featured_image_alt">Featured Image Alt Text</Label>
                <Input
                  id="featured_image_alt"
                  value={formData.featured_image_alt}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image_alt: e.target.value }))}
                  placeholder="Description of the image"
                />
              </div>
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title (max 60 characters)"
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.seo_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="Meta description (150-160 characters)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.seo_description.length}/160 characters
                </p>
              </div>

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

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <IconCode className="h-5 w-5" />
                  Schema Markup
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    // Generate schema based on current form data
                    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyinchinaacademy.com';
                    const articleSchema = {
                      "@context": "https://schema.org",
                      "@type": "Article",
                      "headline": formData.title_en,
                      "description": formData.excerpt_en,
                      "author": {
                        "@type": "Person",
                        "name": formData.author_name || "Admin"
                      },
                      "publisher": {
                        "@type": "Organization",
                        "name": "Study in China Academy",
                        "logo": {
                          "@type": "ImageObject",
                          "url": `${baseUrl}/logo.png`
                        }
                      },
                      "datePublished": new Date().toISOString(),
                      "dateModified": new Date().toISOString(),
                      "image": formData.featured_image_url || `${baseUrl}/default-blog-image.jpg`,
                      "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": `${baseUrl}/blog/${formData.slug}`
                      }
                    };

                    const faqSchema = formData.faqs.length > 0 ? {
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      "mainEntity": formData.faqs.map(faq => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": faq.answer
                        }
                      }))
                    } : null;

                    toast.success('Schema generated successfully!');
                    // We'll add state to store and display schema in next iteration
                  }}
                >
                  <IconSparkles className="mr-2 h-4 w-4" />
                  Generate Schema
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate Schema.org markup for better SEO. Includes Article schema and FAQPage schema (if FAQs are added).
                  </p>
                  <Card>
                    <CardContent className="pt-6">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                        {JSON.stringify({
                          "@context": "https://schema.org",
                          "@type": "Article",
                          "headline": formData.title_en || "Your Article Title",
                          "description": formData.excerpt_en || "Your article description",
                          "author": {
                            "@type": "Person",
                            "name": formData.author_name || "Admin"
                          }
                        }, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentAnalysisPanel
                title={formData.title_en}
                content={formData.content_en}
                seoTitle={formData.seo_title}
                seoDescription={formData.seo_description}
                seoKeywords={formData.seo_keywords}
                excerpt={formData.excerpt_en}
              />
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
            </div>
        </div>
      </form>
    </div>
  );
}
