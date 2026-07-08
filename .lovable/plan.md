# Enable Research for Red Loft Consulting

Currently the Research page (`/research`) is gated to the Superior workspace only. Extend access to include **Red Loft Consulting** (`54d6d4a3-75f1-4e5c-9d36-945c1643ac1f`).

## Technical Changes

**File: `src/lib/workspaceFeatures.ts`**

1. Add constant:
   ```ts
   export const REDLOFT_WORKSPACE_ID = '54d6d4a3-75f1-4e5c-9d36-945c1643ac1f';
   export function isRedLoftWorkspace(workspaceId?: string | null): boolean {
     return workspaceId === REDLOFT_WORKSPACE_ID;
   }
   ```
2. Update `canUseResearch` to return true for either Superior or Red Loft:
   ```ts
   export function canUseResearch(workspaceId?: string | null): boolean {
     return isSuperiorWorkspace(workspaceId) || isRedLoftWorkspace(workspaceId);
   }
   ```

This automatically enables:
- The `/research` route access (guard in `src/pages/Research.tsx`)
- Any nav link / entry point that uses `canUseResearch`
- Research tab embedded in deals (if it uses the same helper)

No changes needed to `Research.tsx`, routes, or the algorithm — the gating is centralized.

## Out of Scope

- No changes to Superior-specific branding within the Research output (report still uses same algorithm/labels). If Red Loft needs different branding on the report, that's a follow-up.
