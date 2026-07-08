
## Change the model to a singleton repository

There is only ever one Service Knowledge Playbook per workspace. It behaves as a reference document the AI will read later when generating the SOW.

### Playbooks page (`src/pages/Playbooks.tsx`)
- Remove the Service Knowledge table entirely.
- Replace the "Create a Service Knowledge Playbook" button with a single **"Edit Service Knowledge Playbook"** button under the Service Knowledge Playbook header. If no row exists yet, the button still opens the form and creates it on first save.
- Keep the Communication Playbook section as-is.

### Service Knowledge form (`src/pages/ServiceKnowledgePlaybookForm.tsx`)
- Route becomes just `/playbooks/service-knowledge` (drop `/new` and `/:id/edit`).
- On load: fetch the single row for the current workspace where `kind = 'service_knowledge'`. If none, the form starts empty and creates it on save; if one exists, the form updates it. No "Name" field — the record is implicit.
- Sections 1, 2, 3 become **labeled text inputs**, one per box (not selectable buttons):
  - Section 1 — Opportunity Type: three `Input`s labeled **Programming**, **Design**, **Policy**.
  - Section 2 — Engagement Type: three `Input`s labeled **One-time**, **Retainer**, **Phased**.
  - Section 3 — Design Type: two `Input`s labeled **New Construction**, **Retrofit**.
- Sections 4, 5, 6 stay as single `Textarea`s (Design Details, Programming Details, Policy Details).
- Save button label: **"Save Playbook"**.

### Data model (migration)
Replace the previously added categorical columns (`opportunity_types text[]`, `engagement_type text`, `design_type text`) with per-box text columns on `playbooks`:

- `opp_programming text`, `opp_design text`, `opp_policy text`
- `eng_one_time text`, `eng_retainer text`, `eng_phased text`
- `dtype_new_construction text`, `dtype_retrofit text`

Keep existing `design_details`, `programming_details`, `policy_details`, and the `kind` column. Add a partial unique index enforcing one Service Knowledge row per workspace:

```sql
CREATE UNIQUE INDEX playbooks_one_service_knowledge_per_workspace
  ON public.playbooks(workspace_id)
  WHERE kind = 'service_knowledge';
```

The old columns are dropped in the same migration (they were only added in the last turn and have no user data yet).

### Hook (`src/hooks/usePlaybooks.ts`)
- Update `Playbook`/`PlaybookFormData` types to match new columns (drop `opportunity_types`, `engagement_type`, `design_type`; add the 8 new text fields).
- Add `useServiceKnowledgePlaybook()` helper that returns the current workspace's singleton and an `upsert` mutation.

### Routing (`src/App.tsx`)
Replace the two service-knowledge routes with one: `/playbooks/service-knowledge`.

### Files changed
- `supabase/migrations/<new>.sql`
- `src/integrations/supabase/types.ts` (auto)
- `src/hooks/usePlaybooks.ts`
- `src/pages/Playbooks.tsx`
- `src/pages/ServiceKnowledgePlaybookForm.tsx`
- `src/App.tsx`
