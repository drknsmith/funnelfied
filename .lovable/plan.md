

# Make Primary Stakeholder Optional for Treneur Workspace

## Overview

Remove the requirement for a primary stakeholder (contact) when creating or advancing deals in the Treneur workspace. The field remains available but is never mandatory.

## Changes

### 1. DealForm.tsx - Skip primary_contact_id validation for Treneur

**File: `src/pages/DealForm.tsx`**

- **Line 128**: Wrap the `primary_contact_id` check so it only applies when NOT Treneur:
  ```
  if (!isTreneur && !formData.primary_contact_id) missing.push(...)
  ```
- **Line 317**: Remove the `*` asterisk from the "Primary Stakeholder" label for Treneur by changing the condition to also check `!isTreneur`

### 2. DealFormDialog.tsx - No changes needed

The dialog already treats `primary_contact_id` as optional (no Zod required rule, placeholder says "optional"). No changes required here.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/DealForm.tsx` | Skip `primary_contact_id` validation + remove asterisk for Treneur |

