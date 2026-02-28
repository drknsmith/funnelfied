

# Add More Contact Fields to Trainer Cards

## What Changes
Each trainer card in the "Nearby Trainers" section will show additional contact details (when available): Instagram page, website, email, phone number, and address. The AI that discovers trainers will also be updated to extract these new fields.

## Plan

### 1. Add new columns to the trainers database table
Add three new nullable text columns:
- `instagram_url` -- Instagram profile link
- `website_url` -- Personal/business website link
- `address` -- Physical address or location

### 2. Update the trainer discovery logic (edge function)
Modify the `trainer-miner` backend function to instruct the AI to also extract:
- `instagram_url`
- `website_url`
- `address`

These will be added to both the AI prompt instructions and the structured extraction schema, and persisted when inserting new trainers.

### 3. Update the trainer card UI
On the Account Detail page, add display rows for the new fields:
- Instagram: linked icon + "Instagram" text, opens in new tab
- Website: linked icon + domain text, opens in new tab
- Address: displayed as plain text with a map pin icon

The existing email, phone, and LinkedIn links are already displayed -- they will remain as-is.

### 4. Update the TypeScript hook interface
Add `instagram_url`, `website_url`, and `address` to the `Trainer` interface in `useTrainers.ts`.

## Technical Details

**Database migration:**
```sql
ALTER TABLE public.trainers
  ADD COLUMN instagram_url text,
  ADD COLUMN website_url text,
  ADD COLUMN address text;
```

**Files to modify:**
| File | Change |
|------|--------|
| Database migration | Add 3 new columns to `trainers` table |
| `supabase/functions/trainer-miner/index.ts` | Add new fields to AI prompt, schema, and DB insert |
| `src/hooks/useTrainers.ts` | Add new fields to `Trainer` interface |
| `src/pages/AccountDetail.tsx` | Display Instagram, website, and address on trainer cards |
