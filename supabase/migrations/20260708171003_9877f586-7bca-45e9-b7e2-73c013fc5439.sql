ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS redloft_contact_name text,
  ADD COLUMN IF NOT EXISTS redloft_contact_title text,
  ADD COLUMN IF NOT EXISTS redloft_contact_email text,
  ADD COLUMN IF NOT EXISTS redloft_contact_phone text;