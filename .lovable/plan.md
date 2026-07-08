
## 1. Labor Pricing — new phases
Add two phases to `PHASES` in `src/lib/quoteCalculations.ts` after Concept & Space Planning:
- `phase_program_creation_hours` — "Program Creation" (visible only when quote includes `programming`)
- `phase_policy_creation_hours` — "Policy Creation" (visible only when quote includes `policy`)

Migration: add both `numeric` columns to `quotes` (default 0). QuoteDetail Labor card filters PHASES by service_category gating for these two rows. Calculations already iterate PHASES, so totals update automatically.

## 2. Contractor pricing model
Migration: add `design_fee numeric default 0` and `shipping_fee numeric default 0` to `quote_contractor_items`. Keep `flat_fee` as the "Total" field.

Behavior in QuoteDetail contractor row:
- **Fitness Equipment**: 3 inputs — Design & Equipment, Shipping & Delivery, Total (auto = design + shipping, read-only). Markup % applied to Total.
- **Interior Design**: 3 inputs — Design & Products, Shipping & Delivery, Total (auto, read-only). Markup applied to Total.
- **Architecture / Graphic Design / Other**: 1 input — Total. Markup applied to Total.

`contractorClientPrice` stays as `flat_fee * (1 + markup/100)` since Total lives in `flat_fee`. When design/shipping change, the UI writes their sum into `flat_fee` on blur.

## 3. Policy details — Policy Type checkboxes
Add new field in `SERVICE_DETAIL_FIELDS.policy` (keeps existing fields):
- key `policy_types`, label "Policy Type", type `multiselect`
- options: Smoke Free, Fitness Center Usage, Fitwel Compliance

QuoteDetail renders a checkbox group for multiselect fields and stores `string[]` under `service_details.policy.policy_types`.

## 4. Red Loft logo on PDFs
Upload the provided logo via `lovable-assets` → `src/assets/red-loft-logo.png.asset.json`. Replace the text wordmark in `QuotePreview.tsx` header with `<img src={logo.url}>`. Include on both SOW and Invoice PDFs.

## 5. SOW / Invoice tabs on Quote tool page
Refactor `src/pages/QuoteDetail.tsx` to add a top tab header with two tabs:

**SOW tab** (default) — existing full editor: Client Info, Service Categories (Details cards), Timeline, Labor Pricing, Contractors, Discount, Totals. "Generate PDF" button here routes to `/quotes/:id/preview?doc=sow`.

**Invoice tab** — shows only Labor Pricing, Contractors, Discount, Totals. Own "Generate PDF" button at the top routes to `/quotes/:id/preview?doc=invoice`.

## 6. QuotePreview split by document type
`QuotePreview.tsx` reads `?doc=sow|invoice` (default sow):
- **SOW PDF**: logo header, Prepared For / Project block, Problem Statement, Proposed Approach, per-category Project Context sections, Timeline. No Investment table.
- **Invoice PDF**: logo header, Prepared For / Project block, Investment table (labor phases + contractor line items + discount + total). No narrative sections.

## Technical Details

**Migration SQL**
```sql
ALTER TABLE public.quotes
  ADD COLUMN phase_program_creation_hours numeric NOT NULL DEFAULT 0,
  ADD COLUMN phase_policy_creation_hours  numeric NOT NULL DEFAULT 0;

ALTER TABLE public.quote_contractor_items
  ADD COLUMN design_fee   numeric NOT NULL DEFAULT 0,
  ADD COLUMN shipping_fee numeric NOT NULL DEFAULT 0;
```

**Files changed**
- `src/lib/quoteCalculations.ts` — PHASES additions, multiselect field type, policy_types option
- `src/hooks/useQuotes.ts` — Quote / QuoteContractorItem interface fields
- `src/pages/QuoteDetail.tsx` — Tabs (shadcn `Tabs`), gated labor rows, contractor 3-input UI with auto-total, multiselect checkbox renderer, split Generate PDF buttons
- `src/pages/QuotePreview.tsx` — `?doc` param, logo asset, split render paths
- `src/assets/red-loft-logo.png.asset.json` — new asset pointer

No changes to `quoteCalculations` totals math beyond PHASES list.
