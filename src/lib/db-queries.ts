/**
 * Centralized Database Queries
 * Optimized query builders for common database operations
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { withTimeout } from './api-cache';

// Timeout constants
const QUERY_TIMEOUT = 5000; // 5 seconds
const LONG_QUERY_TIMEOUT = 10000; // 10 seconds for complex queries

// ============================================
// Universities Queries
// ============================================

export const universitiesQueries = {
  /**
   * Get paginated list of active universities
   */
  async getList(params: {
    page?: number;
    limit?: number;
    search?: string | null;
    province?: string | null;
    type?: string | null;
    category?: string | null;
    scholarship?: string | null;
  }) {
    const { page = 1, limit = 12, search, province, type, category, scholarship } = params;
    const offset = (page - 1) * limit;
    
    const supabase = getSupabaseClient();
    
    // Count query
    let countQuery = supabase
      .from('universities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Data query with minimal fields for list view
    let dataQuery = supabase
      .from('universities')
      .select(`
        id,
        name_en,
        name_cn,
        short_name,
        logo_url,
        cover_image_url,
        province,
        city,
        type,
        category,
        ranking_national,
        ranking_international,
        scholarship_available,
        student_count
      `)
      .eq('status', 'active')
      .order('ranking_national', { ascending: true, nullsFirst: false })
      .order('name_en', { ascending: true });

    // Apply filters
    if (search) {
      const searchTerm = `%${search}%`;
      countQuery = countQuery.or(`name_en.ilike.${searchTerm},name_cn.ilike.${searchTerm}`);
      dataQuery = dataQuery.or(`name_en.ilike.${searchTerm},name_cn.ilike.${searchTerm}`);
    }

    if (province) {
      countQuery = countQuery.eq('province', province);
      dataQuery = dataQuery.eq('province', province);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
      dataQuery = dataQuery.eq('type', type);
    }

    if (category) {
      countQuery = countQuery.eq('category', category);
      dataQuery = dataQuery.eq('category', category);
    }

    if (scholarship === 'true') {
      countQuery = countQuery.eq('scholarship_available', true);
      dataQuery = dataQuery.eq('scholarship_available', true);
    }

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute with timeout
    const [countResult, dataResult] = await Promise.all([
      withTimeout(countQuery, QUERY_TIMEOUT, 'University count query timed out'),
      withTimeout(dataQuery, QUERY_TIMEOUT, 'University list query timed out'),
    ]);

    return {
      data: dataResult.data || [],
      count: countResult.count || 0,
      error: countResult.error || dataResult.error,
    };
  },

  /**
   * Get university by ID with full details
   */
  async getById(id: string) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await withTimeout(
      supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .single(),
      QUERY_TIMEOUT,
      'University detail query timed out'
    );

    return { data, error };
  },

  /**
   * Get featured universities for homepage
   */
  async getFeatured(limit = 6) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await withTimeout(
      supabase
        .from('universities')
        .select(`
          id,
          name_en,
          name_cn,
          logo_url,
          cover_image_url,
          province,
          city,
          type,
          ranking_national,
          scholarship_available
        `)
        .eq('status', 'active')
        .eq('scholarship_available', true)
        .order('ranking_national', { ascending: true, nullsFirst: false })
        .limit(limit),
      QUERY_TIMEOUT,
      'Featured universities query timed out'
    );

    return { data: data || [], error };
  },
};

// ============================================
// Programs Queries
// ============================================

export const programsQueries = {
  /**
   * Get paginated list of active programs
   */
  async getList(params: {
    page?: number;
    limit?: number;
    university_id?: string | null;
    search?: string | null;
    degree_level?: string | null;
    language?: string | null;
    category?: string | null;
    scholarship?: string | null;
  }) {
    const { page = 1, limit = 12, university_id, search, degree_level, language, category, scholarship } = params;
    const offset = (page - 1) * limit;
    
    const supabase = getSupabaseClient();
    
    // Build query with university join for minimal data
    let query = supabase
      .from('programs')
      .select(`
        id,
        name,
        degree_level,
        language,
        category,
        tuition_fee_per_year,
        currency,
        scholarship_coverage,
        duration_years,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province,
          logo_url,
          type
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Apply filters
    if (university_id) {
      query = query.eq('university_id', university_id);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (degree_level) {
      query = query.eq('degree_level', degree_level);
    }

    if (language) {
      query = query.contains('language', [language]);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (scholarship === 'true') {
      query = query.gt('scholarship_coverage', 0);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await withTimeout(
      query,
      QUERY_TIMEOUT,
      'Programs list query timed out'
    );

    return { data: data || [], count: count || 0, error };
  },

  /**
   * Get program by ID with full details
   */
  async getById(id: string) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await withTimeout(
      supabase
        .from('programs')
        .select(`
          *,
          universities (*)
        `)
        .eq('id', id)
        .single(),
      QUERY_TIMEOUT,
      'Program detail query timed out'
    );

    return { data, error };
  },
};

// ============================================
// Applications Queries
// ============================================

export const applicationsQueries = {
  /**
   * Get applications by student ID
   */
  async getByStudentId(studentId: string, params?: { status?: string }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        priority,
        created_at,
        submitted_at,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            name_cn,
            logo_url
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await withTimeout(
      query,
      QUERY_TIMEOUT,
      'Student applications query timed out'
    );

    return { data: data || [], error };
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const supabase = getSupabaseClient();
    
    // Use the materialized view if available, otherwise query directly
    const { data, error } = await withTimeout(
      supabase
        .from('dashboard_statistics')
        .select('*')
        .limit(1)
        .maybeSingle(),
      QUERY_TIMEOUT,
      'Dashboard stats query timed out'
    );

    return { data, error };
  },
};

// ============================================
// Blog Queries
// ============================================

export const blogQueries = {
  /**
   * Get published blog posts
   */
  async getList(params?: { limit?: number; category?: string }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        published_at,
        reading_time,
        view_count,
        blog_categories (
          id,
          name_en,
          slug
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (params?.category) {
      query = query.eq('category_slug', params.category);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await withTimeout(
      query,
      QUERY_TIMEOUT,
      'Blog posts query timed out'
    );

    return { data: data || [], error };
  },

  /**
   * Get blog post by slug
   */
  async getBySlug(slug: string) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await withTimeout(
      supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (*),
          users:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single(),
      QUERY_TIMEOUT,
      'Blog post detail query timed out'
    );

    return { data, error };
  },
};

// ============================================
// Testimonials Queries
// ============================================

export const testimonialsQueries = {
  /**
   * Get approved testimonials
   */
  async getList(params?: { limit?: number; featured?: boolean }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('testimonials')
      .select('*')
      .in('status', ['approved', 'featured'])
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (params?.featured) {
      query = query.eq('is_featured', true);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await withTimeout(
      query,
      QUERY_TIMEOUT,
      'Testimonials query timed out'
    );

    return { data: data || [], error };
  },
};

// ============================================
// Partners Queries
// ============================================

export const partnersQueries = {
  /**
   * Get active partners for showcase
   */
  async getList(params?: { limit?: number; type?: string }) {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('partner_showcases')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true });

    if (params?.type) {
      query = query.eq('partner_type', params.type);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await withTimeout(
      query,
      QUERY_TIMEOUT,
      'Partners query timed out'
    );

    return { data: data || [], error };
  },
};
