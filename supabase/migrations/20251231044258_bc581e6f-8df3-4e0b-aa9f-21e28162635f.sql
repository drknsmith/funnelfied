-- Add new columns to deals table for full spec
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS trigger_signal text,
ADD COLUMN IF NOT EXISTS buying_motive text,
ADD COLUMN IF NOT EXISTS primary_buyer_role text,
ADD COLUMN IF NOT EXISTS primary_objection text,
ADD COLUMN IF NOT EXISTS objection_notes text,
ADD COLUMN IF NOT EXISTS proposal_requested_date date,
ADD COLUMN IF NOT EXISTS proposal_submitted_date date,
ADD COLUMN IF NOT EXISTS site_notes text,
ADD COLUMN IF NOT EXISTS internal_notes text;

-- Create deal_files table for storing proposal docs and site photos
CREATE TABLE public.deal_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  file_type text NOT NULL CHECK (file_type IN ('proposal', 'site_photo')),
  file_ref text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by UUID
);

-- Enable RLS on deal_files
ALTER TABLE public.deal_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for deal_files
CREATE POLICY "Super admins can do everything on deal_files"
ON public.deal_files
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view deal_files in their workspace"
ON public.deal_files
FOR SELECT
USING (workspace_id = current_workspace());

CREATE POLICY "Users can insert deal_files in their workspace"
ON public.deal_files
FOR INSERT
WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can update deal_files in their workspace"
ON public.deal_files
FOR UPDATE
USING (workspace_id = current_workspace())
WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can delete deal_files in their workspace"
ON public.deal_files
FOR DELETE
USING (workspace_id = current_workspace());

-- Create storage bucket for deal files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deal-files', 'deal-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for deal-files bucket
CREATE POLICY "Users can view deal files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'deal-files');

CREATE POLICY "Authenticated users can upload deal files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'deal-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their deal files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'deal-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete deal files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'deal-files' AND auth.role() = 'authenticated');