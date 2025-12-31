-- Create assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  storage_method TEXT NOT NULL DEFAULT 'url' CHECK (storage_method IN ('url', 'file')),
  asset_url TEXT,
  asset_file_ref TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_user_id UUID REFERENCES auth.users(id),
  updated_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create join table for assets <-> playbooks (many-to-many)
CREATE TABLE public.asset_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(asset_id, playbook_id)
);

-- Enable RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_playbooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for assets
CREATE POLICY "Super admins can do everything on assets"
ON public.assets FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view assets in their workspace"
ON public.assets FOR SELECT
USING (workspace_id = current_workspace());

CREATE POLICY "Users can insert assets in their workspace"
ON public.assets FOR INSERT
WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can update assets in their workspace"
ON public.assets FOR UPDATE
USING (workspace_id = current_workspace())
WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can delete assets in their workspace"
ON public.assets FOR DELETE
USING (workspace_id = current_workspace());

-- RLS policies for asset_playbooks
CREATE POLICY "Super admins can do everything on asset_playbooks"
ON public.asset_playbooks FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view asset_playbooks in their workspace"
ON public.asset_playbooks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.assets a WHERE a.id = asset_id AND a.workspace_id = current_workspace()
));

CREATE POLICY "Users can manage asset_playbooks in their workspace"
ON public.asset_playbooks FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.assets a WHERE a.id = asset_id AND a.workspace_id = current_workspace()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.assets a WHERE a.id = asset_id AND a.workspace_id = current_workspace()
));

-- Updated_at trigger for assets
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add owner_user_id to accounts, deals, contacts
ALTER TABLE public.accounts ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.deals ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);

-- Add proof_asset_id references to playbooks (upgrade from URL-based)
ALTER TABLE public.playbooks ADD COLUMN proof_asset_id UUID REFERENCES public.assets(id);
ALTER TABLE public.playbooks ADD COLUMN secondary_proof_asset_id UUID REFERENCES public.assets(id);

-- Create storage bucket for asset files
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Storage policies for assets bucket
CREATE POLICY "Users can view asset files in their workspace"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Users can upload asset files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their asset files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete asset files"
ON storage.objects FOR DELETE
USING (bucket_id = 'assets' AND auth.uid() IS NOT NULL);