# Plan: Red Loft Opportunity Types + Opportunity Name auto-fill

## 1. Red Loft-specific Opportunity Types
Add a new constant in `src/hooks/useDeals.ts`:

```ts
export const REDLOFT_DEAL_TYPES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'policy', label: 'Policy' },
] as const;
```

Update `src/hooks/useDealFieldConfig.ts` to detect Red Loft (`isRedLoftWorkspace`) and return `REDLOFT_DEAL_TYPES` for that workspace. Priority order: Treneur → Red Loft → default.

This automatically flows through everywhere `useDealFieldConfig()` is consumed (New Opportunity form, DealDetail, DealFormDialog).

## 2. Account "Edit" dialog — rename + use new types
In `src/components/accounts/AccountFormDialog.tsx`:
- Change label `"Default Deal Type"` → `"Default Opportunity Type"` (Treneur keeps `"Business Model"`).
- Add a Red Loft branch that renders `REDLOFT_DEAL_TYPES` (Programming / Design / Policy) instead of the generic `DEAL_TYPES`.

## 3. Auto-fill Opportunity Name on New Opportunity
Currently `autoDealName` in `src/pages/DealForm.tsx` requires **both** an account and a deal type before it fills the name, so on a fresh form the field looks empty.

Change so the name auto-populates as soon as an account is selected:
- If account + type → `"{Account} – {Type}"` (current behavior)
- If account only → `"{Account}"`
- Keep the "only fill when field is empty / user hasn't edited it" guard so we don't overwrite manual edits.

## Files touched
- `src/hooks/useDeals.ts` — add `REDLOFT_DEAL_TYPES`
- `src/hooks/useDealFieldConfig.ts` — return Red Loft types when in that workspace
- `src/components/accounts/AccountFormDialog.tsx` — rename label + Red Loft type list
- `src/pages/DealForm.tsx` — auto-fill name from account alone

No database changes. Existing deals keep whatever `deal_type` value they have; only new selections use the new list.
