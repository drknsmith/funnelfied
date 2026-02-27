

# Add Phone and Email Fields to Accounts

## Overview

Add direct phone number and email address fields to the Account entity, independent of any contact. These fields will appear in both the Create/Edit Account dialog and on the Account Detail page.

## Changes

### 1. Database Migration

Add two new nullable text columns to the `accounts` table:
- `phone` (text, nullable)
- `email` (text, nullable)

### 2. Update Account Hook (`src/hooks/useAccounts.ts`)

Add `phone` and `email` to the `Account` interface so TypeScript recognizes the new fields.

### 3. Update Account Form Dialog (`src/components/accounts/AccountFormDialog.tsx`)

Add phone and email input fields to the form:
- Email input (type="email") with placeholder
- Phone input (type="tel") with placeholder
- Placed in a 2-column grid row after the Location field
- Include in form state, useEffect sync, and submit handler

### 4. Update Account Detail Page (`src/pages/AccountDetail.tsx`)

Display the phone and email in the "Account Details" card with clickable `mailto:` and `tel:` links, similar to how trainer contact info is displayed.

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `phone` and `email` columns to `accounts` |
| `src/hooks/useAccounts.ts` | Add fields to `Account` interface |
| `src/components/accounts/AccountFormDialog.tsx` | Add email and phone form inputs |
| `src/pages/AccountDetail.tsx` | Display email and phone with icons |

