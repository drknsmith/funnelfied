
## Changes

### 1. Milestone dates via an explicit "Process Milestones with AI" step (QuoteDetail.tsx)

Problem: today, milestone `target_date` values are only set when the salesperson clicks **Generate SOW PDF** — the AI rewrites the whole milestones array in one shot, overwriting whatever names/dates the salesperson typed. That's why the dates in the preview timeline don't match what was entered in the form.

Fix: add a dedicated, milestone-only AI pass the salesperson runs from the Milestones panel *before* Generate SOW PDF. It is scoped to milestones and never touches Executive Summary, Problem Statement, Proposed Approach, Deliverables, or Terms.

- Add a **Process Milestones with AI** button in the Milestones panel header (next to "Add milestone"). Disabled until at least one milestone row exists OR Engagement Type + Timeline/Urgency are set (so the AI has something to anchor dates to).
- On click: invoke a new edge function `suggest-milestones` with `{ quoteId, workspaceId }`. It receives the full form state (same shape as generate-sow) plus the current milestone rows and returns `{ milestones: [{ name, description, target_date }], warnings: [] }`.
  - AI rules: refine/complete the salesperson's existing rows (preserve their names when present, fill in blanks, and set realistic `target_date`s based on Engagement Type phase structure + Timeline/Urgency, working forward from today's date passed in). If the list is empty, generate a suggested set from the active components + engagement type. Never invent dates outside the stated urgency window.
- Response is written into a **review UI** (in-place edit of the milestone rows, not auto-saved): each returned row lands in the existing milestone inputs so the salesperson can adjust name/description/date before saving. A small "AI suggestions applied — review and Save" banner appears above the list until they click Save. Save persists to `quotes.sow_milestones` via the existing update path.
- Update `generate-sow` so it **preserves the salesperson's `sow_milestones` verbatim** and no longer rewrites them. It still generates Executive Summary, Problem Statement, Proposed Approach, Deliverables, and Terms. The milestones panel is now the sole owner of milestone content. The system prompt and JSON schema drop the `milestones` field.
- Preview timeline (`QuotePreview.tsx`) already reads `quote.sow_milestones` — no change needed; dates will now match because they are whatever the salesperson approved.

### 2. Remove duplicate project-context blocks from the SOW preview (QuotePreview.tsx)

Remove the standalone "context" sections that render raw form inputs already folded into the AI-written SOW body. Specifically the SOW view should show only:

- Header (project name, client, Red Loft contact, date, version)
- Executive Summary
- Problem Statement
- Proposed Approach (+ 4 P's emphasis pills if any)
- Deliverables
- Milestones (timeline)
- Terms and Conditions
- Rate & Billing Terms (unchanged — form inputs only)

Drop from the SOW preview: the Engagement/Component Details/Design Details/Programming Details/Policy Details raw dump blocks, and any "Salesperson Notes" or structured-field summary panels. Remove them from the "Copy as Markdown" output as well.

I'll confirm the exact block names by reading `QuotePreview.tsx` before editing so nothing unrelated is removed.

## Technical notes

- New edge function `supabase/functions/suggest-milestones/index.ts`, registered in `supabase/config.toml`. Model: `google/gemini-2.5-flash` (cheaper/faster than pro; milestones-only task doesn't need pro-tier reasoning). JSON response format. Passes `today` (ISO date) into the prompt so the model has an anchor.
- `generate-sow` edits: remove `milestones` from the JSON schema, the merge rules block, and the DB patch. Keep everything else identical.
- No DB migration required — `sow_milestones` column already exists.
- Client: new mutation hook in `QuoteDetail.tsx` (or inline) that calls `supabase.functions.invoke('suggest-milestones', ...)`, sets local milestone state, shows the "review and Save" banner, and toasts on 429/402. Save button reuses the existing `updateQuote` path.
