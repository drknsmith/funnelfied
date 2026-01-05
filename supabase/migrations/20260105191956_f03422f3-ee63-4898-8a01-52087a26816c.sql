INSERT INTO workspace_pipeline_stages (workspace_id, stages)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '[
    {"value": "target_identified", "label": "Target Identified"},
    {"value": "contacted", "label": "Contacted"},
    {"value": "engaged", "label": "Engaged"},
    {"value": "fit_confirmed", "label": "Fit Confirmed"},
    {"value": "discovery_done", "label": "Discovery Done"},
    {"value": "proposal_out", "label": "Proposal Out"},
    {"value": "activated", "label": "Activated"},
    {"value": "live", "label": "Live"},
    {"value": "dormant", "label": "Dormant / Not a Fit"}
  ]'::jsonb
);