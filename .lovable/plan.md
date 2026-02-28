
# Add "Corporate Wellness" Segment Option

A one-line change in `src/components/accounts/AccountFormDialog.tsx`.

## Technical Details

**File: `src/components/accounts/AccountFormDialog.tsx` (line 15)**

Update `TRENEUR_SEGMENTS` to include "Corporate Wellness":

```ts
// Before
const TRENEUR_SEGMENTS = ['Boutique Gym', 'Yoga Studio', 'Pilates Studio', 'Big Box Gym', 'Martial Arts/Boxing', 'Student Rec Center'];

// After
const TRENEUR_SEGMENTS = ['Boutique Gym', 'Yoga Studio', 'Pilates Studio', 'Big Box Gym', 'Martial Arts/Boxing', 'Student Rec Center', 'Corporate Wellness'];
```
