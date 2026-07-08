
ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'communication',
  ADD COLUMN IF NOT EXISTS opportunity_types text[],
  ADD COLUMN IF NOT EXISTS engagement_type text,
  ADD COLUMN IF NOT EXISTS design_type text,
  ADD COLUMN IF NOT EXISTS design_details text,
  ADD COLUMN IF NOT EXISTS programming_details text,
  ADD COLUMN IF NOT EXISTS policy_details text;

ALTER TABLE public.playbooks
  DROP CONSTRAINT IF EXISTS playbooks_kind_check;
ALTER TABLE public.playbooks
  ADD CONSTRAINT playbooks_kind_check CHECK (kind IN ('communication','service_knowledge'));
