
# Rename "Proposal Creator" to "Research" and Integrate with Deals

## Overview
Rename "Proposal Creator" to "Research" throughout the system and integrate it as a new tab in the Deal Detail page for Superior workspace only. Research will be linked to specific deals, allowing users to create, view, and edit research from within the deal context.

---

## Findings

### Superior Workspace ID
The **Superior Sales Pipeline workspace ID** is: `00000000-0000-0000-0000-000000000001`

This is already correctly defined in the codebase. The current placeholder value happens to match the actual database value.

### Current Structure
- `proposal_reports` table exists but has no `deal_id` column
- Deal Detail page has tabs: Details, Interactions, Messages, Proposal
- Research should be added as a new tab after Details

---

## Implementation Plan

### 1. Database Migration
Add `deal_id` column to link research to specific deals:

| Column | Type | Notes |
|--------|------|-------|
| deal_id | uuid | FK to deals.id, nullable (for standalone reports) |

Update RLS policies to allow deal-based access.

### 2. Rename Throughout Codebase

| Location | Current | New |
|----------|---------|-----|
| Nav item label | "Proposal Creator" | "Research" |
| Page title | "Proposal Creator" | "Research" |
| Page subtitle | "Generate presentation-ready fitness center proposals" | "Generate presentation-ready market research" |
| Share dialog | "Share Report" | "Share Research" |
| Function names | `canUseProposalCreator` | `canUseResearch` |

### 3. Files to Rename

| Current | New |
|---------|-----|
| `src/pages/ProposalCreator.tsx` | `src/pages/Research.tsx` |
| `src/pages/SuperiorReport.tsx` | Keep name (public view) |

### 4. Update Deal Detail Page

Add "Research" tab after "Details" (only for Superior workspace):

```text
Tabs: Details | Research | Interactions | Messages | Proposal
                  ^-- New tab, Superior only
```

**Research Tab Behavior:**
- If no research exists for this deal: Show input form with all fields
- If research exists: Show outputs with "Edit" button to modify inputs
- Pre-populate Community Name from Deal Name
- Pre-populate Community Address from Account location if available

### 5. Create Research Tab Component

New component `src/components/deals/ResearchTab.tsx`:
- Check if research exists for deal_id
- Embed ProposalInputPanel + ProposalOutputs + ProposalMap
- Handle create/update operations
- Show Print/Share buttons when outputs are available

### 6. Update Hooks

Modify `useProposalReport.ts`:
- Add `dealId` parameter to `saveReport()`
- Add `loadReportByDealId()` function
- Update `ProposalReportData` interface

### 7. Route Changes

| Current Route | New Route |
|---------------|-----------|
| `/proposal-creator` | `/research` |
| `/superior/reports/:token` | Keep as-is |

---

## Detailed Changes by File

### Files to Modify

**`src/lib/workspaceFeatures.ts`**
- Add: `canUseResearch()` as alias for `canUseProposalCreator()`
- Keep old function for backward compatibility or migrate fully

**`src/components/layout/AppLayout.tsx`**
- Change nav item label: "Proposal Creator" → "Research"
- Change route: `/proposal-creator` → `/research`

**`src/pages/ProposalCreator.tsx` → `src/pages/Research.tsx`**
- Rename file
- Update page title: "Research"
- Update subtitle text
- Add optional `dealId` prop for embedded usage

**`src/hooks/useProposalReport.ts`**
- Add `dealId` to save function
- Add `loadReportByDealId(dealId)` function
- Add `updateReport()` function for editing

**`src/pages/DealDetail.tsx`**
- Import `isSuperiorWorkspace` from workspaceFeatures
- Add "Research" tab (conditional on Superior workspace)
- Integrate ResearchTab component

**`src/App.tsx`**
- Rename route: `/proposal-creator` → `/research`
- Update import to use Research component

### Files to Create

**`src/components/deals/ResearchTab.tsx`**
- Embedded research panel for Deal Detail
- Loads existing research by deal_id or shows create form
- Uses ProposalInputPanel, ProposalOutputs, ProposalMap components
- Pre-populates from deal/account data

---

## Database Migration

```sql
-- Add deal_id to proposal_reports
ALTER TABLE public.proposal_reports 
ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_proposal_reports_deal_id 
ON public.proposal_reports(deal_id);

-- Update RLS to allow access via deal ownership
CREATE POLICY "Users can view research for their deals"
ON public.proposal_reports FOR SELECT
TO authenticated
USING (
  deal_id IN (
    SELECT id FROM deals 
    WHERE workspace_id = current_workspace()
  )
  OR owner_user_id = auth.uid()
  OR public.is_super_admin()
  OR (expires_at IS NULL OR expires_at > now()) AND token IS NOT NULL
);
```

---

## User Experience Flow

### Creating Research from Deal
1. User opens Deal Detail page
2. Clicks "Research" tab (Superior workspace only)
3. Form appears with:
   - Community Name pre-filled from Deal Name
   - Community Address pre-filled from Account location
4. User fills remaining fields and fetches comps
5. Outputs display with Print/Share options
6. Research auto-saves linked to the deal

### Editing Existing Research
1. User opens Deal → Research tab
2. Sees computed outputs and map
3. Clicks "Edit" button
4. Input form appears with current values
5. User modifies and saves

### Standalone Research Page
- Navigate to `/research` from sidebar
- Works as before but without deal linkage
- Can still create shareable reports

---

## Component Structure

```text
DealDetail.tsx
└── Tabs
    ├── Details
    ├── Research (Superior only)
    │   └── ResearchTab.tsx
    │       ├── ProposalInputPanel
    │       ├── ProposalOutputs
    │       ├── ProposalMap
    │       └── Print/Share buttons
    ├── Interactions
    ├── Messages
    └── Proposal
```

---

## Summary of Changes

| Category | Count |
|----------|-------|
| Database migration | 1 |
| Files to create | 1 |
| Files to rename | 1 |
| Files to modify | 6 |

### Files List

**Create:**
- `src/components/deals/ResearchTab.tsx`

**Rename:**
- `src/pages/ProposalCreator.tsx` → `src/pages/Research.tsx`

**Modify:**
- `src/lib/workspaceFeatures.ts`
- `src/components/layout/AppLayout.tsx`
- `src/pages/DealDetail.tsx`
- `src/hooks/useProposalReport.ts`
- `src/App.tsx`
- `src/pages/SuperiorReport.tsx` (update import if needed)
