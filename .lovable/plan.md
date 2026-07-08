## Expand the SOW tab into a full Statement of Work builder

Extends the existing SOW tab on the Quote detail page. Everything currently on the SOW tab stays (Red Loft Contact, Client & Project, Engagement, Service Details, Labor/Contractor/Discount/Totals) — the new SOW-authoring fields are added underneath, and a new print-ready preview replaces the current SOW PDF preview. Hourly Rate already exists on the quote and will be reused (not duplicated).

### 1. New inputs on the SOW tab (in `src/pages/QuoteDetail.tsx`)

New card "Statement of Work" with these fields, each freeform textarea getting a **"Polish with AI"** button underneath:

- Executive Summary (textarea)
- Problem Statement (textarea)
- Proposed Approach (textarea) + a helper row of 4 checkboxes for Red Loft's 4 P's — Policy / People / Process / Product — so the author can tag which pillars apply; tags are shown in the preview
- Deliverables — repeatable list of `{ name, description }` rows with Add/Remove
- Milestones — repeatable table of `{ name, description, target_date }` rows with Add/Remove

New card "Rate & Billing Terms":

- Hourly Rate — reuses the existing `hourly_rate` (moved into this card, removed from the Labor card header to avoid duplication; Labor card keeps hours only)
- Estimated Hours Range — optional min / max number inputs, with helper text "For planning only — not a cap"
- Not-to-Exceed Cap — toggle + currency input (shown only when toggle is on)
- Invoicing Cadence — Monthly / Biweekly
- Invoice Terms — Net 15 / Net 30 / Net 45
- Expense Pre-Approval Threshold — currency input, default `250`
- Reference Number — read-only, auto-generated as `SOW-{first 6 of quote id}-v{version_number}`

Validation: hourly rate > 0 before opening the preview; NTE cap > 0 if toggle is on. Errors surface via toast.

### 2. AI polish

New edge function `polish-sow-field` that takes `{ field, text, quoteId }`, loads the workspace's Service Knowledge Playbook singleton row, and calls Lovable AI Gateway (`google/gemini-2.5-flash`) with a system prompt instructing it to rewrite the text in the Red Loft voice, aligned with the playbook's Programming/Design/Policy/Engagement/Design-type/Details entries, and stay strictly within scope-and-rate language (no legal, IP, or liability). Returns polished text; the UI replaces the textarea contents (with an inline "Revert" affordance for one undo).

### 3. New SOW preview (`src/pages/QuotePreview.tsx` when `?doc=sow`)

Rebuilt print layout in this exact order:

1. Header block: Red Loft contact + Client & Project + Reference Number
2. Executive Summary
3. Problem Statement
4. Proposed Approach (with 4 P's pillar chips)
5. Deliverables (bulleted, name in bold + description)
6. Timeline & Milestones (table: Milestone / Description / Target Date)
7. Rate & Billing Terms — written as full sentences, e.g. "Services are billed at $X/hour. Planning estimate: 40–60 hours (non-binding, not a cap). Client-requested budget cap: $Y. Invoices are issued monthly on Net 30 terms. Expenses over $250 require prior written approval." Never renders hours × rate or any total.

Styling (scoped to the preview page via a `.sow-print` wrapper so app theme is unaffected):

- Roboto font (loaded via `<link>` in the preview page)
- Headers bold + UPPERCASE, black `#000`
- Body regular, black `#000`
- Secondary text + table borders neutral gray `#A6A6A6`
- Each section header has a thin `1px solid #FF3131` bottom border
- Red `#FF3131` used only for dividers and emphasis
- Print CSS: letter page size, sensible margins, page-break-avoid on tables

Two action buttons above the preview:

- **Copy as Markdown** — builds a markdown string of sections 1–6 (no dollar total), writes to clipboard, toast on success
- **Export as PDF** — uses the browser print dialog with print CSS (matches existing pattern); no auto-attach of Terms of Engagement

Explicitly **no** rendering of Labor phase totals, contractor totals, discount, or any grand total on this SOW preview — those remain on the Invoice preview only.

### 4. Database migration

Add to `public.quotes`:

- `sow_executive_summary text`
- `sow_problem_statement text`
- `sow_proposed_approach text`
- `sow_approach_pillars text[]` (subset of `policy|people|process|product`)
- `sow_deliverables jsonb default '[]'` (array of `{name, description}`)
- `sow_milestones jsonb default '[]'` (array of `{name, description, target_date}`)
- `sow_estimated_hours_min integer`
- `sow_estimated_hours_max integer`
- `sow_nte_enabled boolean default false`
- `sow_nte_amount numeric`
- `sow_invoicing_cadence text` (`monthly|biweekly`)
- `sow_invoice_terms text` (`net15|net30|net45`)
- `sow_expense_threshold numeric default 250`

Reference number is derived at render time (not stored). Existing RLS on `quotes` already covers these — no policy or grant changes needed.

### Technical notes

- New fields are optional; existing quotes render preview with sections omitted when their field is empty.
- The 4 P's pillar list lives in a small constant in `QuoteDetail.tsx` and is reused by the preview.
- The polish edge function returns 402/429 errors verbatim so the UI can show credit / rate-limit toasts.
- The SOW preview page is fully isolated from the app's dark theme — the `.sow-print` wrapper sets its own background/foreground so print output matches the palette.

### Files touched

- `supabase/migrations/<new>.sql` — add columns above
- `supabase/functions/polish-sow-field/index.ts` — new edge function
- `supabase/config.toml` — register the function (verify_jwt = true)
- `src/pages/QuoteDetail.tsx` — new SOW authoring cards + AI polish buttons; move hourly rate into billing card
- `src/pages/QuotePreview.tsx` — rebuilt SOW preview, Roboto, print styles, Copy as Markdown / Export as PDF
- `src/integrations/supabase/types.ts` — regenerated after migration

### Out of scope (per your instructions)

- No legal / IP / liability / Terms of Engagement content generated or attached
- No estimated total, no hours × rate math, anywhere in this section
- Invoice tab and Invoice preview are unchanged
