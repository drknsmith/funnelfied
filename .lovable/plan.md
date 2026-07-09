## SOW Form updates (QuoteDetail → SOW tab)

### 1. Hourly Rate default = $200
- DB migration on `public.quotes`: `ALTER COLUMN hourly_rate SET DEFAULT 200;` and backfill existing rows where `hourly_rate = 0` to `200` so existing draft quotes reflect the new default. The field stays a plain editable numeric `Input` (already editable today).

### 2. New "Work" section (above Deliverables)
- Add a new `sow_work_items` JSONB column (default `'[]'`) on `public.quotes`. Shape: `[{ name: string, description: string }]`.
- In `src/pages/QuoteDetail.tsx`, insert a new card block above the Deliverables block inside the Statement of Work card:
  - Header row: "Work" label + `+ Add` button (mirrors Deliverables) + new `Process Work with AI` button (Sparkles icon).
  - Each row: `Name` input (col-span-4) + `Short description` textarea (col-span-7) + trash button (col-span-1), identical layout to Deliverables.
  - Empty-state text: "No work items yet."
- AI button calls a new edge function `process-work` that surfaces service-type work items (e.g. Interior Design, SOP Creation, Fitness Equipment, Space Planning, Programming, Policy Development) based on the quote's `service_category`, `engagement_type`, and `service_details`. Uses the same Lovable AI gateway pattern as `generate-sow`. Response replaces `sow_work_items` locally; user reviews and saves (same pattern used by Milestones — dirty flag + Save button).

### 3. "Process Deliverables with AI" button
- Add a new `Process Deliverables with AI` button next to the existing Deliverables `+ Add` button.
- Calls a new edge function `process-deliverables` that surfaces deliverable artifacts (e.g. Invoice, SOPs, Policies, Training Documents, Equipment List, Design Package) informed by the quote's categories, the Work items entered above, and existing deliverables. Same dirty-flag + Save pattern as Milestones.

### Technical notes
- Two new edge functions (`process-work`, `process-deliverables`) modeled on `generate-sow` — same auth check, playbook lookup, JSON output, error handling (429/402). Each returns `{ items: [{name, description}], warnings: [] }` without persisting; the client sets local state and Save writes to the DB.
- `useQuotes.ts` `Quote` type gets `sow_work_items: Array<{name; description}>`.
- No changes to Invoice tab, preview, or print view for this pass — surfacing Work in the SOW preview/appendix can be a follow-up if you want it in the client-facing PDF.

### Files touched
- New migration: default hourly_rate 200, backfill zeros, add `sow_work_items` jsonb column.
- `src/hooks/useQuotes.ts` — add field to Quote type.
- `src/pages/QuoteDetail.tsx` — Work section UI + AI buttons + local dirty state for both AI flows.
- `supabase/functions/process-work/index.ts` (new).
- `supabase/functions/process-deliverables/index.ts` (new).

Confirm and I'll build it.