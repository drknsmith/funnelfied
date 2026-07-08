## Move signature block after T&C Section 3 — Acceptance

Today the SOW preview renders the entire `sow_terms_and_conditions` text as one block, then appends the Signatures section underneath. The user's playbook T&C contains numbered sections, and Section 3 is "Acceptance"; the signature lines should appear right after that section, before any later sections (e.g., Section 4).

### 1. Split Terms & Conditions at the Acceptance section boundary

In `QuotePreview.tsx`, parse `termsAndConditions` to locate the Acceptance section and the following section:

```text
### 3. Acceptance
...

### 4. Limitation of Liability
...
```

Use a tolerant regex that matches common heading styles:
- `^\s*(?:###?\s*)?3[.\)]?\s*[-–—.]?\s*Acceptance\s*$`
- `^\s*Section\s+3[.:\)]?\s*Acceptance\s*$`

Then find the next numbered section heading after it (e.g., `4.`, `Section 4`, `### 4.`) to determine where Acceptance ends. Split the text into:
- `termsBeforeSignatures` — everything up to and including the Acceptance section
- `termsAfterSignatures` — any remaining sections after Acceptance

If no Acceptance section is found, fall back to the current behavior: signatures render after the full T&C block.

### 2. Update the SOW preview layout

Replace the single T&C + Signatures sequence with:

```text
Terms and Conditions
  <termsBeforeSignatures>

Signatures
  <provider signature block>
  <client signature block>

<termsAfterSignatures>   (only if Acceptance was found and followed by more sections)
```

### 3. Update "Copy as Markdown" export

Apply the same split logic in `copyMarkdown()` so the exported Markdown places the Signatures block after Section 3 Acceptance and before any following sections.

### 4. No database or edge-function changes

This is a client-side rendering change only. The `sow_terms_and_conditions` field stays a single text blob; we just split it at render/export time.

### Files changed
- `src/pages/QuotePreview.tsx`

### Edge cases handled
- T&C without an Acceptance section → signatures stay at the end.
- Acceptance is the last section → signatures follow it as the final element.
- Mixed heading styles (Markdown, plain text, "Section 3.") are detected with a combined regex.
