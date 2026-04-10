import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostContent from './BlogPostContent';
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/json-ld';

const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

// Generate static params for popular posts
export async function generateStaticParams() {
  // Return empty array - will use ISR
  return [];
}

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/blog/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return {
        title: 'Post Not Found',
      };
    }
    
    const { post } = await res.json();
    
    return {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt,
      keywords: post.seo?.keywords,
      openGraph: {
        title: post.seo?.title || post.title,
        description: post.seo?.description || post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author.name],
        images: post.featuredImage ? [{ 
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.featuredImageAlt || post.title,
        }] : [],
        url: `${baseUrl}/blog/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seo?.title || post.title,
        description: post.seo?.description || post.excerpt,
        images: post.featuredImage ? [post.featuredImage] : [],
      },
      alternates: {
        canonical: `${baseUrl}/blog/${slug}`,
      },
    };
  } catch {
    return {
      title: 'Blog Post',
    };
  }
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  // Fetch post server-side
  let post;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/api/blog/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      notFound();
    }
    
    const data = await res.json();
    post = data.post;
  } catch {
    notFound();
  }

  // Prepare structured data
  const articleSchema = {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    url: `${baseUrl}/blog/${slug}`,
    publishedAt: post.publishedAt,
    modifiedAt: post.updatedAt,
    author: post.author.name,
    image: post.featuredImage || undefined,
    category: post.category?.name,
  };

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${slug}` },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <ArticleSchema article={articleSchema} />
      <BreadcrumbSchema items={breadcrumbItems} />
      <BlogPostContent post={post} />
    </>
  );
}
