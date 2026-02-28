

# Fix Account Display Fields

## Changes

### 1. Accounts list page (`src/pages/Accounts.tsx`)
- **Line 144**: Change the subtitle under the account name from `buying_motive` to `segment` so it shows the segment (e.g., "Boutique Gym") instead of the membership answer.

### 2. Account Detail page (`src/pages/AccountDetail.tsx`)
- Update the "Account Details" card (lines 124-165) to show Treneur-specific labels when in the Treneur workspace:
  - "Portfolio Size" stays the same
  - "Default Deal Type" becomes **"Business Model"**
  - "Buying Motive" becomes **"Require Client Memberships"**
  - Add **"Segment"** as a visible field in the details card
  - Add **"Status"** field (currently only shown in the header badge, will also appear in the details grid for completeness)
- Non-Treneur workspaces keep existing labels unchanged.

### Technical Details

| File | Change |
|------|--------|
| `src/pages/Accounts.tsx` | Line 144: Replace `account.buying_motive` with `account.segment` for the subtitle text |
| `src/pages/AccountDetail.tsx` | Lines 124-165: Add `isTreneurWorkspace` conditional to swap field labels; add Segment and Status fields to the details grid |

