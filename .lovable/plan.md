
## Goal

Replace the current per-field "Polish with AI" model with a single AI trigger tied to **Generate SOW PDF**. On click, the AI receives the entire form state at once plus the full Service Knowledge Playbook, and produces the whole SOW body (Executive Summary, Problem Statement, Proposed Approach, Deliverables, Milestones, Terms & Conditions) in one cross-referenced pass. Rate & Billing Terms is never AI-touched.

## One assumption to confirm

The three freeform fields on the SOW editor — **Executive Summary**, **Problem Statement**, **Proposed Approach** — will stay in the editor as optional "salesperson notes" inputs. Generate SOW PDF will rewrite/expand whatever's there, or draft from scratch off the structured fields if left blank. If you want them removed entirely and everything generated from structured fields only, say so and I'll adjust the merge rule.

## Changes

### 1. QuoteDetail editor (`src/pages/QuoteDetail.tsx`)
- Remove the three per-field `PolishButton` instances and the `polish()` helper, `polishing` state, and `PolishButton` component itself.
- Keep the Executive Summary / Problem Statement / Proposed Approach textareas as-is (salesperson notes) with updated placeholder copy ("Optional notes — the AI will expand and polish this when you Generate SOW PDF").
- Keep the 4 P's pillar checkboxes; they are an emphasis instruction, distinct from Opportunity Type.
- Keep the Deliverables and Milestones manual-add rows; they now feed the AI as primary content to refine (or the AI generates them when empty).
- Change the "Generate SOW PDF" button to first call the new edge function, persist the AI output back onto the quote, then navigate to `/quotes/:id/preview?doc=sow`. Show a loading spinner while generating and toast on error (429 / 402 surfaced clearly).

### 2. New edge function `generate-sow` (replaces `polish-sow-field`)
- Input: `{ quoteId, workspaceId }`. Loads the quote, the full playbook (all sections including `terms_and_conditions`), and all `service_category` details in one go.
- Builds a single prompt containing:
  - Every structured field across Engagement, Design Details, Programming Details, Policy Details.
  - The three freeform notes (if any) as primary content to expand.
  - Existing Deliverables / Milestones rows (if any) as primary content to refine.
  - Full Service Knowledge Playbook as the structural/consistency backstop.
  - The section-to-repository mapping and merge rules from your spec (notes are primary; repository never verbatim; multi-component engagements group by component; funding-source-status cross-links to Engagement Type framing; compliance drivers trigger the ADA/non-architectural disclaimer worded to the specific driver; atypical pairings get flagged back rather than silently generated).
- Model: `google/gemini-2.5-pro` via Lovable AI Gateway (large context, cross-section reasoning), structured JSON output with a schema of `{ executive_summary, problem_statement, proposed_approach, deliverables: [{name, description}], milestones: [{name, description, target_date}], terms_and_conditions, warnings: [string] }`.
- Writes the returned fields back to the `quotes` row (adds a new `sow_terms_and_conditions` column). Returns `{ warnings }` to the client so atypical-pairing flags can toast.
- Delete `supabase/functions/polish-sow-field/index.ts` and its `supabase/config.toml` entry.

### 3. Database
- Add `sow_terms_and_conditions text` to `quotes` (nullable). Populated by the AI, rendered verbatim in the preview.

### 4. Preview (`src/pages/QuotePreview.tsx`)
- Add a **Terms and Conditions** section at the end of the SOW body, rendering `quote.sow_terms_and_conditions` when present.
- Include it in the "Copy as Markdown" output.
- Rate & Billing Terms section stays exactly as-is (form inputs only, no AI, no calculated total).

### 5. Playbook already has `terms_and_conditions`
- Confirmed added in prior turn — no schema change needed there. The edge function reads it and asks the AI to adapt it to the specific engagement (or emit verbatim if the playbook value is a hard legal block — the prompt will instruct "use playbook terms_and_conditions as the source; only lightly adapt scope-specific references, do not rewrite legal language").

## Technical notes

- The `Generate SOW PDF` flow becomes: click → button shows spinner → invoke `generate-sow` → on success, invalidate the quote query so the preview reads fresh AI-written fields → navigate to preview. On failure, stay on the editor with an error toast.
- Warnings array is surfaced as a non-blocking toast (e.g. "Design + Retainer is atypical — add rolling-pipeline justification to notes or switch Engagement Type").
- Cost: one Gemini 2.5 Pro call per Generate SOW PDF click. Salesperson can re-click to regenerate.
