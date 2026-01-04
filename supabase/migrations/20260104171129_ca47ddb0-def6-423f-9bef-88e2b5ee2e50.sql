-- Table for super_admin workspace override
CREATE TABLE public.super_admin_workspace_overrides (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_workspace_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage their own overrides"
  ON public.super_admin_workspace_overrides FOR ALL
  USING (user_id = auth.uid() AND is_super_admin())
  WITH CHECK (user_id = auth.uid() AND is_super_admin());

-- Update current_workspace() to check for override first
CREATE OR REPLACE FUNCTION public.current_workspace()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT active_workspace_id 
     FROM super_admin_workspace_overrides 
     WHERE user_id = auth.uid()),
    (SELECT workspace_id FROM profiles WHERE user_id = auth.uid())
  )
$$;

-- Table for workspace-specific pull lead configurations
CREATE TABLE public.workspace_pull_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  verticals jsonb NOT NULL DEFAULT '[]',
  signal_types jsonb NOT NULL DEFAULT '[]',
  search_context text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.workspace_pull_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all configs"
  ON public.workspace_pull_configs FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view configs in their workspace"
  ON public.workspace_pull_configs FOR SELECT
  USING (workspace_id = current_workspace());

-- Seed data for Superior Sales Pipeline
INSERT INTO workspace_pull_configs (workspace_id, name, verticals, signal_types, search_context)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Fitness Equipment',
  '["Multifamily", "Boutique Studio", "Gym", "Country Club"]'::jsonb,
  '["New Build", "Renovation", "RFP", "Expansion"]'::jsonb,
  'Premium fitness equipment company targeting B2B sales for commercial fitness installations'
);

-- Seed data for Red Loft Consulting
INSERT INTO workspace_pull_configs (workspace_id, name, verticals, signal_types, search_context)
VALUES (
  '54d6d4a3-75f1-4e5c-9d36-945c1643ac1f',
  'Consulting',
  '["Wellness", "Fitness", "Experiential Programming", "Multifamily Amenities"]'::jsonb,
  '["RFP", "Activation", "Amenity Refresh", "Pilot", "Strategic Planning", "Program Launch"]'::jsonb,
  'Wellness and fitness consulting company helping clients with programming strategy, activations, and amenity strategy for residential and commercial properties'
);