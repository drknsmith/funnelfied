

# Add Drag-and-Drop and Card Styling to Treneur Pipeline

## Overview

The Deals pipeline page (`Deals.tsx`) currently renders deal cards inline without drag-and-drop support. We need to add drag-and-drop between pipeline columns so moving a card updates the deal's stage in the database (reflecting on the Deal Detail stage progression). We also need to restyle cards with a gray background and blue outline on hover.

## Changes

### 1. Deals.tsx -- Add drag-and-drop state and handlers

**File: `src/pages/Deals.tsx`**

- Add `useState` for `draggingDealId` tracking
- Add `handleDragStart`, `handleDragOver`, `handleDrop` functions
- `handleDrop` calls `updateDeal` mutation to persist the new stage to the database
- Replace the inline column rendering with drag-event-aware containers (similar to `StageColumn` pattern but inline)
- Add `onDragEnter`/`onDragLeave` state for visual drop-target highlighting

### 2. Deals.tsx -- Restyle deal cards

- Change card class from `hover:shadow-md` to gray background with blue hover outline:
  - Base: `bg-muted/50` (gray tint)
  - Hover: `hover:ring-2 hover:ring-primary hover:ring-offset-1` (blue outline)
- Make cards `draggable` with `cursor-grab` / `active:cursor-grabbing`
- Add `opacity-50` when the card is being dragged

### 3. DealCard.tsx -- Match card styling (consistency)

- Update the existing `DealCard` component (used elsewhere) to also use the gray background + blue hover outline pattern, keeping visual consistency across the app.

## Technical Detail

The drag-and-drop uses native HTML5 drag events (already the pattern in `StageColumn.tsx` and `DealCard.tsx`). On drop, we call `updateDeal({ id, stage: newStage })` which persists to the database. Since the Deal Detail page reads the deal's `stage` field from the same database, the stage progression timeline will automatically reflect the change on next load.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Deals.tsx` | Add drag-and-drop handlers, update card styling |
| `src/components/deals/DealCard.tsx` | Update card styling to match (gray bg, blue hover outline) |

