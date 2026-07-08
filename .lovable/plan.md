Make the "Assigned Playbook" field optional throughout the Deals flow by removing the asterisk and all enforcement that currently requires it for non-Signal Target deals.

### Changes
1. **DealForm.tsx**
   - Remove the conditional `*` next to the "Assigned Playbook" label.
   - Remove the validation check that adds "Assigned Playbook" to the missing-fields list when `playbook_id` is empty.

2. **DealDetail.tsx**
   - Remove or relax the stage-advancement guard that blocks moving a deal out of `signal_target` when no playbook is assigned.

3. **PlaybookPanel.tsx**
   - Remove the "A playbook is required for deals past Signal Target stage" warning banner.
   - Keep the playbook selector functional so users can still assign one voluntarily.

4. **StageValidationModal.tsx** (if it contains playbook-related enforcement)
   - Review and remove any playbook requirement logic.

### Outcome
Users can create, edit, and advance deals without being forced to select an Assigned Playbook, while the selector remains available for optional use.