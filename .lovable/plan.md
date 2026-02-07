

# Ensure Monthly Campaign Colors Display Correctly on All Calendar Views

## Analysis

After reviewing the code, the monthly frequency logic is correctly implemented. The system already:
1. Creates schedule slots via `generateSlotsForCampaign` with `campaign_id` attached
2. Fetches slots in `useSMCalendarData` and maps `campaignColor` from the campaign
3. Applies color styling in each view component

The monthly slots will display with the same color treatment as weekly/biweekly campaigns because they all use the same `campaign_id` → `campaignColor` mapping.

However, there are **visual consistency issues** across views that should be addressed:

| View | Content Color | Slot-Only Color | Issue |
|------|--------------|-----------------|-------|
| Month (PlatformStripes) | 80% opacity (`CC`) | 20% opacity (`33`) | Good contrast |
| Week | 12% opacity (`20`) | 3% opacity (`08`) | Very subtle - hard to see |
| Day | No background | No background | No campaign color on sections |

---

## Solution: Improve Color Consistency Across All Views

### 1. Week View - Increase Color Opacity

**File: `src/components/social-media/CalendarWeekView.tsx`**

Change the opacity values to match the month view for better visibility:

```tsx
// Line 97-102: Current subtle colors
style={
  hasContent && campaignColor
    ? { backgroundColor: `${campaignColor}20` }  // Too subtle
    : hasSlot && campaignColor
      ? { backgroundColor: `${campaignColor}08` }  // Barely visible
      : undefined
}

// Change to:
style={
  hasContent && campaignColor
    ? { backgroundColor: `${campaignColor}40` }  // 25% opacity - more visible
    : hasSlot && campaignColor
      ? { backgroundColor: `${campaignColor}18` }  // 9% opacity - visible muted
      : undefined
}
```

### 2. Day View - Add Campaign Color to Section Headers

**File: `src/components/social-media/CalendarDayView.tsx`**

Add campaign color background to each platform section when a slot/content exists:

```tsx
// In the platform section container (around line 63)
<div 
  key={platform} 
  className="border rounded-lg overflow-hidden"
  style={
    hasContent && platformData?.campaignColor
      ? { backgroundColor: `${platformData.campaignColor}15` }  // Light tint for content
      : hasSlot && platformData?.campaignColor
        ? { backgroundColor: `${platformData.campaignColor}08` }  // Very subtle for slots
        : undefined
  }
>
```

Also update the header section to show the campaign color more prominently:

```tsx
// Platform header (around line 65-80)
<div
  className="flex items-center justify-between p-3 bg-muted"
  style={{ 
    borderLeft: `4px solid ${platformData?.campaignColor || platformConfig?.color}`,
  }}
>
  {/* Show campaign name badge if from campaign */}
  {platformData?.campaignName && (
    <Badge 
      variant="outline" 
      className="ml-2"
      style={{ 
        backgroundColor: `${platformData.campaignColor}20`,
        borderColor: platformData.campaignColor,
      }}
    >
      {platformData.campaignName}
    </Badge>
  )}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/social-media/CalendarWeekView.tsx` | Increase background opacity for better visibility |
| `src/components/social-media/CalendarDayView.tsx` | Add campaign color backgrounds and enhanced campaign badge |

---

## Visual Result

After these changes, all three views will have consistent campaign color treatment:

**Month View:**
- Stripes colored with campaign color (80% for content, 20% for slots)

**Week View:**
- Cell backgrounds tinted with campaign color (25% for content, 9% for slots)
- More visible than before

**Day View:**
- Platform section backgrounds tinted with campaign color
- Campaign name badge with colored border
- Left border uses campaign color instead of just platform color

---

## How Monthly Campaigns Will Display

Monthly campaigns created with the new frequency option will appear:
1. On the exact date calculated (e.g., "2nd Thursday of each month")
2. With the campaign's chosen color in all three views
3. With light/faded color when only a slot exists (scheduled placeholder)
4. With darker/fuller color when actual content is added

No changes needed to the slot generation or data fetching logic - it's already working correctly.

