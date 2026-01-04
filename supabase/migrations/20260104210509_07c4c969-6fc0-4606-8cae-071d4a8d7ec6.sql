-- Add location column to accounts table for trainer search
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS location TEXT;