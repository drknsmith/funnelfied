## Changes to `src/pages/QuoteDetail.tsx` and `src/lib/quoteCalculations.ts`

### 1. Bottom action bar
- Remove the "Delete Quote" destructive button.
- Replace with a "Save" button that triggers `updateQuote({ id, patch: local })` and shows a toast confirming save. (Note: fields already autosave on change; this button provides an explicit confirmation.)

### 2. Client & Project card
- Remove the "Referral Source" `<Field>` from the Client & Project section. Data field on the quote is left untouched (no DB migration).

### 3. Design service details (`SERVICE_DETAIL_FIELDS.design` in `quoteCalculations.ts`)
- Change `construction_type` field:
  - Label: "Design Type"
  - Type: `select` (new type) with options: "New Construction", "Retrofit"
- Split `square_footage` into two separate fields:
  - `square_footage` — label "Square Footage", type `number`
  - `unit_count` — label "Unit Count", type `number`
- Extend the field renderer in `QuoteDetail.tsx` to support the new `select` field type (renders a shadcn `Select`).

### Notes
- All values continue to persist inside the existing `service_details` JSONB column — no schema migration needed.
- Existing quotes with a free-text `construction_type` value will show empty in the new dropdown until re-selected; that's acceptable since Design quotes are new.
