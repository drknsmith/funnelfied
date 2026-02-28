

# Interactive Color-Coded Calendar with Actions

## Problem
1. The Deal Detail calendar doesn't show upcoming events from `next_action_date` -- it only shows past interaction dates
2. Calendar dates aren't clickable -- no way to mark events as completed or delete them
3. The main Calendar page lacks the same color coding (blue/green/red) as the Deal Detail page

## Solution

### Part 1: Fix Deal Detail Calendar to show upcoming events

The `InteractionCalendarCard` will be updated to:
- Show the deal's `next_action_date` as a **green** (upcoming) date on the calendar
- Show interaction `next_action_date` values as upcoming green dates when they're in the future
- Keep blue for past interactions and red for missed ones

### Part 2: Make Deal Detail calendar dates clickable

When clicking a colored date on the Deal Detail calendar, a popover will appear showing:
- The event details (interaction summary or next action text)
- A **"Completed"** button -- logs the interaction as completed (turns the date blue) by creating an interaction record with `occurred_at` set to that date, and clears the `next_action_date` from the deal
- A **"Delete"** button -- removes the next action date from the deal (clears it entirely)

### Part 3: Add color coding + click actions to main Calendar page

The main Calendar page will get:
- Updated legend to include blue (Past/Completed), green (Upcoming), and red (Missed/Overdue) indicators
- Color coding on calendar event items: blue for past completed items, green for upcoming, red for overdue (past date, still open)
- When clicking an event, the detail panel will show **"Completed"** and **"Delete"** buttons
  - **Completed**: Clears `next_action_date` from the deal/contact (marks it done), creating an interaction if it's a deal
  - **Delete**: Clears `next_action_date` entirely

### Data flow synchronization
Both pages query the same underlying data (`deals.next_action_date`, `interactions`), so completing or deleting on either page will automatically reflect on the other after cache invalidation via React Query.

## Technical Details

### Files to modify

| File | Change |
|------|--------|
| `src/pages/DealDetail.tsx` | Update `InteractionCalendarCard`: add deal `next_action_date` to green dates; make dates clickable via Popover showing event info + Completed/Delete buttons; Completed creates interaction + clears next_action_date; Delete clears next_action_date |
| `src/pages/Calendar.tsx` | Update legend to blue/green/red; update `getEventClassName` to use blue for past, green for upcoming, red for overdue; add Completed + Delete buttons to selected item panel; Completed clears next_action_date + creates interaction; Delete clears next_action_date |
| `src/hooks/useCalendarItems.ts` | No changes needed -- already returns all required data |

### Color scheme (unified across both pages)
- **Blue** -- Past/Completed interactions (occurred_at before today)
- **Green** -- Upcoming actions (next_action_date today or future)
- **Red** -- Missed/Overdue (next_action_date in the past, no interaction recorded)

### Completed action workflow
1. When user clicks "Completed" on a deal event:
   - Call `createInteraction` with `{ deal_id, type: 'follow_up', summary: next_action, occurred_at: that_date }`
   - Call `updateDeal({ id, next_action_date: null, next_action: null })`
   - Invalidate both `interactions` and `deals` query caches
2. When user clicks "Completed" on a contact event:
   - Call `updateContact({ id, next_action_date: null, next_action: null })`
3. When user clicks "Delete":
   - Call `updateDeal/updateContact({ id, next_action_date: null, next_action: null })`

