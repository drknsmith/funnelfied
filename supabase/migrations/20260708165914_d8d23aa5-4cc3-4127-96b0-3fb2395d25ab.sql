ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS phase_program_creation_hours numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase_policy_creation_hours numeric NOT NULL DEFAULT 0;

ALTER TABLE public.quote_contractor_items
  ADD COLUMN IF NOT EXISTS design_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0;