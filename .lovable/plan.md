
## 1. Client & Project section — contact dropdown

Replace the editable Contact Name/Email/Phone inputs in `src/pages/QuoteDetail.tsx` with a single "Contact" `<Select>` populated with all contacts on the quote's associated account. Selecting a contact:
- Writes `contact_id` on the quote
- Snapshots the contact's name/email/phone into `snapshot_contact_name/email/phone`

Below the select, render name/email/phone as read-only display lines (the snapshot values).

Project Name and Project Address stay as editable inputs (no source of truth to auto-fill from).

**Data plumbing**
- Update `useQuote` in `src/hooks/useQuotes.ts` to include `account_id` on the joined deal: `deals(id, deal_name, account_id, accounts(name))`.
- Use existing `useContacts(accountId)` to fetch account contacts.

## 2. PDF header order

In `src/pages/QuotePreview.tsx`, reorder the 3-column header grid to: **Red Loft Contact → Prepared For → Project**. "Prepared For" continues to render `snapshot_contact_name / email / phone`.

### Files changed
- `src/hooks/useQuotes.ts`
- `src/pages/QuoteDetail.tsx`
- `src/pages/QuotePreview.tsx`
