

# Fix: Calendar Date Issues

## Issues Identified

### Issue 1: Thursday Registering as Monday
**Root Cause**: Timezone conversion in date formatting

When generating schedule slots in `useSMScheduleSlots.ts`:
```typescript
const slotDate = addDays(addWeeks(weekStart, week), recurrenceRule.day_of_week);
const dateStr = format(slotDate, 'yyyy-MM-dd');
```

The `format()` function from date-fns interprets the date correctly in local time, BUT there's a known issue where dates can shift when:
- The `Date` object is created/manipulated in local time
- Comparison with database dates happens in UTC
- The user is in a timezone behind UTC (e.g., US Eastern, Pacific)

Database evidence confirms the bug:
- Campaign "Founder's Journey" has `day_of_week: 4` (Thursday)
- Slots are scheduled for `2026-02-02, 2026-02-09...` (Mondays!)
- These are 3 days off from Thursday

### Issue 2: Calendar Row Coloring
**Current Behavior**: Platform stripes show full color if a slot exists, regardless of actual content

**Desired Behavior**: 
- **Muted color** = slot exists but NO actual content scheduled
- **Full color** = actual post/content is scheduled

---

## Solution

### Part 1: Fix Date Handling with Local Time Formatting

**File: `src/hooks/useSMScheduleSlots.ts`**

Create a helper function that uses local date components instead of relying on format():

```typescript
// Use local date components to avoid timezone shifts
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

Update the slot generation (line 170):
```typescript
// Before
const dateStr = format(slotDate, 'yyyy-MM-dd');

// After  
const dateStr = toLocalDateString(slotDate);
```

Also update date parsing in `useSMCalendarData.ts` where dates are compared:

**File: `src/hooks/useSMCalendarData.ts`**

When processing content items with `override_date`, ensure consistent date string handling.

---

### Part 2: Distinguish "Has Slot" vs "Has Actual Content"

**File: `src/hooks/useSMCalendarData.ts`**

Update the `CalendarDayData` interface to track both:
```typescript
export interface CalendarDayData {
  date: string;
  platforms: {
    [key in SMPlatform]: {
      hasSlot: boolean;        // Slot exists (scheduled placeholder)
      hasContent: boolean;     // Actual content item linked
      campaignId: string | null;
      campaignColor: string | null;
      campaignName: string | null;
      contentCount: number;
      slotStatus: SlotStatus | null;
    };
  };
}
```

Update slot processing (around line 104):
```typescript
dayData.platforms[platform] = {
  hasSlot: true,           // Slot exists
  hasContent: false,       // No content yet (will be updated later)
  campaignId: slot.campaign_id,
  // ...
};
```

Update content processing (around line 158):
```typescript
dayData.platforms[platform].hasSlot = true;
dayData.platforms[platform].hasContent = true;  // Actual content exists
dayData.platforms[platform].contentCount++;
```

**File: `src/components/social-media/PlatformStripes.tsx`**

Update styling logic:
```typescript
const hasSlot = platformData?.hasSlot || false;
const hasContent = platformData?.hasContent || false;

// Styling:
// - hasContent = full campaign color
// - hasSlot but !hasContent = muted color (20% opacity)
// - !hasSlot = dashed border (empty)

<div
  className={cn(
    'flex items-center gap-1 rounded px-1 transition-all',
    compact ? 'h-4' : 'h-5',
    hasSlot && !hasContent && 'border border-dashed', // Slot only
    (hasSlot || hasContent) && 'cursor-pointer',
    !hasSlot && !hasContent && 'border border-dashed border-muted-foreground/30',
    onStripeClick && 'hover:ring-1 hover:ring-primary/50'
  )}
  style={
    hasContent && campaignColor
      ? { backgroundColor: `${campaignColor}CC` }  // Full color (80% opacity)
      : hasSlot && campaignColor
        ? { backgroundColor: `${campaignColor}33`, borderColor: campaignColor }  // Muted (20% opacity)
        : undefined
  }
>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSMScheduleSlots.ts` | Add `toLocalDateString()` helper, use for slot dates |
| `src/hooks/useSMCalendarData.ts` | Add `hasSlot` field, distinguish from `hasContent` |
| `src/components/social-media/PlatformStripes.tsx` | Update styling for slot vs content states |
| `src/components/social-media/CalendarDayView.tsx` | Update references to new `hasSlot` field |
| `src/components/social-media/CalendarWeekView.tsx` | Update references to new `hasSlot` field |

---

## Technical Details

### Date Helper Function
```typescript
/**
 * Format a Date object to YYYY-MM-DD string using local time components.
 * This avoids timezone issues that occur with toISOString() or date-fns format().
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### Color States

| State | Appearance |
|-------|------------|
| No slot, no content | Dashed border, muted foreground |
| Slot only (placeholder) | Muted campaign color (20% opacity), dashed border |
| Has actual content | Full campaign color (80% opacity), solid fill |

---

## Expected Results

1. **Campaign day selection works correctly**: Thursday campaigns appear on Thursday, not Monday
2. **Visual distinction**: Users can see at a glance which slots have actual content vs just placeholders
3. **Timezone consistency**: Dates display correctly regardless of user timezone

