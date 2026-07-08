ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS sow_signature_provider_company text,
  ADD COLUMN IF NOT EXISTS sow_signature_provider_name text,
  ADD COLUMN IF NOT EXISTS sow_signature_provider_title text,
  ADD COLUMN IF NOT EXISTS sow_signature_client_company text,
  ADD COLUMN IF NOT EXISTS sow_signature_client_name text,
  ADD COLUMN IF NOT EXISTS sow_signature_client_title text;