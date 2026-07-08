
## Make Client & Project fields editable

The "Client & Project" card in `src/pages/QuoteDetail.tsx` currently uses a read-only `<Field>` component that just displays snapshot values. If a contact has no email/phone when the quote is created, those fields stay blank with no way to fix them.

Replace the five `<Field>` reads with editable `<Input>`s bound via `save({ ... })`, matching the pattern used in the new Red Loft Contact card:
- Contact Name → `snapshot_contact_name`
- Contact Email → `snapshot_contact_email` (type=email)
- Contact Phone → `snapshot_contact_phone`
- Project Name → `snapshot_project_name`
- Project Address → `snapshot_project_address`

Keep the 2-column grid layout. The `Field` helper can stay in the file if used elsewhere; otherwise it becomes dead code (safe to leave).

### Files changed
- `src/pages/QuoteDetail.tsx`
