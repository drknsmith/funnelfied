-- Backfill coordinates from leads to accounts where accounts have location but missing lat/lng
UPDATE public.accounts a
SET 
  lat = l.lat,
  lng = l.lng
FROM public.leads l
WHERE 
  LOWER(TRIM(a.name)) = LOWER(TRIM(l.company))
  AND l.lat IS NOT NULL
  AND l.lng IS NOT NULL
  AND a.lat IS NULL;