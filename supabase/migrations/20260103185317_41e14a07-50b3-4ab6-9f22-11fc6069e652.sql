-- =============================================
-- CRM Bridge API - Database Schema Changes
-- =============================================

-- 1. CREATE LEADS TABLE
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_user_id uuid,
  company text NOT NULL,
  facility_type text,
  project_name text NOT NULL,
  location text NOT NULL,
  signal_reason text,
  estimated_timeline text,
  recommended_playbook text,
  stakeholders_json jsonb,
  contact_notes text,
  first_touch_email text,
  linkedin_dm text,
  source_links jsonb,
  status text NOT NULL DEFAULT 'new',
  external_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for idempotent upserts (when no external_id)
CREATE UNIQUE INDEX leads_company_project_location_idx 
  ON public.leads (workspace_id, lower(company), lower(project_name), lower(location))
  WHERE external_id IS NULL;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads (matching existing CRM pattern)
CREATE POLICY "Super admins can do everything on leads"
  ON public.leads FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view leads in their workspace"
  ON public.leads FOR SELECT
  USING (workspace_id = current_workspace());

CREATE POLICY "Users can insert leads in their workspace"
  ON public.leads FOR INSERT
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can update leads in their workspace"
  ON public.leads FOR UPDATE
  USING (workspace_id = current_workspace())
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can delete leads in their workspace"
  ON public.leads FOR DELETE
  USING (workspace_id = current_workspace());

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ADD external_id TO DEALS TABLE
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS external_id text UNIQUE;

-- Unique constraint for idempotent upserts by account_id + deal_name
CREATE UNIQUE INDEX IF NOT EXISTS deals_account_name_idx 
  ON public.deals (account_id, lower(deal_name))
  WHERE external_id IS NULL AND deal_name IS NOT NULL;

-- 3. ADD MISSING COLUMNS TO INTERACTIONS TABLE
ALTER TABLE public.interactions 
  ADD COLUMN IF NOT EXISTS participants jsonb,
  ADD COLUMN IF NOT EXISTS key_points jsonb,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_date date,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;