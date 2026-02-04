

# Fix: Update Superior Workspace ID

## Problem
The Research tab (in Deal pages) and Research sidebar link are not visible because the code contains a **placeholder workspace ID** that doesn't match your actual Superior Sales Pipeline workspace.

| Location | Current Value | Correct Value |
|----------|---------------|---------------|
| `src/lib/workspaceFeatures.ts` | `a2b9c8d7-e6f5-4a3b-9c8d-7e6f5a4b3c2d` | `00000000-0000-0000-0000-000000000001` |

---

## Solution
Update the `SUPERIOR_WORKSPACE_ID` constant to match your actual workspace ID.

---

## Files to Modify

**`src/lib/workspaceFeatures.ts`** (Line 4)

Change:
```typescript
export const SUPERIOR_WORKSPACE_ID = 'a2b9c8d7-e6f5-4a3b-9c8d-7e6f5a4b3c2d';
```

To:
```typescript
export const SUPERIOR_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
```

---

## Expected Result
After this change:
1. **Sidebar**: "Research" nav item will appear in the left menu (between Assets and Admin section) when logged into the Superior Sales Pipeline workspace
2. **Deal Detail**: "Research" tab will appear after "Details" tab on all deal pages in that workspace

---

## Technical Note
This is a one-line change that affects the workspace feature flag logic. The functions `canUseProposalCreator()`, `canUseResearch()`, and `isSuperiorWorkspace()` all depend on this constant.

