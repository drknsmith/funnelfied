ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS project_street text,
  ADD COLUMN IF NOT EXISTS project_city text,
  ADD COLUMN IF NOT EXISTS project_state text,
  ADD COLUMN IF NOT EXISTS project_zip text;