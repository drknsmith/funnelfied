

# Fix Stage Display on Account Detail Page

## Problem

1. The **StageTimeline** component (used on the Deal Detail page) uses hardcoded `DEAL_STAGES` from `useDeals.ts` instead of the workspace-specific custom stages from `usePipelineStages`. For Treneur, this shows the wrong 9-stage pipeline.

2. The **Account Detail** page shows deal stages as a raw badge with `deal.stage.replace('_', ' ')`, which doesn't match the proper stage labels and doesn't use the custom Treneur pipeline stages.

3. Deals at the first stage (e.g., "Target Identified" for Treneur, or "Signal / Target" for default) may not appear on the main Deals pipeline page if their `stage` value doesn't match any column -- this needs verification, but the fix below ensures consistency.

## Changes

### 1. Update StageTimeline to use dynamic pipeline stages

**File: `src/components/deals/StageTimeline.tsx`**

- Replace the `DEAL_STAGES` import with `usePipelineStages` hook
- Use the dynamic `stages` array instead of the hardcoded constant
- This makes the timeline on the Deal Detail page match the main Deals pipeline page

### 2. Update Account Detail deal list to show proper stage labels

**File: `src/pages/AccountDetail.tsx`**

- Import and use `usePipelineStages` hook
- Replace `deal.stage.replace('_', ' ')` with the proper label from the stages array
- Also show the deal name as the primary text (currently missing -- only stage badge and size are shown)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/deals/StageTimeline.tsx` | Use `usePipelineStages()` instead of hardcoded `DEAL_STAGES` |
| `src/pages/AccountDetail.tsx` | Use `usePipelineStages()` for stage labels in deal list |

