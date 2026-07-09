
ALTER TABLE public.quotes ALTER COLUMN hourly_rate SET DEFAULT 200;
UPDATE public.quotes SET hourly_rate = 200 WHERE hourly_rate = 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sow_work_items jsonb NOT NULL DEFAULT '[]'::jsonb;
