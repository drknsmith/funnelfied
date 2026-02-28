

# Drag-and-Drop Calendar Items + Deal Interaction Calendar

## Overview

Two changes: (1) make the main Calendar page items draggable between days so dropping updates the `next_action_date` in the database, and (2) add a color-coded interaction calendar to the Deal Detail page showing all interactions for that deal.

---

## Part 1: Drag-and-Drop on Calendar Page

### What changes

Calendar items (deal follow-ups and contact follow-ups) become draggable. When you drag an item to a different day, the `next_action_date` for that deal or contact updates in the database immediately.

### Technical approach

**File: `src/pages/Calendar.tsx`**

- Add state for `draggingItem` and `dropTargetDate`
- Make each event button `draggable`, with `onDragStart` storing item ID, type, and current date
- Make each day cell a drop target with `onDragOver`, `onDrop`, `onDragEnter`, `onDragLeave`
- On drop, call `updateDeal` or `updateContact` mutation to set `next_action_date` to the new date
- Visual feedback: highlight the target day cell with a ring/border while dragging over it
- Add `cursor-grab` / `active:cursor-grabbing` to draggable items

**File: `src/hooks/useCalendarItems.ts`**

- No changes needed -- the hook already returns `type` (deal/contact) and `id`, which is enough to call the right mutation

**Mutations used:**
- `useDeals().updateDeal({ id, next_action_date })` for deal items
- `useContacts().updateContact({ id, next_action_date })` for contact items

Both hooks are already available and handle cache invalidation.

---

## Part 2: Deal Detail Interaction Calendar

### What changes

On the Deal Detail page, add a visual calendar in the right column (below PlaybookPanel) that highlights dates where interactions occurred. A color-coded legend appears above the calendar:

- **Blue** -- Past interactions (occurred before today)
- **Green** -- Upcoming interactions (scheduled for today or future)
- **Red** -- Missed interactions (past interactions with a `next_action_date` that was missed, or overdue scheduled items)

Actually, since interactions have an `occurred_at` date, the logic will be:
- **Blue** -- Interactions that already happened (`occurred_at` is before today)
- **Green** -- Interactions scheduled for today or in the future (`occurred_at` is today or later)
- **Red** -- Interactions where `next_action_date` was set but is in the past and no follow-up was logged (missed follow-ups)

The calendar uses the existing `<Calendar>` component (react-day-picker) with `modifiers` and `modifiersClassNames` to color specific dates.

### Technical approach

**File: `src/pages/DealDetail.tsx`**

- Add a new Card below the PlaybookPanel in the right column
- Show a legend with 3 colored dots and labels
- Render a `<Calendar>` component with:
  - `modifiers={{ past: pastDates, upcoming: upcomingDates, missed: missedDates }}`
  - `modifiersClassNames` mapping each modifier to the appropriate background color class
- Compute dates from the `interactions` array (already fetched via `useInteractions(id)`)
- Past = `occurred_at` before today
- Upcoming = `occurred_at` today or later
- Missed = deal's `next_action_date` is in the past and there's no interaction on that date

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Calendar.tsx` | Add HTML5 drag-and-drop on calendar items and day cells, call mutations on drop |
| `src/pages/DealDetail.tsx` | Add interaction calendar card with color-coded legend in right column |

No database changes needed -- all data already exists.

