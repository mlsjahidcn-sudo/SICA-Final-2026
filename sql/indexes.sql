-- ============================================
-- Performance Optimization: Database Indexes
-- Run this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- UNIVERSITIES TABLE
-- ============================================

-- Index for status filtering (active/inactive)
CREATE INDEX IF NOT EXISTS idx_universities_status ON universities(status);

-- Index for province filtering
CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);

-- Index for type filtering (985, 211, etc.)
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_universities_category ON universities(category);

-- Index for scholarship availability
CREATE INDEX IF NOT EXISTS idx_universities_scholarship ON universities(scholarship_available);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_universities_status_type ON universities(status, type);

-- Index for text search (GIN for trigram search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
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

-- Index for language of instruction
CREATE INDEX IF NOT EXISTS idx_programs_language ON programs(language);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);

-- Index for sub-category filtering
CREATE INDEX IF NOT EXISTS idx_programs_sub_category ON programs(sub_category);

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

-- Index for email lookup
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

-- Index for organization
CREATE INDEX IF NOT EXISTS idx_partners_organization_id ON partners(organization_id);

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
-- NOTIFICATIONS TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index for is_read
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Index for created_at
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON application_documents(user_id);

-- Index for application relationship
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON application_documents(application_id);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_documents_status ON application_documents(status);

-- Index for document type
CREATE INDEX IF NOT EXISTS idx_documents_type ON application_documents(document_type);

-- ============================================
-- BLOG POSTS TABLE
-- ============================================

-- Index for status
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Index for slug
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Index for published_at
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Index for author
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Index for category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search ON blog_posts USING gin(title gin_trgm_ops);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================

-- Index for status
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);

-- Index for featured
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);

-- Index for display order
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);

-- ============================================
-- PARTNER SHOWCASES TABLE
-- ============================================

-- Index for status
CREATE INDEX IF NOT EXISTS idx_partner_showcases_status ON partner_showcases(status);

-- Index for type
CREATE INDEX IF NOT EXISTS idx_partner_showcases_type ON partner_showcases(partner_type);

-- Index for featured
CREATE INDEX IF NOT EXISTS idx_partner_showcases_featured ON partner_showcases(is_featured);

-- Index for display order
CREATE INDEX IF NOT EXISTS idx_partner_showcases_display_order ON partner_showcases(display_order);

-- ============================================
-- FAVORITES TABLE
-- ============================================

-- Index for user relationship
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Index for program relationship
CREATE INDEX IF NOT EXISTS idx_favorites_program_id ON favorites(program_id);

-- Index for university relationship
CREATE INDEX IF NOT EXISTS idx_favorites_university_id ON favorites(university_id);

-- Composite unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_program ON favorites(user_id, program_id) WHERE program_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_university ON favorites(user_id, university_id) WHERE university_id IS NOT NULL;

-- ============================================
-- CHAT TABLES
-- ============================================

-- Index for chat sessions by user
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Index for chat messages by session
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- Index for chat messages created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- ANALYZE TABLES (update statistics)
-- ============================================
ANALYZE universities;
ANALYZE programs;
ANALYZE applications;
ANALYZE users;
ANALYZE students;
ANALYZE partners;
ANALYZE meetings;
ANALYZE notifications;
ANALYZE application_documents;
ANALYZE blog_posts;
ANALYZE testimonials;
ANALYZE partner_showcases;
ANALYZE favorites;
ANALYZE chat_sessions;
ANALYZE chat_messages;

-- ============================================
-- MATERIALIZED VIEWS FOR DASHBOARD STATS
-- ============================================

-- Dashboard statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_statistics AS
SELECT 
  (SELECT COUNT(*) FROM applications) as total_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'under_review') as under_review_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'approved') as approved_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'rejected') as rejected_applications,
  (SELECT COUNT(DISTINCT student_id) FROM applications) as total_students,
  (SELECT COUNT(*) FROM universities WHERE status = 'active') as total_universities,
  (SELECT COUNT(*) FROM programs WHERE is_active = true) as total_programs,
  (SELECT COUNT(*) FROM users WHERE role = 'student') as total_users_students,
  (SELECT COUNT(*) FROM users WHERE role = 'partner') as total_users_partners;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_statistics ON dashboard_statistics (total_applications);

-- ============================================
-- REFRESH MATERIALIZED VIEW (run via cron job)
-- ============================================
-- To refresh: REFRESH MATERIALIZED VIEW dashboard_statistics;
-- Recommended: Create a pg_cron job to refresh every 5-15 minutes

-- ============================================
-- QUERY OPTIMIZATION HINTS
-- ============================================
-- Add these comments to remind developers of best practices:

COMMENT ON TABLE applications IS 'Use idx_applications_status_created for status-filtered listings';
COMMENT ON TABLE programs IS 'Use idx_programs_university_active for fetching programs by university';
COMMENT ON TABLE universities IS 'Use gin indexes for text search on name_en/name_cn';
