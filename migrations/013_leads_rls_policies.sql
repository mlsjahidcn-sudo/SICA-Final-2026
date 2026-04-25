-- Fix RLS policies for leads and lead_activities tables
-- Migration: 013

-- ============================================================================
-- 1. Ensure leads table exists (idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    source TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    nationality TEXT,
    desired_program TEXT,
    desired_intake TEXT,
    organization_name TEXT,
    contact_person TEXT,
    organization_email TEXT,
    organization_phone TEXT,
    website TEXT,
    country TEXT,
    organization_type TEXT,
    assignee_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Ensure lead_activities table exists (idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    activity_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Enable RLS
-- ============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Drop existing policies if any (idempotent)
-- ============================================================================

DROP POLICY IF EXISTS leads_admin_all ON leads;
DROP POLICY IF EXISTS leads_authenticated_read ON leads;
DROP POLICY IF EXISTS leads_admin_insert ON leads;
DROP POLICY IF EXISTS leads_admin_update ON leads;
DROP POLICY IF EXISTS leads_admin_delete ON leads;
DROP POLICY IF EXISTS lead_activities_admin_all ON lead_activities;
DROP POLICY IF EXISTS lead_activities_authenticated_read ON lead_activities;
DROP POLICY IF EXISTS leads_service_role_all ON leads;
DROP POLICY IF EXISTS lead_activities_service_role_all ON lead_activities;

-- ============================================================================
-- 5. Create RLS policies for leads
-- ============================================================================

-- Admins can do everything
CREATE POLICY leads_admin_all ON leads
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Note: Service role key bypasses RLS automatically, so no separate policy is needed.
-- The admin-only policy above is sufficient for authenticated user access.

-- ============================================================================
-- 6. Create RLS policies for lead_activities
-- ============================================================================

-- Admins can do everything
CREATE POLICY lead_activities_admin_all ON lead_activities
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Note: Service role key bypasses RLS automatically, so no separate policy is needed.
-- The admin-only policy above is sufficient for authenticated user access.

-- ============================================================================
-- 7. Create indexes (idempotent)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assignee ON leads(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user ON lead_activities(user_id);

-- ============================================================================
-- 8. Add updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
