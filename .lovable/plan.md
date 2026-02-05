
# Fix: Social Media Content Manager Bugs + New Features

## Issues Identified

### Bug 1: Select Empty String Value Error
**Location**: `src/components/social-media/ContentDrawer.tsx` line 165

The error `A <Select.Item /> must have a value prop that is not an empty string` is caused by:
```tsx
<SelectItem value="">No campaign</SelectItem>
```

Radix UI Select does not allow empty string values for SelectItem.

**Fix**: Use a sentinel value like `"none"` instead of empty string.

### Bug 2: Campaign Creation Failing  
The console shows errors but no specific database error. The issue is likely the RLS policy or the `recurrence_rule` JSONB field. Looking at the code, the insert looks correct but we should verify the error is being logged properly.

### Bug 3: Day View Content Creation Error
Same Select empty string issue in ContentDrawer when opened from Day View.

---

## New Feature Requests

### Feature 1: Auto-populate Asset Library from Content
When users add images/videos to content, they should automatically appear in the Asset Library with:
- Usage count showing how many times the asset was used
- Details popup showing all dates the asset was used on

### Feature 2: New "Content" Tab
Add a new tab between "Campaigns" and "Asset Library" showing:
- Table/list view of all content items
- Columns:
  - Content title/preview
  - Upcoming post (next scheduled date)
  - Last post (most recent date)
  - Frequency (number of posts)

### Feature 3: Asset Usage Tracking
- Display usage count on each asset card
- Show list of dates/content items in Asset Detail modal

---

## Implementation Plan

### Phase 1: Fix Select Empty String Bugs

**File**: `src/components/social-media/ContentDrawer.tsx`

| Line | Change |
|------|--------|
| 53 | Initialize campaignId state to `'none'` instead of empty string |
| 76 | Check `campaignId !== 'none'` before passing to create function |
| 165 | Change `value=""` to `value="none"` |

```tsx
// Before
const [campaignId, setCampaignId] = useState<string>('');
...
campaign_id: campaignId || undefined,
...
<SelectItem value="">No campaign</SelectItem>

// After  
const [campaignId, setCampaignId] = useState<string>('none');
...
campaign_id: campaignId !== 'none' ? campaignId : undefined,
...
<SelectItem value="none">No campaign</SelectItem>
```

### Phase 2: Add "Content" Tab

**File**: `src/pages/SocialMedia.tsx`

Add new tab in the tabs array:
```tsx
const tabs = [
  { to: '/social-media', label: 'Content Calendar', icon: CalendarDays, exact: true },
  { to: '/social-media/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/social-media/content', label: 'Content', icon: FileText },  // NEW
  { to: '/social-media/assets', label: 'Asset Library', icon: ImageIcon },
];
```

**New File**: `src/pages/social-media/ContentList.tsx`

Create a table view showing all content items with:
- Title/preview column
- Platform icon
- Campaign badge
- Upcoming date (calculated from override_date or schedule slot)
- Last post date
- Post frequency count

**File**: `src/App.tsx`

Add new route:
```tsx
<Route path="content" element={<ContentList />} />
```

### Phase 3: Enhanced Asset Library with Usage Tracking

**File**: `src/hooks/useSMAssets.ts`

Update query to include usage count by joining with `sm_content_assets`:
```tsx
const { data: assets = [], isLoading } = useQuery({
  queryKey: ['sm-assets', profile?.workspace_id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sm_assets')
      .select(`
        *,
        sm_content_assets (
          content_item_id,
          sm_content_items (
            id,
            override_date,
            title,
            platform,
            schedule_slot_id,
            sm_schedule_slots (
              scheduled_date
            )
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    // Calculate usage count from sm_content_assets relation
    return data.map(a => ({
      ...a,
      usage_count: a.sm_content_assets?.length || 0,
      usage_details: a.sm_content_assets?.map(ca => ({
        content_id: ca.content_item_id,
        date: ca.sm_content_items?.override_date || 
              ca.sm_content_items?.sm_schedule_slots?.scheduled_date,
        title: ca.sm_content_items?.title,
        platform: ca.sm_content_items?.platform
      })).filter(Boolean) || []
    }));
  },
});
```

**File**: `src/components/social-media/AssetGrid.tsx`

Add usage count badge to each asset card:
```tsx
{asset.usage_count > 0 && (
  <Badge className="absolute top-1 right-1">
    Used {asset.usage_count}x
  </Badge>
)}
```

**File**: `src/components/social-media/AssetDetail.tsx`

Add usage history section:
```tsx
{/* Usage History */}
{asset.usage_details?.length > 0 && (
  <div className="space-y-2">
    <Label>Used In ({asset.usage_details.length})</Label>
    <div className="max-h-40 overflow-y-auto space-y-1">
      {asset.usage_details.map((usage, idx) => (
        <div key={idx} className="text-sm flex items-center gap-2 p-2 bg-muted rounded">
          <PlatformIcon platform={usage.platform} />
          <span>{usage.title || 'Untitled'}</span>
          <span className="text-muted-foreground ml-auto">
            {usage.date ? format(parseISO(usage.date), 'MMM d, yyyy') : 'No date'}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/social-media/ContentDrawer.tsx` | Fix empty string SelectItem value |
| `src/pages/SocialMedia.tsx` | Add Content tab |
| `src/App.tsx` | Add Content route |
| `src/hooks/useSMAssets.ts` | Add usage count/details to query |
| `src/components/social-media/AssetGrid.tsx` | Display usage count badge |
| `src/components/social-media/AssetDetail.tsx` | Show usage history |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/social-media/ContentList.tsx` | Content list view with table |

---

## Technical Notes

### Content List Columns

| Column | Data Source |
|--------|-------------|
| Title/Preview | `content_items.title` or thumbnail |
| Platform | `content_items.platform` icon |
| Campaign | `content_items.campaign_id` → campaign name/color |
| Upcoming Post | Next date ≥ today from `override_date` or slot dates |
| Last Post | Most recent `override_date` or slot date where status = 'published' |
| Frequency | Count of content items per platform/campaign grouping |

### Asset Usage Count

The usage count comes from the `sm_content_assets` junction table which links content items to assets. Each row represents one usage of the asset in a content item.
