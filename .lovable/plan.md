

# Add Monthly Frequency to Campaign Scheduling

## Overview

Add a "Monthly" frequency option that allows users to specify:
1. **Which week of the month** (Week 1, 2, 3, or 4)
2. **Which day of the week** (Sunday through Saturday)

This enables scheduling like "First Monday of every month" or "Third Friday of every month".

---

## Current State

**Constants (`socialMediaConstants.ts`):**
```tsx
RECURRENCE_FREQUENCIES = ['weekly', 'biweekly', 'custom']
```

**RecurrenceRule Interface:**
```tsx
interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  day_of_week: number;      // 0-6 (Sun-Sat)
  custom_days?: number[];   // For custom frequency
}
```

**Database:** `recurrence_rule` is stored as JSONB, so no migration needed - just extend the TypeScript interface.

---

## Solution

### 1. Update Constants

**File: `src/lib/socialMediaConstants.ts`**

Add 'monthly' to frequencies and add week_of_month options:

```tsx
export const RECURRENCE_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'custom'] as const;

export const WEEKS_OF_MONTH = [
  { value: 1, label: 'Week 1 (1st-7th)' },
  { value: 2, label: 'Week 2 (8th-14th)' },
  { value: 3, label: 'Week 3 (15th-21st)' },
  { value: 4, label: 'Week 4 (22nd-28th)' },
] as const;

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  day_of_week: number;        // 0-6 (Sun-Sat)
  week_of_month?: number;     // 1-4 for monthly frequency
  custom_days?: number[];     // For custom frequency
}
```

---

### 2. Update Campaign Form

**File: `src/components/social-media/CampaignForm.tsx`**

Add week selector that appears when "Monthly" is selected:

```tsx
// Add state
const [weekOfMonth, setWeekOfMonth] = useState(1);

// In useEffect when loading campaign
if (campaign?.recurrence_rule.week_of_month) {
  setWeekOfMonth(campaign.recurrence_rule.week_of_month);
}

// Conditionally show week picker when monthly is selected
{frequency === 'monthly' && (
  <div className="space-y-2">
    <Label>Week of Month</Label>
    <Select value={String(weekOfMonth)} onValueChange={(v) => setWeekOfMonth(parseInt(v))}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {WEEKS_OF_MONTH.map((w) => (
          <SelectItem key={w.value} value={String(w.value)}>
            {w.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}

// Update recurrence rule creation
const recurrenceRule: RecurrenceRule = {
  frequency,
  day_of_week: dayOfWeek,
  ...(frequency === 'monthly' && { week_of_month: weekOfMonth }),
};
```

**Layout change:** Use a responsive grid that shows:
- Weekly/Biweekly: Frequency + Day (2 columns)
- Monthly: Frequency + Week + Day (3 columns or stacked on mobile)

---

### 3. Update Slot Generation Logic

**File: `src/hooks/useSMScheduleSlots.ts`**

Modify `generateSlotsForCampaign` to handle monthly frequency:

```tsx
const generateSlotsForCampaign = async (
  campaignId: string,
  platforms: SMPlatform[],
  recurrenceRule: RecurrenceRule,
  monthsAhead: number = 12  // Generate 12 months of slots
) => {
  const slots: CreateSlotInput[] = [];
  
  if (recurrenceRule.frequency === 'monthly') {
    // Monthly: Find the Nth occurrence of day_of_week in each month
    for (let monthOffset = 0; monthOffset < monthsAhead; monthOffset++) {
      const targetDate = getNthWeekdayOfMonth(
        new Date(),
        monthOffset,
        recurrenceRule.day_of_week,
        recurrenceRule.week_of_month || 1
      );
      
      if (targetDate) {
        const dateStr = toLocalDateString(targetDate);
        for (const platform of platforms) {
          slots.push({
            campaign_id: campaignId,
            scheduled_date: dateStr,
            platform,
            status: 'planned',
          });
        }
      }
    }
  } else {
    // Existing weekly/biweekly logic
    // ...
  }
};

// Helper function to get Nth weekday of month
function getNthWeekdayOfMonth(
  baseDate: Date,
  monthOffset: number,
  dayOfWeek: number,  // 0-6
  weekOfMonth: number // 1-4
): Date | null {
  const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  
  // Find first occurrence of the target day of week
  let firstOccurrence = new Date(targetMonth);
  while (firstOccurrence.getDay() !== dayOfWeek) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1);
  }
  
  // Add weeks to get to the Nth occurrence
  const targetDate = new Date(firstOccurrence);
  targetDate.setDate(targetDate.getDate() + (weekOfMonth - 1) * 7);
  
  // Verify it's still in the same month
  if (targetDate.getMonth() !== targetMonth.getMonth()) {
    return null; // Week 4 of short months might overflow
  }
  
  return targetDate;
}
```

---

### 4. Update Campaign List Display

**File: `src/components/social-media/CampaignList.tsx`**

Show week info for monthly campaigns in the "Default Day" column:

```tsx
<TableCell>
  {recurrence.frequency === 'monthly' ? (
    <>
      Week {recurrence.week_of_month || 1}, {dayOfWeek?.label || '-'}
    </>
  ) : (
    dayOfWeek?.label || '-'
  )}
</TableCell>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/socialMediaConstants.ts` | Add 'monthly' to frequencies, add `WEEKS_OF_MONTH`, extend `RecurrenceRule` interface |
| `src/components/social-media/CampaignForm.tsx` | Add week selector UI, handle monthly frequency state |
| `src/hooks/useSMScheduleSlots.ts` | Add monthly slot generation logic with `getNthWeekdayOfMonth` helper |
| `src/components/social-media/CampaignList.tsx` | Display week info for monthly campaigns |

---

## User Experience

### Create Campaign Flow
1. User selects "Monthly" from Frequency dropdown
2. A "Week of Month" selector appears with options:
   - Week 1 (1st-7th)
   - Week 2 (8th-14th)
   - Week 3 (15th-21st)
   - Week 4 (22nd-28th)
3. User selects day of week (e.g., "Monday")
4. Result: "First Monday of every month" schedule

### Visual Example

```
Frequency:    [Monthly ▾]
Week:         [Week 2 (8th-14th) ▾]
Day:          [Thursday ▾]

→ Creates slots for "Second Thursday of every month"
```

---

## Edge Cases Handled

1. **Week 4 overflow**: Some months may not have a 4th occurrence of certain days (e.g., 4th Saturday in February). The helper function returns `null` and skips that month.

2. **Existing campaigns**: The `week_of_month` field is optional, so existing weekly/biweekly campaigns continue working.

3. **Edit mode**: When editing a monthly campaign, the week selector loads the saved `week_of_month` value.

