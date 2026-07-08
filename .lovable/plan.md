
## Add Red Loft Contact to quotes

### Database
Add 4 nullable text columns to `public.quotes`:
- `redloft_contact_name`
- `redloft_contact_title`
- `redloft_contact_email`
- `redloft_contact_phone`

### `src/hooks/useQuotes.ts`
Add the 4 fields to the `Quote` interface (`string | null`).

### `src/pages/QuoteDetail.tsx`
On the **SOW tab only**, insert a new Card above "Client & Project":
- Title: "Red Loft Contact"
- 2-col grid with Inputs bound via `save({ ... })`: Red Loft Contact Name, Title, Email, Phone Number.

### `src/pages/QuotePreview.tsx`
In the header grid (currently Prepared For / Project), add a third block "Red Loft Contact" showing name, title, email, phone. Render on **both** SOW and Invoice. Convert the header grid from `grid-cols-2` to `grid-cols-3`.

### Files changed
- new migration
- `src/hooks/useQuotes.ts`
- `src/pages/QuoteDetail.tsx`
- `src/pages/QuotePreview.tsx`
