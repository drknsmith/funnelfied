
# Replace Segment Column with Business Model

Since segment is already shown under the account name, the standalone Segment column is redundant. Replace it with Business Model (stored in `deal_type_default`).

## Technical Details

**File: `src/pages/Accounts.tsx`**

Two changes:

1. **Line 129** -- Change the column header from "Segment" to "Business Model"
2. **Line 148** -- Change the cell value from `account.segment` to `account.deal_type_default`, with the same `replace('_', '-')` formatting used on the detail page

| Line | Before | After |
|------|--------|-------|
| 129 | `Segment` | `Business Model` |
| 148 | `account.segment \|\| '-'` | `account.deal_type_default?.replace('_', '-') \|\| '-'` |
