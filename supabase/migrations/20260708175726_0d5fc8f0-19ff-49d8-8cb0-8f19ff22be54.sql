
ALTER TABLE public.playbooks
  DROP COLUMN IF EXISTS opportunity_types,
  DROP COLUMN IF EXISTS engagement_type,
  DROP COLUMN IF EXISTS design_type;

ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS opp_programming text,
  ADD COLUMN IF NOT EXISTS opp_design text,
  ADD COLUMN IF NOT EXISTS opp_policy text,
  ADD COLUMN IF NOT EXISTS eng_one_time text,
  ADD COLUMN IF NOT EXISTS eng_retainer text,
  ADD COLUMN IF NOT EXISTS eng_phased text,
  ADD COLUMN IF NOT EXISTS dtype_new_construction text,
  ADD COLUMN IF NOT EXISTS dtype_retrofit text;

CREATE UNIQUE INDEX IF NOT EXISTS playbooks_one_service_knowledge_per_workspace
  ON public.playbooks(workspace_id)
  WHERE kind = 'service_knowledge';
