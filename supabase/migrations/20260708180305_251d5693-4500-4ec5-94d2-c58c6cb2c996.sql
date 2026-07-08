ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS sow_executive_summary text,
  ADD COLUMN IF NOT EXISTS sow_problem_statement text,
  ADD COLUMN IF NOT EXISTS sow_proposed_approach text,
  ADD COLUMN IF NOT EXISTS sow_approach_pillars text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sow_deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sow_milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sow_estimated_hours_min integer,
  ADD COLUMN IF NOT EXISTS sow_estimated_hours_max integer,
  ADD COLUMN IF NOT EXISTS sow_nte_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sow_nte_amount numeric,
  ADD COLUMN IF NOT EXISTS sow_invoicing_cadence text,
  ADD COLUMN IF NOT EXISTS sow_invoice_terms text,
  ADD COLUMN IF NOT EXISTS sow_expense_threshold numeric NOT NULL DEFAULT 250;