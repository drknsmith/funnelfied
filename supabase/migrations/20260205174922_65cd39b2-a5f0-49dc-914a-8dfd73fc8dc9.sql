-- Social Media Content Manager Tables for Treneur Workspace

-- 1. sm_campaigns - Social media campaigns with recurrence rules
CREATE TABLE public.sm_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  description_brief TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  recurrence_rule JSONB NOT NULL DEFAULT '{"frequency": "weekly", "day_of_week": 1}',
  do_dont_guidance TEXT,
  default_cta_style TEXT,
  keyword_tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. sm_schedule_slots - Recurring schedule occurrences
CREATE TABLE public.sm_schedule_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.sm_campaigns(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ready', 'published', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. sm_content_items - Individual content pieces
CREATE TABLE public.sm_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  schedule_slot_id UUID REFERENCES public.sm_schedule_slots(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.sm_campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  hashtags_suggested TEXT[] DEFAULT '{}',
  hashtags_saved TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'ready', 'published', 'skipped')),
  override_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. sm_assets - Media assets for social content
CREATE TABLE public.sm_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'carousel', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. sm_content_assets - Junction: content items to assets
CREATE TABLE public.sm_content_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES public.sm_content_items(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.sm_assets(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE(content_item_id, asset_id)
);

-- Indexes for performance
CREATE INDEX idx_sm_campaigns_workspace ON public.sm_campaigns(workspace_id);
CREATE INDEX idx_sm_schedule_slots_workspace ON public.sm_schedule_slots(workspace_id);
CREATE INDEX idx_sm_schedule_slots_date ON public.sm_schedule_slots(scheduled_date);
CREATE INDEX idx_sm_schedule_slots_campaign ON public.sm_schedule_slots(campaign_id);
CREATE INDEX idx_sm_content_items_workspace ON public.sm_content_items(workspace_id);
CREATE INDEX idx_sm_content_items_slot ON public.sm_content_items(schedule_slot_id);
CREATE INDEX idx_sm_content_items_campaign ON public.sm_content_items(campaign_id);
CREATE INDEX idx_sm_assets_workspace ON public.sm_assets(workspace_id);

-- Triggers for updated_at
CREATE TRIGGER update_sm_campaigns_updated_at
  BEFORE UPDATE ON public.sm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sm_schedule_slots_updated_at
  BEFORE UPDATE ON public.sm_schedule_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sm_content_items_updated_at
  BEFORE UPDATE ON public.sm_content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.sm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_content_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sm_campaigns
CREATE POLICY "Users can view campaigns in their workspace"
  ON public.sm_campaigns FOR SELECT
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can create campaigns in their workspace"
  ON public.sm_campaigns FOR INSERT
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update campaigns in their workspace"
  ON public.sm_campaigns FOR UPDATE
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete campaigns in their workspace"
  ON public.sm_campaigns FOR DELETE
  USING (workspace_id = public.current_workspace());

-- RLS Policies for sm_schedule_slots
CREATE POLICY "Users can view schedule slots in their workspace"
  ON public.sm_schedule_slots FOR SELECT
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can create schedule slots in their workspace"
  ON public.sm_schedule_slots FOR INSERT
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update schedule slots in their workspace"
  ON public.sm_schedule_slots FOR UPDATE
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete schedule slots in their workspace"
  ON public.sm_schedule_slots FOR DELETE
  USING (workspace_id = public.current_workspace());

-- RLS Policies for sm_content_items
CREATE POLICY "Users can view content items in their workspace"
  ON public.sm_content_items FOR SELECT
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can create content items in their workspace"
  ON public.sm_content_items FOR INSERT
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update content items in their workspace"
  ON public.sm_content_items FOR UPDATE
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete content items in their workspace"
  ON public.sm_content_items FOR DELETE
  USING (workspace_id = public.current_workspace());

-- RLS Policies for sm_assets
CREATE POLICY "Users can view assets in their workspace"
  ON public.sm_assets FOR SELECT
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can create assets in their workspace"
  ON public.sm_assets FOR INSERT
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update assets in their workspace"
  ON public.sm_assets FOR UPDATE
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete assets in their workspace"
  ON public.sm_assets FOR DELETE
  USING (workspace_id = public.current_workspace());

-- RLS Policies for sm_content_assets (junction table)
CREATE POLICY "Users can view content assets via content item workspace"
  ON public.sm_content_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sm_content_items ci 
    WHERE ci.id = content_item_id AND ci.workspace_id = public.current_workspace()
  ));

CREATE POLICY "Users can create content assets via content item workspace"
  ON public.sm_content_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sm_content_items ci 
    WHERE ci.id = content_item_id AND ci.workspace_id = public.current_workspace()
  ));

CREATE POLICY "Users can delete content assets via content item workspace"
  ON public.sm_content_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.sm_content_items ci 
    WHERE ci.id = content_item_id AND ci.workspace_id = public.current_workspace()
  ));

-- Create storage bucket for SM assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sm-assets', 'sm-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sm-assets bucket
CREATE POLICY "SM assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sm-assets');

CREATE POLICY "Authenticated users can upload SM assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sm-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their SM assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'sm-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their SM assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sm-assets' AND auth.role() = 'authenticated');