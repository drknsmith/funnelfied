

# Customize Account Form for Treneur Workspace

## What Changes

When the active workspace is Treneur, the Account create/edit form will show customized field labels and options:

1. **Segment dropdown** -- Replace "Enterprise / Mid-Market / SMB" with: Boutique Gym, Yoga Studio, Pilates Studio, Big Box Gym, Martial Arts/Boxing, Student Rec Center
2. **Default Deal Type** -- Rename to "Business Model" with options: Hire Trainers, Rent to Trainers, Hybrid
3. **Buying Motive** -- Rename to "Require Client Memberships" and change from a text input to three checkboxes: Yes, No, Unk (storing the selected value in the existing `buying_motive` column)

Non-Treneur workspaces keep the current fields unchanged.

## Technical Details

### No database changes needed
All three fields already exist as text columns (`segment`, `deal_type_default`, `buying_motive`) on the `accounts` table. The new values are just different dropdown/checkbox options stored in the same columns.

### File: `src/components/accounts/AccountFormDialog.tsx`

- Import `useAuth` and `isTreneurWorkspace` to detect workspace
- Define Treneur-specific constants:
  - `TRENEUR_SEGMENTS`: Boutique Gym, Yoga Studio, Pilates Studio, Big Box Gym, Martial Arts/Boxing, Student Rec Center
  - `TRENEUR_BUSINESS_MODELS`: Hire Trainers, Rent to Trainers, Hybrid
- Conditionally render:
  - Segment dropdown uses `TRENEUR_SEGMENTS` or default `SEGMENTS` based on workspace
  - "Default Deal Type" label becomes "Business Model" with `TRENEUR_BUSINESS_MODELS` options for Treneur
  - "Buying Motive" text input becomes "Require Client Memberships" with three radio-style checkboxes (Yes / No / Unk) for Treneur -- only one can be selected at a time, stored as the string value in `buying_motive`
- Import `Checkbox` component for the membership requirement field

| File | Change |
|------|--------|
| `src/components/accounts/AccountFormDialog.tsx` | Add workspace detection, conditional labels/options for Segment, Business Model, and Require Client Memberships |

