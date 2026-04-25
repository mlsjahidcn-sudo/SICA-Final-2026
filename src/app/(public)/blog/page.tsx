'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSearch,
  IconClock,
  IconEye,
  IconNews,
  IconBook,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: {
    name: string;
    avatar: string | null;
  };
  isFeatured: boolean;
  viewCount: number;
  readingTime: number;
  publishedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  postCount: number;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  postCount: number;
}

// Blog Post Card Component
function BlogPostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const publishedDate = post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '';

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-[16/9] md:aspect-auto">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAlt || post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <IconNews className="h-16 w-16 text-primary/30" />
                </div>
              )}
              {post.isFeatured && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0">
                  Featured
                </Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-6 flex flex-col justify-center">
              {post.category && (
                <Badge 
                  variant="outline" 
                  className="w-fit mb-3"
                  style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}
                >
                  {post.category.name}
                </Badge>
              )}
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{post.author.name}</span>
                <span>•</span>
                <span>{publishedDate}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <IconClock className="h-4 w-4" />
                  {post.readingTime} min read
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[16/9]">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt || post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <IconNews className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {post.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 text-xs">
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {post.category && (
            <Badge 
              variant="outline" 
              className="mb-2 text-xs"
              style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}
            >
              {post.category.name}
            </Badge>
          )}
          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {post.author.avatar && (
                <Image 
                  src={post.author.avatar} 
                  alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                {post.readingTime} min
              </span>
              <span className="flex items-center gap-1">
                <IconEye className="h-3 w-3" />
                {post.viewCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton Card
function BlogPostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function BlogContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories and tags
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags'),
        ]);
        
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories);
        }
        
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData.tags);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Fetch featured post
        const featuredRes = await fetch('/api/blog?featured=true&limit=1');
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedPost(featuredData.posts[0] || null);
        }

        // Fetch all posts
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '9');
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (tagFilter) params.append('tag', tagFilter);

        const res = await fetch(`/api/blog?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, searchQuery, selectedCategory, tagFilter]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <IconBook className="h-3.5 w-3.5 mr-1.5" />
              Our Blog
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Study in China Insights
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Expert guides, student stories, and essential tips for your journey to studying in China
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name} ({cat.postCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Featured Post */}
        {featuredPost && page === 1 && !searchQuery && selectedCategory === 'all' && !tagFilter && (
          <div className="mb-8">
            <BlogPostCard post={featuredPost} featured />
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogPostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <IconNews className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setPage(1);
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Sidebar - Tags */}
        {tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="font-semibold mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-colors",
                    tagFilter === tag.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {tag.name}
                  <span className="ml-1.5 text-xs opacity-70">({tag.postCount})</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}
