# Plan: Deals → Opportunities rename + Project Address + Pipeline reorder

Scope covers items 1–7 from your message. Item 8 (new Proposal page) is deferred as you requested.

## 1. Rename "Deals" → "Opportunities" everywhere in the UI

User-facing terminology only — database tables, column names, hooks, file names, and route paths stay as `deals` to avoid a risky full refactor across ~60 files, RLS policies, edge functions, and types. Only visible text changes.

- Sidebar / nav labels, page titles, buttons ("New Deal" → "New Opportunity", "Pipeline" heading, empty states, toasts, modal titles).
- Dashboard widgets, filters, badges, tooltips, breadcrumbs.
- Scribe/AI copy that mentions "deal" in user-visible strings.
- Keep URLs (`/deals`, `/deals/:id`) working; optionally add `/opportunities` as an alias later (not in this pass).

Files touched (UI text only): `Deals.tsx`, `DealDetail.tsx`, `DealForm.tsx`, `DealCard.tsx`, `DealFormDialog.tsx`, `DealQuickList.tsx`, `AppLayout.tsx` (nav), dashboard components, Scribe strings.

## 2. Add "Project Address" to Core Opportunity Identity

- DB migration: add nullable columns to `public.deals`: `project_street`, `project_city`, `project_state`, `project_zip` (all `text`).
- `DealForm.tsx`: add a "Project Address" group inside Core Opportunity Identity with 4 inputs (Street, City, State, Zip). Wire to `formData` + create/update mutations.
- `useDeals.ts` `Deal` interface: add the 4 fields.

## 3. Research auto-populates address from selected opportunity

- On the Research page, when an opportunity is selected, prefill Project Address from the opportunity's `project_street/city/state/zip`.
- If the opportunity has no project address yet, fall back to the account's existing location (current behavior).

## 4. Research page: rename Community Name/Address

- "Community Name" → "Project Name" (auto-populated from opportunity's `deal_name`, editable).
- "Community Address" → "Project Address" (auto-populated from opportunity's project address, editable).

## 5. Opportunities list: show + edit address

- `Deals.tsx` (Pipeline board cards): show a compact single-line address under the account name when present.
- `DealDetail.tsx`: display the Project Address and allow inline edit (reuses the same form fields).

## 6. Pipeline stage order

Move the final three stages to: 7. Nurture, 8. Won, 9. Lost/Archived.

- Update `DEAL_STAGES` in `useDeals.ts` and `DEFAULT_DEAL_STAGES` in `usePipelineStages.ts`.
- Data migration: no stage value changes (only display order), so existing deals are unaffected.

## 7. Opportunities page → Proposal section: strip inputs

- In `DealDetail.tsx`, remove all proposal-related inputs (proposal link, requested date, submitted date, etc.) from the Proposal section.
- Replace with a placeholder card: "Proposal details will be populated from the Proposal page (coming soon). Editable here after generation."
- Do NOT drop the DB columns — the future Proposal page will write to them.

## 8. Deferred

New Proposal page (left-menu item, invoice number, bill-to, deal prepopulation) — not built in this pass, per your instruction.

---

## Technical notes

- One DB migration adds `project_street/city/state/zip` to `deals` (RLS unchanged; inherits existing policies).
- No rename of the `deals` table — visual-only relabeling keeps this a low-risk change.
- Types regenerate automatically after the migration; form + hook edits land after that.
- Route paths remain `/deals/*`; can be aliased to `/opportunities/*` in a follow-up if desired.
