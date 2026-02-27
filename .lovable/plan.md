
# Fix Stage Consistency Across All Deal Views

## Problem

Multiple components use the hardcoded `DEAL_STAGES` constant from `useDeals.ts` instead of the dynamic workspace-specific stages from `usePipelineStages()`. This causes Treneur workspace users to see incorrect stage names (e.g., "Signal / Target" instead of "Target Identified") in stage dropdowns and labels throughout the deal UI.

The main Deals Pipeline page correctly uses `usePipelineStages()`, but the following pages/components do not.

## Changes

### 1. DealDetail.tsx -- Use dynamic stage label

**File: `src/pages/DealDetail.tsx`**

- Import `usePipelineStages` hook
- Call `usePipelineStages()` to get the `stages` array
- Replace `DEAL_STAGES.find(...)` on line 113 with `stages.find(...)` for the stage label
- Remove `DEAL_STAGES` from the import if no longer used

### 2. DealForm.tsx -- Use dynamic stages in dropdown and validation modal

**File: `src/pages/DealForm.tsx`**

- Import `usePipelineStages` hook
- Call `usePipelineStages()` to get the `stages` array
- Replace `DEAL_STAGES.map(...)` in the stage Select dropdown (line 273) with `stages.map(...)`
- Replace `DEAL_STAGES.find(...)` in the validation modal label (line 710) with `stages.find(...)`
- Remove `DEAL_STAGES` from the `useDeals` import

### 3. DealFormDialog.tsx -- Use dynamic stages in quick-create dropdown

**File: `src/components/deals/DealFormDialog.tsx`**

- Import `usePipelineStages` hook
- Call `usePipelineStages()` to get the `stages` array
- Replace `DEAL_STAGES.map(...)` in the stage Select (line 212) with `stages.map(...)`
- Remove `DEAL_STAGES` from the `useDeals` import

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/DealDetail.tsx` | Use `usePipelineStages()` for stage label |
| `src/pages/DealForm.tsx` | Use `usePipelineStages()` for stage dropdown and validation modal |
| `src/components/deals/DealFormDialog.tsx` | Use `usePipelineStages()` for stage dropdown |
