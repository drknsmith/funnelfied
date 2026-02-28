

# Add "+ New Deal" Button to Account Detail Deals Section

## Overview
Add a "+ New Deal" button in the Deals card header on the Account Detail page. Clicking it navigates to the DealForm page (`/deals/new`) with the account pre-selected via a query parameter. The DealForm will read that parameter and auto-fill the account field.

## Changes

### 1. AccountDetail.tsx -- Add the button
- Add a `Plus` icon import
- Add a `Button` next to the "Deals (N)" card title that navigates to `/deals/new?account_id={id}`

### 2. DealForm.tsx -- Read account_id from URL params
- Import `useSearchParams`
- Read `account_id` from the query string on mount
- Pre-fill `formData.account_id` with that value when creating a new deal (not editing)
- This uses the exact same DealForm workflow as the main "New Deal" button, just with the account pre-selected

## Technical Details

**AccountDetail.tsx** (line ~295-299): Add button to CardHeader:
```tsx
<Button size="sm" onClick={() => navigate(`/deals/new?account_id=${id}`)}>
  <Plus className="mr-2 h-4 w-4" />
  New Deal
</Button>
```

**DealForm.tsx** (lines ~35-62): Read query param and use it as default:
```tsx
const [searchParams] = useSearchParams();
const preselectedAccountId = searchParams.get('account_id');

// In useState initializer, set account_id from preselectedAccountId
account_id: preselectedAccountId || '',
```

Also set the first stage from the dynamic `stages` array as default instead of hardcoded `'signal_target'`.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AccountDetail.tsx` | Add "+ New Deal" button to Deals card header |
| `src/pages/DealForm.tsx` | Read `account_id` query param and pre-fill account field |
