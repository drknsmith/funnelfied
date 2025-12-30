-- Add missing columns to playbooks table for full functionality
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS associated_deal_type text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS objective text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS proof_asset_type text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS proof_asset_file_ref text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS proof_asset_label text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS default_nurture_tag text;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS expedited boolean DEFAULT false;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Add playbook assignment audit columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS playbook_assigned_at timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS playbook_assigned_by uuid;

-- Create index for faster playbook lookups
CREATE INDEX IF NOT EXISTS idx_playbooks_status ON public.playbooks(status);
CREATE INDEX IF NOT EXISTS idx_playbooks_deal_type ON public.playbooks(associated_deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_playbook_id ON public.deals(playbook_id);