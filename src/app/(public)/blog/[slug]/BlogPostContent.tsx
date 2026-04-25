'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  IconClock,
  IconEye,
  IconArrowLeft,
  IconShare,
  IconBrandFacebook,
  IconBrandX,
  IconBrandLinkedin,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import type { ReactElement } from 'react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: {
    id: string | null;
    name: string;
    avatar: string | null;
  };
  isFeatured: boolean;
  viewCount: number;
  readingTime: number;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string[] | null;
  };
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    description: string | null;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }>;
  relatedPosts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    featuredImage: string | null;
    publishedAt: string;
  }>;
}

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const publishedDate = post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : '';
  const updatedDate = post.updatedAt ? format(new Date(post.updatedAt), 'MMMM d, yyyy') : '';

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleShare = async (platform?: string) => {
    const shareText = `${post.title} - Study in China Academy`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  // Simple markdown-like rendering for content
  const renderContent = (content: string) => {
    // Split by headers
    const sections = content.split(/\n(?=#)/);
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const elements: ReactElement[] = [];
      let currentParagraph = '';
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('## ')) {
          if (currentParagraph) {
            elements.push(<p key={`p-${index}-${lineIndex}`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
            currentParagraph = '';
          }
          elements.push(<h2 key={`h2-${index}-${lineIndex}`} className="text-2xl font-bold mt-8 mb-4">{trimmedLine.slice(3)}</h2>);
        } else if (trimmedLine.startsWith('### ')) {
          if (currentParagraph) {
            elements.push(<p key={`p-${index}-${lineIndex}`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
            currentParagraph = '';
          }
          elements.push(<h3 key={`h3-${index}-${lineIndex}`} className="text-xl font-semibold mt-6 mb-3">{trimmedLine.slice(4)}</h3>);
        } else if (trimmedLine.startsWith('# ')) {
          if (currentParagraph) {
            elements.push(<p key={`p-${index}-${lineIndex}`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
            currentParagraph = '';
          }
          elements.push(<h1 key={`h1-${index}-${lineIndex}`} className="text-3xl font-bold mt-8 mb-4">{trimmedLine.slice(2)}</h1>);
        } else if (trimmedLine.startsWith('- ')) {
          if (currentParagraph) {
            elements.push(<p key={`p-${index}-${lineIndex}`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
            currentParagraph = '';
          }
          elements.push(<li key={`li-${index}-${lineIndex}`} className="ml-4 mb-2 text-muted-foreground">{trimmedLine.slice(2)}</li>);
        } else if (trimmedLine === '') {
          if (currentParagraph) {
            elements.push(<p key={`p-${index}-${lineIndex}`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
            currentParagraph = '';
          }
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
        }
      });
      
      if (currentParagraph) {
        elements.push(<p key={`p-${index}-last`} className="mb-4 text-muted-foreground leading-relaxed">{currentParagraph}</p>);
      }
      
      return <div key={index}>{elements}</div>;
    });
  };

  return (
    <article className="min-h-screen bg-muted/30">
      {/* Hero Section */}
      <div className="relative">
        {post.featuredImage && (
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
          </div>
        )}
        
        <div className="max-w-[1400px] mx-auto px-4">
          {/* Back Button */}
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 mt-6"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Category & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`}>
                <Badge 
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}
                >
                  {post.category.name}
                </Badge>
              </Link>
            )}
            {post.isFeatured && (
              <Badge className="bg-amber-500 text-white border-0">Featured</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            {post.excerpt}
          </p>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-6 border-b">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconUser className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <div className="font-medium">{post.author.name}</div>
                <div className="text-sm text-muted-foreground">Author</div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="hidden sm:block h-12" />
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IconCalendar className="h-4 w-4" />
                {publishedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock className="h-4 w-4" />
                {post.readingTime} min read
              </span>
              <span className="flex items-center gap-1.5">
                <IconEye className="h-4 w-4" />
                {post.viewCount} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Article Content */}
            <div className="bg-card rounded-xl border p-6 sm:p-8">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {renderContent(post.content)}
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog?tag=${tag.slug}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Share Section */}
            <div className="mt-8 p-6 bg-card rounded-xl border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Found this helpful?</h3>
                  <p className="text-sm text-muted-foreground">Share it with others who might benefit</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2"
                  >
                    <IconBrandX className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2"
                  >
                    <IconBrandFacebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="gap-2"
                  >
                    <IconBrandLinkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Last updated: {updatedDate}
              </p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Share Card */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Share Article</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('twitter')}
                    >
                      <IconBrandX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('facebook')}
                    >
                      <IconBrandFacebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('linkedin')}
                    >
                      <IconBrandLinkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare()}
                    >
                      <IconShare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Category Info */}
              {post.category && post.category.description && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{post.category.name}</h3>
                    <p className="text-sm text-muted-foreground">{post.category.description}</p>
                    <Link href={`/blog?category=${post.category.slug}`}>
                      <Button variant="link" className="px-0 mt-2">
                        View all posts in {post.category.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {post.relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {post.relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <div className="relative aspect-[16/9]">
                      {relatedPost.featuredImage ? (
                        <Image
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
