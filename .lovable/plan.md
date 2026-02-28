

# Change "Unk" to "Unknown"

A one-line change in `src/components/accounts/AccountFormDialog.tsx`.

## Technical Details

**File: `src/components/accounts/AccountFormDialog.tsx` (line 20)**

Update the `MEMBERSHIP_OPTIONS` constant from:
```ts
const MEMBERSHIP_OPTIONS = ['Yes', 'No', 'Unk'] as const;
```
to:
```ts
const MEMBERSHIP_OPTIONS = ['Yes', 'No', 'Unknown'] as const;
```

This will update both the label displayed and the value stored in the `buying_motive` column.

