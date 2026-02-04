-- Create proposal_reports table for Superior workspace
CREATE TABLE public.proposal_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  community_name TEXT,
  community_address TEXT,
  units INTEGER,
  sf_override INTEGER,
  property_class TEXT DEFAULT 'B',
  demographics JSONB DEFAULT '{}',
  comps_radius INTEGER DEFAULT 5,
  advanced_overrides JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  multifamily_comps JSONB DEFAULT '[]',
  fitness_comps JSONB DEFAULT '[]',
  map_center JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on token for fast public lookups
CREATE INDEX idx_proposal_reports_token ON public.proposal_reports(token);

-- Create index on workspace_id for workspace queries
CREATE INDEX idx_proposal_reports_workspace ON public.proposal_reports(workspace_id);

-- Enable Row Level Security
ALTER TABLE public.proposal_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Owners and super admins can select their reports
CREATE POLICY "Users can view their own reports"
ON public.proposal_reports
FOR SELECT
USING (
  owner_user_id = auth.uid() 
  OR public.is_super_admin()
);

-- Policy: Public access via token (for shareable links)
CREATE POLICY "Public can view reports via token"
ON public.proposal_reports
FOR SELECT
USING (
  token IS NOT NULL 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Policy: Authenticated users in workspace can insert
CREATE POLICY "Authenticated users can create reports"
ON public.proposal_reports
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND workspace_id = public.current_workspace()
);

-- Policy: Owners can update their own reports
CREATE POLICY "Owners can update their reports"
ON public.proposal_reports
FOR UPDATE
USING (owner_user_id = auth.uid());

-- Policy: Owners can delete their own reports
CREATE POLICY "Owners can delete their reports"
ON public.proposal_reports
FOR DELETE
USING (owner_user_id = auth.uid());