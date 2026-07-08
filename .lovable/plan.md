## Fix: "new row violates row-level security" on quote create

**Root cause:** `src/hooks/useQuotes.ts` uses `profile.workspace_id` for inserts. For a super_admin with a workspace override (you're viewing Red Loft while your profile lives in Superior), that sends `workspace_id = 000…0001` even though the deal belongs to Red Loft `54d6…ac1f`. RLS correctly rejects the row.

Project memory rule: **always use `workspaceId` from `useAuth()`**, never `profile.workspace_id`.

### Change
- In `src/hooks/useQuotes.ts`, replace `profile.workspace_id` with `workspaceId` from `useAuth()` in:
  - `createQuote` (insert `workspace_id: workspaceId`, and clone-items insert)
  - `useQuoteContractorItems.addItem`
  - the list `queryKey` and `enabled` gate
  - `useQuote` list gate

No DB migration, no policy change. Frontend-only fix.

### Files touched
- `src/hooks/useQuotes.ts`
