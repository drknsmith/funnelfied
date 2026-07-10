ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS invoice_expenses jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_date date;