ALTER TABLE public.deals
  ALTER COLUMN deal_type DROP DEFAULT,
  ALTER COLUMN deal_type TYPE text[] USING (
    CASE WHEN deal_type IS NULL OR deal_type = '' THEN '{}'::text[] ELSE ARRAY[deal_type] END
  ),
  ALTER COLUMN deal_type SET DEFAULT '{}'::text[];

ALTER TABLE public.quotes
  ALTER COLUMN service_category DROP DEFAULT,
  ALTER COLUMN service_category TYPE text[] USING (
    CASE WHEN service_category IS NULL OR service_category = '' THEN '{}'::text[] ELSE ARRAY[service_category] END
  ),
  ALTER COLUMN service_category SET DEFAULT '{}'::text[];