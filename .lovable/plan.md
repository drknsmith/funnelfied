

# Treneur Social Media Content Manager - Implementation Plan

## Overview

Build a complete Social Media Content Manager module exclusively for the Treneur workspace. This is a **planning-only** tool (no publishing) that provides a content calendar, campaign management, and asset library with AI-assisted hashtag suggestions.

---

## Phase 1: Database Schema

### New Tables

**1. `sm_campaigns`** - Social media campaigns with recurrence rules

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| workspace_id | uuid | FK to workspaces |
| name | text | Campaign name |
| color | text | Hex color for calendar display |
| description_brief | text | 1-3 sentences for AI context |
| platforms | text[] | Array: instagram, fanbase, linkedin, facebook, youtube |
| recurrence_rule | jsonb | {frequency: 'weekly'/'biweekly'/'custom', day_of_week: 0-6, custom_days?: number[]} |
| do_dont_guidance | text | Optional guidance |
| default_cta_style | text | Optional CTA template |
| keyword_tags | text[] | Optional keywords |
| is_active | boolean | Active/inactive toggle |
| created_by | uuid | User who created |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**2. `sm_schedule_slots`** - Recurring schedule occurrences

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| workspace_id | uuid | FK to workspaces |
| campaign_id | uuid | FK to sm_campaigns (nullable for one-offs) |
| scheduled_date | date | Date of occurrence |
| platform | text | Single platform |
| status | text | planned/ready/published/skipped |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**3. `sm_content_items`** - Individual content pieces

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| workspace_id | uuid | FK to workspaces |
| schedule_slot_id | uuid | FK to sm_schedule_slots |
| campaign_id | uuid | FK to sm_campaigns (nullable) |
| platform | text | Target platform |
| title | text | Content label |
| caption | text | Post caption |
| hashtags_suggested | text[] | AI-generated hashtags |
| hashtags_saved | text[] | User-selected hashtags |
| status | text | idea/draft/ready/published/skipped |
| override_date | date | Override schedule date |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**4. `sm_assets`** - Media assets for social content

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| workspace_id | uuid | FK to workspaces |
| asset_type | text | image/carousel/video |
| file_url | text | Storage URL |
| thumbnail_url | text | Thumbnail URL |
| tags | text[] | User tags |
| notes | text | Optional notes |
| created_by | uuid | |
| created_at | timestamptz | |

**5. `sm_content_assets`** - Junction: content items to assets

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| content_item_id | uuid | FK to sm_content_items |
| asset_id | uuid | FK to sm_assets |
| display_order | int | Order in carousel |

### Storage Bucket

Create `sm-assets` bucket for social media uploads with public access for thumbnails.

### RLS Policies

All tables scoped to `workspace_id = current_workspace()` with standard CRUD policies.

---

## Phase 2: Feature Flag & Navigation

### Workspace Feature

Add to `src/lib/workspaceFeatures.ts`:

```typescript
export function canUseSocialMedia(workspaceId?: string | null): boolean {
  return isTreneurWorkspace(workspaceId);
}
```

### Navigation Update

Modify `src/components/layout/AppLayout.tsx` to show "Social Media" nav item only for Treneur:

```typescript
{canUseSocialMedia(activeWorkspaceId) && (
  <NavItem 
    to="/social-media" 
    icon={<Share2 className="h-4 w-4" />} 
    label="Social Media" 
    collapsed={isCollapsed} 
  />
)}
```

---

## Phase 3: Page Structure & Routing

### Routes to Add

| Route | Component | Description |
|-------|-----------|-------------|
| /social-media | SocialMedia.tsx | Container with sub-nav |
| /social-media/calendar | Default sub-view | Content Calendar |
| /social-media/campaigns | Sub-view | Campaign management |
| /social-media/assets | Sub-view | Asset library |

### Main Page Structure

```text
SocialMedia.tsx
├── Sub-navigation tabs: [Calendar] [Campaigns] [Assets]
├── <Outlet /> for sub-views
└── Protected by Treneur workspace check
```

---

## Phase 4: Content Calendar

### Month View

**Layout:**
- Header: View toggle (Month/Week/Day) + Filters (Platform, Campaign, Status) + Color Legend
- Grid: 7 columns x 5-6 rows

**Day Cell Design:**
```text
┌─────────────────┐
│  15             │  ← Date number
│ ═══ Instagram   │  ← Stripe (filled = scheduled, outline = empty)
│ ═══ Fanbase     │
│ ═══ LinkedIn    │
│ ═══ Facebook    │
│ ═══ YouTube     │
└─────────────────┘
```

- Stripes filled with campaign color if content scheduled
- Empty stripes show faint outline (obviously empty)
- Click opens scheduling drawer

### Week View

**Layout:**
- Rows: 5 platforms (Instagram, Fanbase, LinkedIn, Facebook, YouTube)
- Columns: Days of the week

**Cell Content:**
- Campaign name badge
- Content thumbnail previews (stacked if multiple)
- "+X" indicator for overflow

**Drag-and-Drop:**
- Drag content item → moves only that item (creates override_date)
- Drag campaign occurrence → prompt: "Move only this" or "Move going forward"

### Day View

**Layout:**
- Rows per platform
- Vertical stack of scheduled content
- Larger thumbnails
- Full caption preview
- Quick status toggle buttons

---

## Phase 5: Campaigns Page

### Campaign List

| Column | Content |
|--------|---------|
| Name | Campaign name with color indicator |
| Platforms | Platform icons/badges |
| Cadence | Weekly/Biweekly/Custom |
| Default Day | Day of week |
| Status | Active/Inactive toggle |
| Next Scheduled | Next occurrence date |
| Actions | Edit, Delete |

### Campaign Form (Dialog/Drawer)

**Required Fields:**
- Campaign name (text)
- Color picker
- Platforms (multi-select checkboxes)
- Frequency: Weekly / Biweekly / Custom
- Default day of week

**AI Enablement (Required for suggestions):**
- Description/Brief (textarea, 1-3 sentences)
- Show helper: "Required for AI hashtag suggestions"

**Optional Fields:**
- Do/Don't guidance
- Default CTA style
- Keyword tags

---

## Phase 6: Asset Library

### Grid View

- Thumbnail grid (4-6 columns responsive)
- Upload button (top right)
- Filter by tags
- Asset type badge overlay (image/carousel/video)

### Asset Card

```text
┌────────────────┐
│   [Thumbnail]  │
│   ▶ (if video) │
├────────────────┤
│ Type • Date    │
│ Tags...        │
└────────────────┘
```

### Asset Detail Modal

- Large preview
- Upload date
- Asset type
- Linked content items list
- Notes field
- Tags editor
- Delete action

### Upload Flow

1. Drag-drop or click to upload
2. Auto-detect type (image/video)
3. Generate thumbnail (for video: use first frame or placeholder)
4. Add optional tags
5. Save to `sm-assets` storage bucket

---

## Phase 7: Content Item Management

### Content Form (Drawer)

**Fields:**
- Title/label
- Platform (single select)
- Linked campaign (optional dropdown)
- Media assets (picker from Asset Library)
- Caption (textarea)
- Hashtags section:
  - AI-suggested (if campaign has description)
  - Saved hashtags (user can add/remove)
- Status: Idea → Draft → Ready → Published → Skipped
- Scheduled date (inherited from slot, or override)

### AI Hashtag Suggestions

**Button:** "Suggest Hashtags" (disabled if no campaign description)

**Edge Function:** `suggest-hashtags`
- Input: campaign name, description, platform, caption
- Output: Array of 10-15 relevant hashtags
- Model: google/gemini-3-flash-preview

**Gating:**
```typescript
if (!campaign.description_brief) {
  showToast("Add a campaign description to enable AI suggestions");
  return;
}
```

---

## Phase 8: Scheduling Logic

### Campaign Schedule Generation

When campaign is created/updated:
1. Generate schedule slots for next 12 weeks based on recurrence rule
2. On each calendar render, check if slots need extension
3. Slots exist even without content (show as empty but scheduled)

### Date Override

- Content items can have `override_date` that supersedes slot date
- Visual indicator in calendar when content is on override date

---

## Phase 9: Files to Create

### Pages

| File | Purpose |
|------|---------|
| src/pages/SocialMedia.tsx | Container with sub-nav tabs |
| src/pages/social-media/ContentCalendar.tsx | Calendar views |
| src/pages/social-media/Campaigns.tsx | Campaign list + forms |
| src/pages/social-media/AssetLibrary.tsx | Asset grid + upload |

### Components

| File | Purpose |
|------|---------|
| src/components/social-media/CalendarMonthView.tsx | Month grid with stripes |
| src/components/social-media/CalendarWeekView.tsx | Platform rows with drag-drop |
| src/components/social-media/CalendarDayView.tsx | Detailed day view |
| src/components/social-media/CalendarFilters.tsx | Filter controls |
| src/components/social-media/CalendarLegend.tsx | Campaign color legend |
| src/components/social-media/CampaignList.tsx | Campaign table |
| src/components/social-media/CampaignForm.tsx | Create/edit campaign |
| src/components/social-media/ContentDrawer.tsx | Schedule/edit content |
| src/components/social-media/AssetGrid.tsx | Thumbnail grid |
| src/components/social-media/AssetUploader.tsx | Upload component |
| src/components/social-media/AssetDetail.tsx | Asset detail modal |
| src/components/social-media/PlatformStripes.tsx | Day cell stripes |
| src/components/social-media/ContentThumbnail.tsx | Content preview |

### Hooks

| File | Purpose |
|------|---------|
| src/hooks/useSMCampaigns.ts | Campaign CRUD |
| src/hooks/useSMScheduleSlots.ts | Schedule slot queries |
| src/hooks/useSMContentItems.ts | Content item CRUD |
| src/hooks/useSMAssets.ts | Asset CRUD + upload |
| src/hooks/useSMCalendarData.ts | Calendar view data aggregation |

### Edge Functions

| File | Purpose |
|------|---------|
| supabase/functions/suggest-hashtags/index.ts | AI hashtag generation |

---

## Phase 10: Implementation Order

1. **Database** - Create all tables, RLS policies, storage bucket
2. **Feature flag** - Add `canUseSocialMedia()` function
3. **Navigation** - Add nav item for Treneur workspace
4. **Routes** - Add routes in App.tsx
5. **Hooks** - Build data layer (campaigns, content, assets)
6. **Campaigns page** - List + CRUD form
7. **Asset library** - Grid + upload
8. **Calendar month view** - Basic stripe rendering
9. **Content drawer** - Create/edit content
10. **Calendar week view** - With thumbnails
11. **Calendar day view** - Detailed view
12. **Drag-and-drop** - Week view interactions
13. **AI suggestions** - Edge function + UI integration
14. **Polish** - Filters, legend, status toggles

---

## Technical Notes

### Platform Constants

```typescript
export const SM_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'fanbase', label: 'Fanbase', icon: Users },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
] as const;

export const PLATFORM_ORDER = ['instagram', 'fanbase', 'linkedin', 'facebook', 'youtube'];
```

### Calendar Stripe Colors

- Filled: Campaign color at 80% opacity
- Empty: `border border-dashed border-muted-foreground/30`
- Hover: Highlight effect

### Content Status Flow

```text
idea → draft → ready → published
                    ↘ skipped
```

---

## Acceptance Criteria Mapping

| Requirement | Implementation |
|-------------|----------------|
| Month view 5 platform stripes | PlatformStripes component |
| Empty stripes visually obvious | Dashed border styling |
| Color legend visible | CalendarLegend component |
| Empty days clickable | ContentDrawer opens |
| Week view platform rows | CalendarWeekView with grid |
| Drag-and-drop with scope control | Prompt dialog on campaign drag |
| Campaigns control recurring logic | useSMScheduleSlots generates slots |
| AI requires campaign description | Gating check before API call |
| Asset library thumbnails | sm-assets bucket + AssetGrid |
| Facebook supported everywhere | Included in SM_PLATFORMS |

