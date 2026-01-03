-- Add deal_id column to leads table for post-conversion reference
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);