
-- Contractor proposal upload support on existing deal_files table
ALTER TABLE public.deal_files
  ADD COLUMN IF NOT EXISTS file_category text,
  ADD COLUMN IF NOT EXISTS contractor_type text;

-- Quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES auth.users(id),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  service_category text,
  engagement_type text,
  timeline_urgency text,
  decision_maker_count integer,
  service_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  hourly_rate numeric(12,2) NOT NULL DEFAULT 0,
  phase_consultation_hours numeric(10,2) NOT NULL DEFAULT 0,
  phase_concept_hours numeric(10,2) NOT NULL DEFAULT 0,
  phase_revisions_hours numeric(10,2) NOT NULL DEFAULT 0,
  phase_revisions_rounds integer NOT NULL DEFAULT 2,
  phase_sourcing_hours numeric(10,2) NOT NULL DEFAULT 0,
  phase_pm_hours numeric(10,2) NOT NULL DEFAULT 0,
  phase_handoff_hours numeric(10,2) NOT NULL DEFAULT 0,
  discount_type text,
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  discount_reason text,
  include_discount_reason_on_pdf boolean NOT NULL DEFAULT false,
  snapshot_contact_name text,
  snapshot_contact_email text,
  snapshot_contact_phone text,
  snapshot_referral_source text,
  snapshot_project_name text,
  snapshot_project_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, version_number)
);
CREATE INDEX idx_quotes_workspace ON public.quotes(workspace_id);
CREATE INDEX idx_quotes_deal ON public.quotes(deal_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or team quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (workspace_id = private.current_workspace() AND (private.is_admin_or_above() OR owner_user_id = auth.uid()));
CREATE POLICY "Users can create quotes in workspace" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = private.current_workspace());
CREATE POLICY "Users can update own or team quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (workspace_id = private.current_workspace() AND (private.is_admin_or_above() OR owner_user_id = auth.uid()));
CREATE POLICY "Users can delete own or team quotes" ON public.quotes
  FOR DELETE TO authenticated
  USING (workspace_id = private.current_workspace() AND (private.is_admin_or_above() OR owner_user_id = auth.uid()));
CREATE POLICY "Super admins manage quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (private.is_super_admin() AND workspace_id = private.current_workspace());

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quote contractor items
CREATE TABLE public.quote_contractor_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contractor_type text NOT NULL,
  vendor_name text,
  flat_fee numeric(12,2) NOT NULL DEFAULT 0,
  markup_percentage numeric(6,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qci_quote ON public.quote_contractor_items(quote_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_contractor_items TO authenticated;
GRANT ALL ON public.quote_contractor_items TO service_role;
ALTER TABLE public.quote_contractor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team quote items" ON public.quote_contractor_items
  FOR SELECT TO authenticated
  USING (workspace_id = private.current_workspace());
CREATE POLICY "Users can create quote items" ON public.quote_contractor_items
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = private.current_workspace());
CREATE POLICY "Users can update quote items" ON public.quote_contractor_items
  FOR UPDATE TO authenticated
  USING (workspace_id = private.current_workspace());
CREATE POLICY "Users can delete quote items" ON public.quote_contractor_items
  FOR DELETE TO authenticated
  USING (workspace_id = private.current_workspace());
CREATE POLICY "Super admins manage quote items" ON public.quote_contractor_items
  FOR ALL TO authenticated
  USING (private.is_super_admin() AND workspace_id = private.current_workspace());

CREATE TRIGGER update_quote_contractor_items_updated_at
  BEFORE UPDATE ON public.quote_contractor_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
