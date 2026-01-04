-- Phase 1: Database Schema Updates for Treneur Workspace Features

-- Add health score and geocoding columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS health_score integer,
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision,
ADD COLUMN IF NOT EXISTS signal_details jsonb;

-- Add constraint for health_score range (1-10)
ALTER TABLE public.leads 
ADD CONSTRAINT leads_health_score_range CHECK (health_score IS NULL OR (health_score >= 1 AND health_score <= 10));

-- Add health score and geocoding columns to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS health_score integer,
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;

-- Add constraint for accounts health_score range (1-10)
ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_health_score_range CHECK (health_score IS NULL OR (health_score >= 1 AND health_score <= 10));

-- Create trainers table for the "Pull Trainers" feature
CREATE TABLE public.trainers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  linkedin_url text,
  lat double precision,
  lng double precision,
  career_health_score integer,
  career_mentions text,
  source_links jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trainers_career_health_score_range CHECK (career_health_score IS NULL OR (career_health_score >= 1 AND career_health_score <= 10))
);

-- Enable RLS on trainers table
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trainers table
CREATE POLICY "Users can view trainers in their workspace"
ON public.trainers
FOR SELECT
TO authenticated
USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can create trainers in their workspace"
ON public.trainers
FOR INSERT
TO authenticated
WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update trainers in their workspace"
ON public.trainers
FOR UPDATE
TO authenticated
USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete trainers in their workspace"
ON public.trainers
FOR DELETE
TO authenticated
USING (workspace_id = public.current_workspace());

-- Create trigger for updated_at on trainers
CREATE TRIGGER update_trainers_updated_at
BEFORE UPDATE ON public.trainers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create workspace_pipeline_stages table for custom pipeline stages per workspace
CREATE TABLE public.workspace_pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stages jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on workspace_pipeline_stages table
ALTER TABLE public.workspace_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace_pipeline_stages table
CREATE POLICY "Users can view pipeline stages in their workspace"
ON public.workspace_pipeline_stages
FOR SELECT
TO authenticated
USING (workspace_id = public.current_workspace());

CREATE POLICY "Admins can manage pipeline stages in their workspace"
ON public.workspace_pipeline_stages
FOR ALL
TO authenticated
USING (
  workspace_id = public.current_workspace() 
  AND (public.is_super_admin() OR public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  workspace_id = public.current_workspace() 
  AND (public.is_super_admin() OR public.has_role(auth.uid(), 'admin'))
);

-- Create trigger for updated_at on workspace_pipeline_stages
CREATE TRIGGER update_workspace_pipeline_stages_updated_at
BEFORE UPDATE ON public.workspace_pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();