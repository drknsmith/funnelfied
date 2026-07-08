## Fix: Quote Tool shows no inputs

**Problem:** Clicking **New Quote** lands on `/quotes/new`, which only has an Opportunity selector and a "Create Quote" button. All the actual inputs (hourly rate, phase hours, contractors, discount, service-specific fields, totals) live on the *next* page (`/quotes/:id`), so it looks like the tool is empty.

**Fix:** Collapse the two-step flow so you always land directly on the full editable quote.

### Changes

1. **From an Opportunity** (`New Quote` button on a deal): auto-create a draft quote immediately and navigate straight to `/quotes/:id` — no picker screen.
   - Update `QuoteVersionsPanel` so the button calls `createQuote(...)` with the deal's snapshot data (contact, project name, address, referral source) and then navigates to the new quote's detail page.

2. **From the Quote Tool list** (`/quotes` → New Quote):
   - Rework `/quotes/new` so the Opportunity selector auto-creates the draft the moment an Opportunity is chosen (no separate "Create" click), then redirects to `/quotes/:id`.
   - Or, if you prefer one click, keep the Create button but make it clear this is only picking the Opportunity — the inputs come next. I'll go with auto-create on select for the smoothest experience.

3. **Detail page polish** (`/quotes/:id`): add a small helper line under the header — "Fill in the sections below. Changes save automatically." — so it's obvious this is where the work happens.

### Files touched
- `src/components/quotes/QuoteVersionsPanel.tsx` — button auto-creates + navigates
- `src/pages/QuoteNew.tsx` — auto-create on Opportunity select
- `src/pages/QuoteDetail.tsx` — add helper subtitle

No schema changes, no new fields. Purely a UX fix.
