
# Fix: Social Media RLS Violations + New Features

## Summary

This plan addresses:
1. **RLS violation bug** - Campaign/content/asset creation fails because hooks use `profile.workspace_id` instead of the effective `workspaceId`
2. **Add button to Content header** - With date input for scheduling content outside of calendar day context
3. **Multi-platform toggle** - Allow selecting multiple platforms and duplicate content for each

---

## Part 1: Fix RLS Violation in All Social Media Hooks

### Root Cause
The hooks use `profile!.workspace_id` (user's home workspace) instead of `workspaceId` from `useAuth()` (the effective workspace for super admins who switched workspaces).

### Files to Modify

**1. `src/hooks/useSMCampaigns.ts`**
| Line | Current | Change To |
|------|---------|-----------|
| 37 | `const { profile } = useAuth()` | `const { workspaceId, profile, user } = useAuth()` |
| 41 | `queryKey: ['sm-campaigns', profile?.workspace_id]` | `queryKey: ['sm-campaigns', workspaceId]` |
| 57 | `enabled: !!profile?.workspace_id` | `enabled: !!workspaceId` |
| 65 | `workspace_id: profile!.workspace_id` | `workspace_id: workspaceId!` |
| 75 | `created_by: profile!.user_id` | `created_by: profile?.user_id ?? user?.id ?? null` |
| 87-89 | Generic error toast | Add RLS-specific error message |

**2. `src/hooks/useSMScheduleSlots.ts`**
| Line | Current | Change To |
|------|---------|-----------|
| 27 | `const { profile } = useAuth()` | `const { workspaceId, profile, user } = useAuth()` |
| 31 | `queryKey: [..., profile?.workspace_id, ...]` | `queryKey: [..., workspaceId, ...]` |
| 53 | `enabled: !!profile?.workspace_id` | `enabled: !!workspaceId` |
| 61 | `workspace_id: profile!.workspace_id` | `workspace_id: workspaceId!` |
| 171 | `workspace_id: profile!.workspace_id` | `workspace_id: workspaceId!` |

**3. `src/hooks/useSMContentItems.ts`**
| Line | Current | Change To |
|------|---------|-----------|
| 39 | `const { profile } = useAuth()` | `const { workspaceId, profile, user } = useAuth()` |
| 43 | `queryKey: [..., profile?.workspace_id, ...]` | `queryKey: [..., workspaceId, ...]` |
| 80 | `enabled: !!profile?.workspace_id` | `enabled: !!workspaceId` |
| 89 | `workspace_id: profile!.workspace_id` | `workspace_id: workspaceId!` |
| 98 | `created_by: profile!.user_id` | `created_by: profile?.user_id ?? user?.id ?? null` |

**4. `src/hooks/useSMAssets.ts`**
| Line | Current | Change To |
|------|---------|-----------|
| 28 | `const { profile } = useAuth()` | `const { workspaceId, profile, user } = useAuth()` |
| 32 | `queryKey: ['sm-assets', profile?.workspace_id]` | `queryKey: ['sm-assets', workspaceId]` |
| 84 | `enabled: !!profile?.workspace_id` | `enabled: !!workspaceId` |
| 96 | `filePath = \`${profile!.workspace_id}/...\`` | `filePath = \`${workspaceId}/...\`` |
| 113 | `workspace_id: profile!.workspace_id` | `workspace_id: workspaceId!` |
| 117 | `created_by: profile!.user_id` | `created_by: profile?.user_id ?? user?.id ?? null` |

**5. `src/hooks/useSMCalendarData.ts`**
| Line | Current | Change To |
|------|---------|-----------|
| 35 | `const { profile } = useAuth()` | `const { workspaceId } = useAuth()` |
| 38 | `queryKey: [..., profile?.workspace_id, ...]` | `queryKey: [..., workspaceId, ...]` |
| 175 | `enabled: !!profile?.workspace_id && ...` | `enabled: !!workspaceId && ...` |

### Improved Error Messages

In `useSMCampaigns.ts` onError callback:
```typescript
onError: (error) => {
  console.error('Error creating campaign:', error);
  if (error.message?.includes('row level security')) {
    toast.error('Permission/workspace mismatch. Refresh and try again.');
  } else {
    toast.error('Failed to create campaign');
  }
},
```

Apply similar pattern to other SM hooks.

---

## Part 2: Add "Add Content" Button to Content Header

### Changes to `src/pages/social-media/ContentList.tsx`

Add an "Add Content" button in the CardHeader that opens a dialog/drawer:
- Add `useState` for dialog open state
- Add date picker input (required - since we're outside calendar context)
- Import and render `AddContentDialog` component

**New Component: `src/components/social-media/AddContentDialog.tsx`**

A dialog with:
- Date picker (required)
- Platform toggles (multi-select checkboxes)
- Campaign selector (optional)
- Title, caption, status fields
- On submit: create one content item per selected platform

---

## Part 3: Multi-Platform Toggle for Content Creation

### Current Behavior
- Single platform select dropdown
- Creates one content item

### New Behavior
- Platform selection is a set of toggle buttons (like checkboxes)
- User can select 1 or more platforms
- On save, duplicate content for each selected platform

### Files to Modify

**1. `src/components/social-media/ContentDrawer.tsx`**

Replace:
```tsx
const [platform, setPlatform] = useState<SMPlatform | ''>('');
```

With:
```tsx
const [selectedPlatforms, setSelectedPlatforms] = useState<SMPlatform[]>([]);
```

Replace platform `<Select>` with platform toggles:
```tsx
<div className="flex flex-wrap gap-2">
  {SM_PLATFORMS.map((p) => {
    const Icon = p.icon;
    const isSelected = selectedPlatforms.includes(p.value);
    return (
      <Button
        key={p.value}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => {
          if (isSelected) {
            setSelectedPlatforms(prev => prev.filter(x => x !== p.value));
          } else {
            setSelectedPlatforms(prev => [...prev, p.value]);
          }
        }}
      >
        <Icon className="h-4 w-4 mr-1" />
        {p.label}
      </Button>
    );
  })}
</div>
```

Update handleSubmit to create multiple content items:
```tsx
const handleSubmit = async () => {
  if (selectedPlatforms.length === 0 || !selectedDate) return;

  // Create content for each selected platform
  for (const platform of selectedPlatforms) {
    await createContentItem({
      platform,
      campaign_id: campaignId !== 'none' ? campaignId : undefined,
      title: title || undefined,
      caption: caption || undefined,
      status,
      override_date: selectedDate,
    });
  }

  resetForm();
};
```

**2. `src/components/social-media/AddContentDialog.tsx`** (new file)

Same multi-platform toggle pattern with required date picker:
```tsx
<div className="space-y-2">
  <Label>Date *</Label>
  <Input
    type="date"
    value={scheduledDate}
    onChange={(e) => setScheduledDate(e.target.value)}
  />
</div>
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useSMCampaigns.ts` | Modify | Use `workspaceId` + better error msg |
| `src/hooks/useSMScheduleSlots.ts` | Modify | Use `workspaceId` |
| `src/hooks/useSMContentItems.ts` | Modify | Use `workspaceId` |
| `src/hooks/useSMAssets.ts` | Modify | Use `workspaceId` |
| `src/hooks/useSMCalendarData.ts` | Modify | Use `workspaceId` |
| `src/components/social-media/ContentDrawer.tsx` | Modify | Multi-platform toggles |
| `src/pages/social-media/ContentList.tsx` | Modify | Add "Add Content" button |
| `src/components/social-media/AddContentDialog.tsx` | Create | New dialog with date + platforms |

---

## Expected Results

After implementation:
1. Campaign creation works for Super Admins in switched workspaces
2. Content creation works from Calendar and Content list
3. Asset uploads work correctly
4. Users can select multiple platforms and content duplicates for each
5. Content list has "Add Content" button with date input
