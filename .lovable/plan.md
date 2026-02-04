
# Add Deal Name Searchable Dropdown to Research

## Overview
Add a new "Deal Name" input field to the Research tool that:
1. Shows as a searchable dropdown when accessing Research from the sidebar menu
2. Auto-fills from the current deal when accessing Research from a Deal page (not editable)
3. Keeps Community Name separate and user-editable in both contexts

---

## Current vs. New Behavior

| Context | Current | New |
|---------|---------|-----|
| Sidebar → Research | No deal association | Searchable deal dropdown, when selected auto-populates Community Address from deal's account location |
| Deal → Research Tab | Community Name auto-filled from Deal Name | Deal Name auto-filled (read-only), Community Name left blank for user input |

---

## Implementation Plan

### 1. Create Deal Search Select Component

**New file: `src/components/deals/DealSearchSelect.tsx`**

Similar to `AccountSearchSelect.tsx`:
- Searchable dropdown using `Command` component
- Filters deals as user types
- Returns selected deal ID and deal object
- Displays deal name with optional account name

### 2. Update ProposalInputPanel

**Modify: `src/components/proposal/ProposalInputPanel.tsx`**

Add new props:
```typescript
interface ProposalInputPanelProps {
  // New props
  dealId?: string;
  setDealId?: (value: string) => void;
  dealName?: string;
  isEmbeddedInDeal?: boolean;  // When true, hides deal selector
  // ... existing props
}
```

Add Deal Name field in the form:
- When `isEmbeddedInDeal=true`: Show read-only text with deal name
- When `isEmbeddedInDeal=false`: Show searchable DealSearchSelect dropdown

### 3. Update Research Page (Standalone)

**Modify: `src/pages/Research.tsx`**

- Add `selectedDealId` state
- Pass deal selector props to `ProposalInputPanel`
- When deal is selected, fetch deal data and optionally auto-fill Community Address from account location
- Link saved report to selected deal via `dealId`

### 4. Update ResearchTab (Embedded in Deal)

**Modify: `src/components/deals/ResearchTab.tsx`**

- Pass `isEmbeddedInDeal=true` to `ProposalInputPanel`
- Pass `dealName` for read-only display
- Change pre-population: Community Name stays blank (not filled from deal name)
- Community Address still pre-fills from account location

### 5. Update Report Saving

**Modify: `src/hooks/useProposalReport.ts`**

- Ensure `saveReport` accepts optional `dealId`
- Already implemented - just needs to be passed from standalone Research page

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/deals/DealSearchSelect.tsx` | Create | New searchable deal dropdown component |
| `src/components/proposal/ProposalInputPanel.tsx` | Modify | Add Deal Name field (dropdown or read-only) |
| `src/pages/Research.tsx` | Modify | Add deal selection state and auto-population logic |
| `src/components/deals/ResearchTab.tsx` | Modify | Pass embedded flag, keep Community Name blank |

---

## Component Structure

```text
Research.tsx (Standalone)
├── selectedDealId state
├── Fetch deal data on selection
└── ProposalInputPanel
    ├── Deal Name: DealSearchSelect dropdown
    ├── Community Name: text input (blank)
    ├── Community Address: auto-filled from deal's account
    └── ... other fields

ResearchTab.tsx (Embedded in Deal)
└── ProposalInputPanel
    ├── Deal Name: read-only text (from dealName prop)
    ├── Community Name: text input (blank - user fills)
    ├── Community Address: auto-filled from account
    └── ... other fields
```

---

## UI Layout Update

Current ProposalInputPanel layout:
```text
[Community Name] [Community Address]
[Units] [Property Class] [SF Override]
```

New layout:
```text
[Deal Name (dropdown/readonly)]
[Community Name] [Community Address]
[Units] [Property Class] [SF Override]
```

---

## Technical Details

### DealSearchSelect Component

```typescript
interface DealSearchSelectProps {
  value: string;
  onValueChange: (dealId: string, deal?: DealWithRelations) => void;
  disabled?: boolean;
}
```

Features:
- Uses `useDeals()` hook to fetch available deals
- Filters by typed search text
- Returns both deal ID and full deal object for auto-population

### Auto-population Logic

When deal is selected from dropdown in standalone Research:
```typescript
const handleDealChange = (dealId: string, deal?: DealWithRelations) => {
  setSelectedDealId(dealId);
  if (deal?.accounts?.location) {
    setCommunityAddress(deal.accounts.location);
  }
};
```

### ResearchTab Changes

```typescript
// Before (current)
if (dealName) setCommunityName(dealName);

// After (new)
// Don't pre-fill communityName - leave blank for user input
// dealName is shown in read-only Deal Name field
```
