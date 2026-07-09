
-- Migrate existing deal stage values to new pipeline
UPDATE public.deals SET stage = 'discovery' WHERE stage IN ('discovery_scheduled','discovery_done','engaged','fit_confirmed');
UPDATE public.deals SET stage = 'sow' WHERE stage IN ('proposal_out');
UPDATE public.deals SET stage = 'under_contract' WHERE stage IN ('decision','activated');
UPDATE public.deals SET stage = 'closed' WHERE stage IN ('won','lost_archived','nurture','live','dormant','dormant_not_fit');
UPDATE public.deals SET stage = 'signal_target' WHERE stage IN ('target_identified');

-- Update workspace pipeline stages configuration to the new 6-stage pipeline
UPDATE public.workspace_pipeline_stages
SET stages = '[
  {"value":"signal_target","label":"Signal / Target"},
  {"value":"contacted","label":"Contacted"},
  {"value":"discovery","label":"Discovery"},
  {"value":"sow","label":"SOW"},
  {"value":"under_contract","label":"Under Contract"},
  {"value":"closed","label":"Closed"}
]'::jsonb;
