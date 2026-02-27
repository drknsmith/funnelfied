

# Make Playbook Optional for Treneur Workspace

## Overview

In the Treneur workspace, remove the requirement that a playbook must be assigned before advancing a deal to stages beyond "Signal Target." The playbook field will remain available but entirely optional.

## Changes

### 1. DealDetail.tsx - Skip playbook modal for Treneur

Currently, when moving from `signal_target` to any other stage without a playbook, a modal forces the user to pick one. For Treneur, skip this check and allow direct stage advancement.

- Import `isTreneurWorkspace` and get `workspaceId` from `useAuth()`
- Modify `handleStageChange`: only show the playbook modal if NOT Treneur workspace

### 2. DealForm.tsx - Remove playbook from validation for Treneur

Currently, `validateStageAdvance()` requires `playbook_id` for any stage past `signal_target`. For Treneur, skip this validation rule.

- Import `isTreneurWorkspace` and get `workspaceId` from `useAuth()`
- In `validateStageAdvance()`, wrap the `playbook_id` check: only enforce if NOT Treneur workspace

### 3. PlaybookPanel.tsx - Remove warning banner for Treneur

Currently shows a red "A playbook is required" warning when no playbook is assigned past Signal Target. For Treneur, hide this warning.

- Import `isTreneurWorkspace` and get `workspaceId` from `useAuth()`
- Change `needsPlaybook` logic: `const needsPlaybook = !isTreneur && !isSignalTarget && !deal.playbook_id`

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/DealDetail.tsx` | Conditionally skip playbook-required modal for Treneur |
| `src/pages/DealForm.tsx` | Skip `playbook_id` validation for Treneur |
| `src/components/deals/PlaybookPanel.tsx` | Hide "required" warning for Treneur |

