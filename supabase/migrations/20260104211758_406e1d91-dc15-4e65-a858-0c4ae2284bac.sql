-- Backfill existing accounts with location data from matching leads
UPDATE public.accounts a
SET 
  location = l.location,
  lat = l.lat,
  lng = l.lng
FROM public.leads l
WHERE 
  LOWER(TRIM(a.name)) = LOWER(TRIM(l.company))
  AND l.location IS NOT NULL
  AND a.location IS NULL;