
## 1. Deal Detail right sidebar — Opportunity Type
`src/components/deals/PlaybookPanel.tsx` still shows a single-select "Deal Type" dropdown with the wrong option list. Replace it with the same multi-select checkbox group used in `DealFormDialog`:
- Label: "Opportunity Type"
- Options: from `useDealFieldConfig().dealTypes` (workspace-aware — Red Loft / Treneur / default)
- Value: array; toggling a checkbox calls `onUpdate({ deal_type: nextArray.length ? nextArray : null })`
- Remove `PLAYBOOK_DEAL_TYPES` usage in the field itself; keep the playbook-association line at the bottom as-is.

## 2. Quote save error — "Could not find the contacts column"
`src/pages/QuoteDetail.tsx` save handler spreads `local` and only strips `id, created_at, updated_at, version_number, workspace_id`. But `useQuote` selects `*, deals(...), contacts(...)`, so `deals` and `contacts` join objects are on `local` and get sent in the update payload, which PostgREST rejects.

Fix: also destructure and drop `deals` and `contacts` before sending the patch.

## 3. Bigger logo on PDFs
`src/pages/QuotePreview.tsx` — change the logo `<img>` from `h-16` to `h-28` (roughly doubles visual size) on both SOW and Invoice (single shared header).

## Files changed
- `src/components/deals/PlaybookPanel.tsx`
- `src/pages/QuoteDetail.tsx`
- `src/pages/QuotePreview.tsx`
