## Editable signature names on the SOW

Today, the signature block lives inside the playbook's Terms and Conditions text, so the company name and contact name are baked in and can't be swapped per client. This plan adds per-SOW editable signatory fields and a dedicated signature block that renders after Terms and Conditions.

### 1. Add signature fields to the quote
New columns on `quotes` (all optional text):
- `sow_signature_provider_company` — defaults to "Red Loft Consulting"
- `sow_signature_provider_name` — defaults to `redloft_contact_name`
- `sow_signature_provider_title` — defaults to `redloft_contact_title`
- `sow_signature_client_company` — defaults to the account/project company
- `sow_signature_client_name` — defaults to `snapshot_contact_name`
- `sow_signature_client_title` — optional, blank by default

Defaults are only applied on first load if the field is empty, so edits stick.

### 2. New "Signatures" section at the bottom of the SOW form
In `QuoteDetail.tsx`, add a collapsible panel after Terms and Conditions with two side-by-side groups:

```text
Provider (Red Loft)          Client
-------------------          ------
Company [__________]         Company [__________]
Name    [__________]         Name    [__________]
Title   [__________]         Title   [__________]
```

Each input saves via the existing `save({...})` path. A small "Reset to defaults" link repopulates from the snapshot/contact fields.

### 3. Render the signature block in the SOW preview
In `QuotePreview.tsx`, after the Terms and Conditions section, render a two-column signature block:

```text
______________________          ______________________
Name / Title                    Name / Title
Company                         Company
Date: __________                Date: __________
```

Also append it to the "Copy as Markdown" output.

### 4. Playbook Terms and Conditions guidance
No schema change to playbooks. The playbook's T&C text should stop containing hard-coded signature lines; the signature block is now owned by the SOW. The `generate-sow` edge function already copies T&C verbatim — no change needed, but we'll trim any trailing `Signed by:` / `By:` lines from the copied T&C on the client side before display so old playbook text doesn't double up with the new block.

### Technical notes
- Migration adds the six `sow_signature_*` text columns to `quotes` (nullable, no default at DB level; defaults resolved in UI).
- No RLS changes — existing quote policies cover the new columns.
- `QuoteDetail.tsx`: new section + local state hydration with defaults.
- `QuotePreview.tsx`: new `<section>` after T&C, plus markdown export update.
- No changes to `generate-sow` or `suggest-milestones`.
