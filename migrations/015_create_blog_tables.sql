-- Migration: Create blog tables
-- Date: 2026-04-12
-- Purpose: Create blog system tables for content management

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_cn VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    description_en TEXT,
    description_cn TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    parent_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on blog_categories slug
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories USING btree (slug);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(50) NOT NULL,
    name_cn VARCHAR(50),
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on blog_tags slug
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags USING btree (slug);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_cn VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt_en TEXT,
    excerpt_cn TEXT,
    content_en TEXT NOT NULL,
    content_cn TEXT,
    featured_image_url TEXT,
    featured_image_alt VARCHAR(255),
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    author_avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    -- AI-generated content fields
    internal_links JSONB DEFAULT '[]'::jsonb,
    faqs JSONB DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create indexes on blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts USING btree (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_internal_links ON blog_posts USING GIN (internal_links);
CREATE INDEX IF NOT EXISTS idx_blog_posts_faqs ON blog_posts USING GIN (faqs);

-- Create blog_post_tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Add comments for documentation
COMMENT ON TABLE blog_categories IS 'Blog category management with bilingual support';
COMMENT ON TABLE blog_tags IS 'Blog tags for content organization';
COMMENT ON TABLE blog_posts IS 'Blog posts with bilingual content, SEO, and AI-generated features';
COMMENT ON TABLE blog_post_tags IS 'Junction table for blog posts and tags (many-to-many relationship)';
COMMENT ON COLUMN blog_posts.internal_links IS 'JSONB array of internal link suggestions with post_slug, anchor_text, and reason fields';
COMMENT ON COLUMN blog_posts.faqs IS 'JSONB array of FAQ objects with question and answer fields';
