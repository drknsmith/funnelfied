## Quote tool fixes

### 1. Invoice tab — Expenses section
- New DB column on `quotes`: `invoice_expenses jsonb default '[]'` (shape: `[{ name: string, amount: number }]`).
- In `src/pages/QuoteDetail.tsx` Invoice tab, add an "Expenses" card **above** the Contractors card:
  - Header row: `Expenses` title + `+ Expense` button.
  - Each row: `Name` input, `Amount` number input, trash button. Empty-state text when none.
- Include expenses in the Invoice totals in `QuoteDetail` and in `QuotePreview` (invoice view) — added as line items in the Investment table and summed into the Total.

### 2. Invoice date at top of Invoice page
- New DB column: `invoice_date date` (defaults to `current_date`).
- In `QuoteDetail` Invoice tab, add an editable date input at the top.
- In `QuotePreview` (invoice mode), render the date in the header block so it prints.

### 3. SOW NTE cap → total hours cap
- In `QuoteDetail` SOW form, relabel "Not-to-Exceed Cap" → "Total Hours Cap"; placeholder → "Cap hours"; keep field storage as `sow_nte_amount` (interpreted as hours now — no schema change).
- In `QuotePreview` `billingSentence`, change:
  - old: `Client-requested budget cap: $200.00.`
  - new: `Client-requested total hours cap: 200 hours.`

### 4. Terms & Conditions merge fields
The playbook terms template contains `[HOURLY RATE NOT SET]`, `[INVOICING CADENCE NOT SET]`, `[INVOICE TERMS NOT SET]`, `[EXPENSE THRESHOLD NOT SET]` placeholders. Add a token-replacement pass in `QuotePreview.tsx` when rendering `termsBeforeSignatures` / `termsAfterSignatures` that substitutes these using the quote's values:
- `[HOURLY RATE NOT SET]` → `$200.00`
- `[INVOICING CADENCE NOT SET]` → "monthly" / label from existing map
- `[INVOICE TERMS NOT SET]` → label from `TERMS_LABEL` map
- `[EXPENSE THRESHOLD NOT SET]` → `$${sow_expense_threshold}`
- Also `[TOTAL HOURS CAP NOT SET]` etc. if present.
Only replace when the quote has a value; otherwise leave the "NOT SET" placeholder visible.

### Files touched
- New migration: add `invoice_expenses jsonb` and `invoice_date date` to `quotes`.
- `src/hooks/useQuotes.ts` — Quote type additions.
- `src/pages/QuoteDetail.tsx` — Expenses UI, invoice date input, cap relabel.
- `src/pages/QuotePreview.tsx` — invoice date header, expenses line items, billing sentence text, terms token replacement.

Confirm and I'll build it.