## 1. Quote list: delete with confirmation

**`src/pages/Quotes.tsx`**
- Convert each row from a `<button>` into a flex row: clickable area (opens quote) + trailing trash icon button that opens an `AlertDialog`.
- `AlertDialog` confirms "Delete this quote? This action cannot be undone." → calls `deleteQuote(q.id)` from `useQuotes`.
- Icon: `Trash2` from lucide-react, `variant="ghost"`, small; `stopPropagation` so it doesn't trigger row navigation.

## 2. Opportunity Type → multi-select

### Database
Migration: convert `deals.deal_type text` → `deals.deal_type text[]`.
- `USING` clause preserves existing single values as one-element arrays: `array[deal_type] filter nulls`.
- Default: `'{}'`.

### Types & hooks
- `src/integrations/supabase/types.ts` is auto-regenerated after the migration runs — no manual edit needed.
- `src/hooks/useDeals.ts`: adjust `DealWithRelations` consumers only where they read `deal_type` as string.

### `DealFormDialog.tsx`
- Schema: `deal_type: z.array(z.string()).optional()`.
- Replace the `Select` under "Opportunity Type" with a vertical stack of `Checkbox` + `Label` rows built from `dealTypes` (from `useDealFieldConfig`).
- `field.value` is the array; toggle checked state via `field.onChange(next)`.
- `handleSubmit`: send `deal_type: data.deal_type?.length ? data.deal_type : null`.

### Downstream displays reading `deal.deal_type` as a string
Search-and-fix in these files (verified relevant during exploration):
- `src/components/deals/DealCard.tsx`
- `src/pages/DealDetail.tsx`
- `src/pages/Deals.tsx` (filter/badge)
- `src/components/quotes/QuoteVersionsPanel.tsx` (uses `deal.deal_type` as the quote's initial `service_category`) — pick the first element for the default snapshot only.

Render as comma-joined labels using `dealTypes` lookup; filter logic that matched a single value becomes `.includes()`.

## 3. Quote tool: stack all service sections per selected types

Currently `quotes.service_category` is a single text column that drives one `SERVICE_DETAIL_FIELDS[...]` block.

### Database
Migration: convert `quotes.service_category text` → `quotes.service_category text[]`, `USING array[service_category] filter nulls`, default `'{}'`.

### `src/pages/QuoteNew.tsx` / `QuoteVersionsPanel.tsx` (draft creation)
- When auto-creating a draft from a deal, copy `deal.deal_type` (now an array) into `quote.service_category`.

### `src/pages/QuoteDetail.tsx`
- Replace the single "Details" card with one card per entry in `local.service_category`, each rendering its own `SERVICE_DETAIL_FIELDS[category]` block.
- Card title: `${SERVICE_CATEGORY_LABELS[cat]} Details`.
- All fields still write into the shared `service_details` JSONB. Namespacing keys per category avoids collisions when two categories reuse the same field key. Use `service_details[category][field_key]` (nested object per category).
- Update `saveDetail` to write into the nested path.
- Header badges: render one `Badge` per category instead of one.

### `src/pages/Quotes.tsx` and `QuoteVersionsPanel.tsx` list badge
- Render one badge per category (join labels or map to badges).

### `SERVICE_CATEGORY_LABELS` unchanged
No changes to `quoteCalculations.ts` other than typing `service_category` as `string[]`.

## Delivery order
1. Run the migration (deals + quotes columns).
2. After migration approval and types regen, apply all code edits together.
3. Verify: create a new opportunity with 2 types → open a new quote → confirm both detail sections render and save; delete a quote from the Quotes list via the confirmation dialog.
