
## Playbooks page — two sections

Restructure `src/pages/Playbooks.tsx` so the single list becomes two grouped sections, each with its own header and its own "New" button:

1. **Communication Playbooks** — the current table, filtered to `kind = 'communication'`. Header button relabeled to **"New Communication Playbook"** (routes to `/playbooks/new` — unchanged form).
2. **Service Knowledge Playbooks** — new table with its own rows, filtered to `kind = 'service_knowledge'`. Header button **"Create a Service Knowledge Playbook"** routes to a new page `/playbooks/service-knowledge/new` (and `/playbooks/service-knowledge/:id/edit` for editing).

The top-level "New Playbook" button is removed in favor of the two section-level buttons. Search/filter bar stays and applies to both sections.

## New Service Knowledge Playbook form

New page `src/pages/ServiceKnowledgePlaybookForm.tsx` with 6 sections, each a `Card`:

- **Section 1 — Opportunity Type**: three checkbox-style boxes (multi-select) labeled **Programming**, **Design**, **Policy**.
- **Section 2 — Engagement Type**: three boxes (single-select radio) labeled **One-time**, **Retainer**, **Phased**.
- **Section 3 — Design Type**: two boxes (single-select radio) labeled **New Construction** and **Retrofit**.
- **Section 4 — Design Details**: single `Textarea`.
- **Section 5 — Programming Details**: single `Textarea`.
- **Section 6 — Policy Details**: single `Textarea`.

Plus a **Name** input at the top and Save/Cancel actions (same UX pattern as `PlaybookForm.tsx`).

## Data model

Extend the existing `playbooks` table (via new migration) rather than a second table, so the list and filters share one query:

- `kind text not null default 'communication'` — values: `'communication' | 'service_knowledge'`.
- `opportunity_types text[]` — subset of `['programming','design','policy']`.
- `engagement_type text` — `'one_time' | 'retainer' | 'phased'`.
- `design_type text` — `'new_construction' | 'retrofit'`.
- `design_details text`, `programming_details text`, `policy_details text`.

All existing rows default to `kind = 'communication'`, so today's playbooks appear under the Communication section with no data loss. Existing communication-only required fields (email/linkedin/exit_rule) are not required for `service_knowledge` rows — validation branches on `kind`.

## Files changed

- `supabase/migrations/<new>.sql` — add columns above; no new RLS/grants needed (table already configured).
- `src/integrations/supabase/types.ts` — regenerated to include new columns.
- `src/hooks/usePlaybooks.ts` — extend `Playbook`/`PlaybookFormData` with new fields + `kind`; allow `kind` filter in `usePlaybooks({ kind })`.
- `src/pages/Playbooks.tsx` — render two sections with their own headers, buttons, and tables.
- `src/pages/ServiceKnowledgePlaybookForm.tsx` — new form with the 6 sections above.
- `src/App.tsx` — add routes `/playbooks/service-knowledge/new` and `/playbooks/service-knowledge/:id/edit`.
- `src/pages/PlaybookDetail.tsx` — minor: route Service Knowledge rows to the new edit route when clicked (kept simple; detail page continues to work for communication playbooks).
