## Quote Tool + Contractor Proposal Uploads — Implementation Plan

Two connected additions:
1. **Quote Tool** — new Red Loft–only left-nav module for versioned consulting quotes tied to Opportunities, with internal editable view and client PDF.
2. **Contractor Proposal Uploads** — on the Proposal page inside Opportunities, four separate file upload slots (Fitness Equipment, Interior Designer, Architect, Graphic Designer).

---

### PART A — Quote Tool

#### A1. Navigation & Routing
- Add "Quote Tool" (Calculator icon) to `AppLayout` sidebar, gated by `isRedLoftWorkspace()` — hidden in Treneur/default workspaces.
- Routes:
  - `/quotes` — list of all quotes (workspace-scoped)
  - `/quotes/new?dealId=…` — create quote for an Opportunity (picker if no `dealId`)
  - `/quotes/:id` — internal editable view
  - `/quotes/:id/preview` — client-facing PDF preview + download
- On Opportunity detail, add a Quotes panel with versions (v1, v2…) + "New Quote" button that auto-increments `version_number`.

#### A2. Data Model
**`quotes`** — one row per quote version
- `deal_id` (FK → deals), `contact_id` (FK, nullable), `version_number` (int, auto-incremented per deal), `status` (draft/sent/accepted/rejected)
- Universal: `service_category` (mirrored from `deal.deal_type` at creation, read-only), `engagement_type` (one_time/retainer/phased), `timeline_urgency`, `decision_maker_count`
- `service_details` JSONB — holds the 5 conditional per-category fields (avoids 15 sparse columns)
- Labor: `hourly_rate`, `phase_consultation_hours`, `phase_concept_hours`, `phase_revisions_hours`, `phase_revisions_rounds`, `phase_sourcing_hours`, `phase_pm_hours`, `phase_handoff_hours`
- Discount: `discount_type` (percentage/flat), `discount_value`, `discount_reason`
- Snapshot fields captured at creation so old quotes stay accurate: `snapshot_contact_name/email/phone`, `snapshot_referral_source`, `snapshot_project_name`, `snapshot_project_address`
- Standard: `workspace_id`, `owner_id`, `created_at`, `updated_at`

**`quote_contractor_items`** — child rows
- `quote_id` (FK cascade), `contractor_type` (enum: fitness_equipment/interior_design/architecture/graphic_design/other), `vendor_name`, `flat_fee`, `markup_percentage`, `sort_order`
- `client_price` computed client-side (`flat_fee × (1 + markup/100)`) — not stored.

**RLS**: workspace-scoped, matching `deals` pattern. GRANT SELECT/INSERT/UPDATE/DELETE to `authenticated`; GRANT ALL to `service_role`. `updated_at` triggers on both. Unique index on `(deal_id, version_number)`.

#### A3. Internal Editable View (`/quotes/:id`)
1. Header — version badge, Opportunity link, Service Category badge, Status dropdown
2. Client Info (read-only from Contact + Opportunity snapshot)
3. Universal fields (engagement, timeline, decision-maker count)
4. Service-Specific panel — one of three field groups by `service_category` (Programming/Design/Policy). Renders blank if category missing.
5. Labor Pricing — Hourly Rate + 6 phase rows (hours × rate). Revisions row has extra "Rounds Included" number (informational).
6. Contractors repeater — type, vendor, flat fee, markup %, computed client price.
7. Discount — type toggle (%/$), value, reason. Applies to Labor Subtotal only.
8. Totals — Labor Subtotal, Discount, Adjusted Labor, Contractor Subtotal, **Total**.
9. Actions — Save (autosave), New Version (clones with `version_number + 1`), Generate PDF.

#### A4. Client PDF (`/quotes/:id/preview`)
- React component styled to Red Loft brand tokens; export via `react-to-print` (client-side, no bundle bloat).
- Per spec §9.2: header/logo, client + project + date, Problem Statement (from service-specific gap fields), Proposed Approach (4 P's framing per category), Deliverables checklist (placeholder per category — Karl's copy in a follow-up), Timeline, Investment table.
- **Hidden on PDF**: hourly rate, per-phase hours, contractor vendor names, contractor markup %. Shows phase → dollar total; contractor lines as `{Contractor Type} — Client Price`. Discount amount shown when applied; reason toggleable per quote.

---

### PART B — Contractor Proposal Uploads (Proposal page)

Four dedicated upload slots on the existing Proposal page in Opportunities, one per contractor type: **Fitness Equipment, Interior Designer, Architect, Graphic Designer**.

#### B1. Storage
- Reuse existing `deal-files` bucket (already public per current storage config).
- File path convention: `contractor-proposals/{deal_id}/{contractor_type}/{timestamp}-{filename}`.

#### B2. Data Model
Reuse existing `deal_files` table by adding two nullable columns:
- `file_category` (text, nullable) — `'contractor_proposal'` for these uploads
- `contractor_type` (text, nullable) — enum-like: `fitness_equipment` / `interior_designer` / `architect` / `graphic_designer`

No new table. Existing RLS on `deal_files` already scopes by deal/workspace. Existing indexes stay valid.

#### B3. UI on Proposal Page
- Add a "Contractor Proposals" section with four labeled upload cards side-by-side (responsive grid, stacks on mobile):
  - Fitness Equipment
  - Interior Designer
  - Architect
  - Graphic Designer
- Each card shows: label, drop-zone / "Upload" button, current file (name + view/download + delete). Multiple files per slot supported (list under each card).
- File types accepted: PDF, DOC/DOCX, images. Max size guard client-side (e.g. 20 MB).
- Uses existing `useDealFiles` hook, extended to accept `file_category` + `contractor_type` on upload and to filter by them for display.

---

### Files to Add / Touch

**Database (single migration)**
- Create `quotes` + `quote_contractor_items` tables with RLS, policies, GRANTs, `updated_at` triggers, unique index.
- `ALTER TABLE deal_files ADD COLUMN file_category text, ADD COLUMN contractor_type text;` (nullable, no backfill needed).

**New source files**
- `src/pages/Quotes.tsx`, `src/pages/QuoteDetail.tsx`, `src/pages/QuotePreview.tsx`
- `src/hooks/useQuotes.ts`, `src/hooks/useQuoteContractorItems.ts`
- `src/lib/quoteCalculations.ts`
- `src/components/quotes/QuoteServiceFields.tsx`, `QuotePhaseTable.tsx`, `QuoteContractorTable.tsx`, `QuoteTotals.tsx`, `QuoteVersionsPanel.tsx`
- `src/components/proposal/ContractorProposalUploads.tsx` (four upload cards)

**Edited**
- `src/components/layout/AppLayout.tsx` — Quote Tool nav item (Red Loft gated)
- `src/App.tsx` — register `/quotes` routes
- `src/pages/DealDetail.tsx` — mount `QuoteVersionsPanel`
- Existing Proposal page component (`src/pages/Proposal.tsx` or equivalent) — mount `ContractorProposalUploads`
- `src/hooks/useDealFiles.ts` — accept + filter on `file_category` and `contractor_type`
- `src/integrations/supabase/types.ts` — regenerated after migration

### Deferred / Follow-ups
- Deliverables checklist copy per category (Karl to provide).
- Enforced Rounds Included logic (staying informational per user answer).
- Send-to-client email flow, e-sign, richer status tracking.
- Referral Source dropdown standardization (staying free text per user answer).
- Contractor-proposal → auto-populate matching contractor row on the linked Quote (nice-to-have).
