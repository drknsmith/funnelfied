## Problem

Saving the Service Knowledge Playbook fails with:
`new row violates row-level security policy for table "playbooks"`.

## Root cause

The `playbooks` INSERT policy requires:
- `workspace_id = private.current_workspace()`, AND
- `owner_user_id = auth.uid()`

`private.current_workspace()` reads `super_admin_workspace_overrides` and falls back to `profiles.workspace_id`. For super admins who have never explicitly switched workspaces there is no override row, and the fallback path is fragile. In this case it is returning NULL under the client's auth context even though `profiles.workspace_id` is set to the Superior workspace, so the INSERT check fails.

Additionally, `src/pages/ServiceKnowledgePlaybookForm.tsx` and `src/hooks/usePlaybooks.ts` read `profile?.workspace_id` directly instead of `workspaceId` from `useAuth()` — this violates the project's Core memory rule and is the same class of bug that has bitten other modules.

## Fix

1. **AuthContext**: when a super admin loads and has no `super_admin_workspace_overrides` row, upsert one using the effective workspace (override → profile.workspace_id → first available workspace). This guarantees `private.current_workspace()` returns a value on every subsequent request.

2. **ServiceKnowledgePlaybookForm.tsx**: replace `profile?.workspace_id` with `workspaceId` from `useAuth()` for the query, enable flag, and insert payload. Also set `owner_user_id: user.id` and `created_by`/`updated_by` from `useAuth()`.

3. **usePlaybooks.ts**: same swap — use `workspaceId` from `useAuth()` instead of `profile?.workspace_id`, so listing and creation stay consistent with the active workspace (important for super admins switching workspaces).

4. Verify by saving the Service Knowledge Playbook end-to-end (create + update path) and confirming the row appears scoped to the correct workspace.

No database migration is required; the existing RLS policies are correct once `current_workspace()` returns a value.
