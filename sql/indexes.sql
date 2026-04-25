-- ============================================
-- Performance Optimization: Database Indexes
-- Run this script in Supabase SQL Editor
-- ============================================

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- UNIVERSITIES TABLE
-- ============================================

-- Index for is_active filtering
CREATE INDEX IF NOT EXISTS idx_universities_is_active ON universities(is_active);

-- Index for province filtering
CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);

-- Index for city filtering
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);

-- Index for type filtering (985, 211, etc.)
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_universities_category ON universities(category);

-- Index for scholarship availability
CREATE INDEX IF NOT EXISTS idx_universities_scholarship ON universities(scholarship_available);

-- Composite index for active universities by type
CREATE INDEX IF NOT EXISTS idx_universities_active_type ON universities(is_active, type);

-- Index for text search (GIN for trigram search)
CREATE INDEX IF NOT EXISTS idx_universities_name_search ON universities USING gin(name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_universities_name_cn_search ON universities USING gin(name_cn gin_trgm_ops);

-- ============================================
-- PROGRAMS TABLE
-- ============================================

-- Index for university relationship
CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id);

-- Index for degree level filtering
CREATE INDEX IF NOT EXISTS idx_programs_degree_level ON programs(degree_level);

-- Index for active status
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs(is_active);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);

-- Index for sub-category filtering
CREATE INDEX IF NOT EXISTS idx_programs_sub_category ON programs(sub_category);

-- Index for scholarship availability
CREATE INDEX IF NOT EXISTS idx_programs_scholarship ON programs(scholarship_available);

-- Composite index for active programs by university
CREATE INDEX IF NOT EXISTS idx_programs_university_active ON programs(university_id, is_active);

-- Composite index for filtering active programs
CREATE INDEX IF NOT EXISTS idx_programs_active_degree ON programs(is_active, degree_level);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_programs_name_search ON programs USING gin(name gin_trgm_ops);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================

-- Index for student relationship
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Index for university (through program)
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON applications(program_id);

-- Index for partner relationship
CREATE INDEX IF NOT EXISTS idx_applications_partner_id ON applications(partner_id);

-- Composite index for student's applications by status
CREATE INDEX IF NOT EXISTS idx_applications_student_status ON applications(student_id, status);

-- Composite index for status + created_at (common listing query)
CREATE INDEX IF NOT EXISTS idx_applications_status_created ON applications(status, created_at DESC);

-- Index for submitted_at
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at DESC);

-- ============================================
-- USERS TABLE
-- ============================================

-- Index for email lookup (unique)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for partner_role
CREATE INDEX IF NOT EXISTS idx_users_partner_role ON users(partner_role);

-- Index for created_at
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- STUDENTS TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Index for nationality
CREATE INDEX IF NOT EXISTS idx_students_nationality ON students(nationality);

-- ============================================
-- PARTNERS TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- ============================================
-- MEETINGS TABLE
-- ============================================

-- Index for application relationship
CREATE INDEX IF NOT EXISTS idx_meetings_application_id ON meetings(application_id);

-- Index for student relationship
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON meetings(student_id);

-- Index for meeting date
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Composite index for upcoming meetings
CREATE INDEX IF NOT EXISTS idx_meetings_status_date ON meetings(status, meeting_date);

-- ============================================
-- BLOG POSTS TABLE
-- ============================================

-- Index for status
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Index for category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);

-- Index for author
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Index for published_at
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Composite index for published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search ON blog_posts USING gin(title gin_trgm_ops);

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index for read status
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Index for created_at
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- APPLICATION DOCUMENTS TABLE
-- ============================================

-- Index for application relationship
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);

-- Index for document type
CREATE INDEX IF NOT EXISTS idx_application_documents_type ON application_documents(document_type);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_application_documents_status ON application_documents(status);

-- Composite index for application's documents by status
CREATE INDEX IF NOT EXISTS idx_application_documents_app_status ON application_documents(application_id, status);

-- ============================================
-- ANALYTICS MATERIALIZED VIEW (Optional)
-- ============================================

-- Materialized view for dashboard statistics
-- Refresh periodically with: REFRESH MATERIALIZED VIEW dashboard_stats;

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM applications) as total_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'submitted') as pending_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as accepted_applications,
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM partners WHERE status = 'approved') as active_partners,
  (SELECT COUNT(*) FROM universities WHERE is_active = true) as active_universities,
  (SELECT COUNT(*) FROM programs WHERE is_active = true) as active_programs;

-- Create index on materialized view for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats ON dashboard_stats (total_applications);
