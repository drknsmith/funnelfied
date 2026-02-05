

# Fix: Campaign Creation RLS Failures

## Root Cause Analysis

The database logs confirm multiple RLS violations for `sm_campaigns`:
```
new row violates row-level security policy for table "sm_campaigns"
```

The issue is a **timing/null safety problem** in the `useSMCampaigns` hook:

```typescript
workspace_id: workspaceId!,  // <-- If workspaceId is null, this sends null!
```

The TypeScript non-null assertion (`!`) only silences the compiler - it doesn't prevent `null` from being sent to Supabase at runtime. When `workspaceId` is `null`:
- The insert sends `workspace_id: null`
- RLS policy checks `workspace_id = current_workspace()`
- `null ≠ 'uuid-value'` → RLS violation

## Why First Campaign Worked

The first campaign creation happened when `workspaceId` was properly populated. Subsequent attempts may have occurred:
- Before `workspaceId` was loaded (race condition)
- After a component remount that temporarily cleared state
- With stale closure capturing an old `workspaceId` value

## Solution

### 1. Add Guard Clauses Before Mutations

Prevent mutations when `workspaceId` is not available:

**File: `src/hooks/useSMCampaigns.ts`**

```typescript
const createMutation = useMutation({
  mutationFn: async (input: CreateCampaignInput) => {
    if (!workspaceId) {
      throw new Error('Workspace not loaded. Please refresh the page.');
    }
    
    const { data, error } = await supabase
      .from('sm_campaigns')
      .insert({
        workspace_id: workspaceId,  // Remove ! assertion
        // ... rest of insert
      })
```

Apply same pattern to:
- `useSMScheduleSlots.ts` - create mutation and generateSlotsForCampaign
- `useSMContentItems.ts` - create mutation
- `useSMAssets.ts` - upload function

### 2. Add Debug Logging

Temporarily add logging to identify when workspaceId is null:

```typescript
const createMutation = useMutation({
  mutationFn: async (input: CreateCampaignInput) => {
    console.log('[SM Debug] Creating campaign with workspaceId:', workspaceId);
    if (!workspaceId) {
      console.error('[SM Debug] workspaceId is null at mutation time');
      throw new Error('Workspace not loaded. Please refresh the page.');
    }
    // ...
  },
```

### 3. Disable UI Actions When Workspace Not Ready

Prevent the "Create Campaign" button from being clickable when workspace isn't loaded:

**File: `src/pages/social-media/Campaigns.tsx`**

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function Campaigns() {
  const { workspaceId } = useAuth();
  const { campaigns, isLoading, deleteCampaign, toggleActive } = useSMCampaigns();
  
  // ...
  
  <Button 
    onClick={() => setFormOpen(true)}
    disabled={!workspaceId}  // Disable if no workspace
  >
    <Plus className="h-4 w-4 mr-2" />
    New Campaign
  </Button>
```

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSMCampaigns.ts` | Add null check guard before insert |
| `src/hooks/useSMScheduleSlots.ts` | Add null check guard before inserts |
| `src/hooks/useSMContentItems.ts` | Add null check guard before insert |
| `src/hooks/useSMAssets.ts` | Add null check guard before insert |
| `src/pages/social-media/Campaigns.tsx` | Disable create button when workspace not ready |
| `src/components/social-media/AddContentDialog.tsx` | Disable submit when workspace not ready |

## Code Changes Summary

### useSMCampaigns.ts - Create Mutation

```typescript
const createMutation = useMutation({
  mutationFn: async (input: CreateCampaignInput) => {
    if (!workspaceId) {
      throw new Error('Workspace not loaded. Please refresh the page.');
    }
    
    const { data, error } = await supabase
      .from('sm_campaigns')
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        color: input.color,
        description_brief: input.description_brief || null,
        platforms: input.platforms as string[],
        recurrence_rule: JSON.parse(JSON.stringify(input.recurrence_rule)),
        do_dont_guidance: input.do_dont_guidance || null,
        default_cta_style: input.default_cta_style || null,
        keyword_tags: input.keyword_tags || [],
        is_active: input.is_active ?? true,
        created_by: profile?.user_id ?? user?.id ?? null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onError: (error: any) => {
    console.error('Error creating campaign:', error);
    if (error?.message?.includes('Workspace not loaded')) {
      toast.error('Workspace not loaded. Please refresh the page.');
    } else if (error?.message?.includes('row level security')) {
      toast.error('Permission/workspace mismatch. Please refresh and try again.');
    } else {
      toast.error('Failed to create campaign');
    }
  },
});
```

### useSMScheduleSlots.ts - generateSlotsForCampaign

```typescript
const generateSlotsForCampaign = async (
  campaignId: string,
  platforms: SMPlatform[],
  recurrenceRule: RecurrenceRule,
  weeksAhead: number = 12
) => {
  if (!workspaceId) {
    throw new Error('Workspace not loaded. Please refresh the page.');
  }
  
  // ... rest of function
  
  if (slots.length > 0) {
    const { error } = await supabase
      .from('sm_schedule_slots')
      .insert(
        slots.map(s => ({
          ...s,
          workspace_id: workspaceId,  // Remove ! assertion
        }))
      );
    // ...
  }
};
```

## Expected Result

After these changes:
1. If `workspaceId` is null, user sees clear error message "Workspace not loaded. Please refresh."
2. UI buttons are disabled when workspace isn't ready
3. No more RLS violations from null workspace_id inserts
4. Debug logging helps identify if the issue recurs

