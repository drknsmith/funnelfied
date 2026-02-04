-- Add deal_id to proposal_reports to link research to deals
ALTER TABLE public.proposal_reports 
ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

-- Create index for faster lookups by deal
CREATE INDEX idx_proposal_reports_deal_id 
ON public.proposal_reports(deal_id);

-- Drop existing SELECT policies to replace with deal-aware version
DROP POLICY IF EXISTS "Users can view their own reports" ON public.proposal_reports;
DROP POLICY IF EXISTS "Public can view reports via token" ON public.proposal_reports;

-- Create unified SELECT policy that includes deal ownership
CREATE POLICY "Users can view research reports"
ON public.proposal_reports FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR is_super_admin()
  OR (deal_id IN (SELECT id FROM deals WHERE workspace_id = current_workspace()))
  OR ((token IS NOT NULL) AND ((expires_at IS NULL) OR (expires_at > now())))
);