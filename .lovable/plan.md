

# Calendar Row Click Navigation + Content Upload Features

## Summary

This plan addresses two requests:
1. **Calendar row click navigation** - When clicking a platform stripe that has content, navigate to a content detail/edit page instead of opening the drawer
2. **Image/video upload in content creation/edit** - Add media upload capability to the ContentDrawer and AddContentDialog

---

## Current State Analysis

### Calendar Click Behavior
- **PlatformStripes.tsx** - Handles stripe clicks via `onStripeClick` callback
- **ContentCalendar.tsx** - Receives clicks and opens `ContentDrawer`
- **ContentDrawer.tsx** - Shows existing content list and "Add Content" form

### Content Management
- Content items can have linked assets via `sm_content_assets` junction table
- Assets are uploaded via `useSMAssets.ts` hook to `sm-assets` storage bucket
- `ContentThumbnail.tsx` displays content in drawer but has no click-to-edit functionality

### Current Limitation
- No dedicated content detail/edit page exists
- ContentDrawer shows content list but doesn't allow editing
- No upload UI in content creation flow

---

## Solution

### Part 1: Click-to-Edit Content Detail Drawer

Create a new `ContentDetailDrawer.tsx` component that opens when clicking a platform stripe with existing content. This allows viewing and editing a specific content item.

**New File: `src/components/social-media/ContentDetailDrawer.tsx`**

Features:
- View/edit title, caption, status, campaign
- View/upload/remove media attachments
- Delete content item
- Navigate between multiple content items on same date/platform

**Changes to `src/components/social-media/ContentDrawer.tsx`**

When clicking an existing content item in the drawer, open the detail drawer for that item:
```tsx
// ContentThumbnail wrapped in clickable container
<div
  onClick={() => onContentClick?.(item.id)}
  className="cursor-pointer"
>
  <ContentThumbnail item={item} />
</div>
```

**Changes to `src/pages/social-media/ContentCalendar.tsx`**

Track selected content ID and render ContentDetailDrawer:
```tsx
const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

// In ContentDrawer, pass handler for content clicks
<ContentDrawer
  onContentClick={(contentId) => {
    setSelectedContentId(contentId);
    // Keep drawer context or switch to detail view
  }}
/>

// Render detail drawer
<ContentDetailDrawer
  open={!!selectedContentId}
  onOpenChange={(open) => !open && setSelectedContentId(null)}
  contentId={selectedContentId}
  onUpdate={() => {
    // Refresh data
  }}
/>
```

### Part 2: Media Upload in Content Creation/Edit

Add upload capability to both:
1. ContentDetailDrawer (editing existing content)
2. ContentDrawer "Add Content" form (creating new content)
3. AddContentDialog (standalone content creation)

**Implementation Approach**

Reuse the existing `AssetUploader.tsx` component pattern and `useSMAssets` hook:

```tsx
// In content form
const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
const [showAssetPicker, setShowAssetPicker] = useState(false);

// Asset selection section
<div className="space-y-2">
  <Label>Media</Label>
  {/* Show selected assets */}
  <div className="flex flex-wrap gap-2">
    {selectedAssets.map((asset) => (
      <div key={asset.id} className="relative w-16 h-16">
        <img src={asset.thumbnail_url || asset.file_url} ... />
        <button onClick={() => removeAsset(asset.id)}>×</button>
      </div>
    ))}
  </div>
  
  {/* Add media buttons */}
  <div className="flex gap-2">
    <Button size="sm" variant="outline" onClick={() => setShowUploader(true)}>
      <Upload /> Upload New
    </Button>
    <Button size="sm" variant="outline" onClick={() => setShowAssetPicker(true)}>
      <Image /> From Library
    </Button>
  </div>
</div>

// On submit, pass asset_ids to createContentItem
await createContentItem({
  ...formData,
  asset_ids: selectedAssetIds,
});
```

**New Component: `src/components/social-media/AssetPicker.tsx`**

A dialog to select existing assets from the library:
```tsx
interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelect: (assetIds: string[]) => void;
  multiple?: boolean;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/social-media/ContentDetailDrawer.tsx` | View/edit single content item with full details |
| `src/components/social-media/AssetPicker.tsx` | Select assets from existing library |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/social-media/ContentDrawer.tsx` | Add `onContentClick` prop, make thumbnails clickable, add media upload to create form |
| `src/components/social-media/AddContentDialog.tsx` | Add media upload/selection section |
| `src/pages/social-media/ContentCalendar.tsx` | Track selected content ID, render ContentDetailDrawer |
| `src/components/social-media/ContentThumbnail.tsx` | Add onClick handling |

---

## Technical Details

### ContentDetailDrawer.tsx Structure

```tsx
interface ContentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string | null;
}

export function ContentDetailDrawer({ open, onOpenChange, contentId }: ContentDetailDrawerProps) {
  const { contentItems, updateContentItem, deleteContentItem } = useSMContentItems();
  const { assets, uploadAsset } = useSMAssets();
  const { campaigns } = useSMCampaigns();
  
  const content = contentItems.find(c => c.id === contentId);
  
  // Form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<ContentStatus>('idea');
  const [campaignId, setCampaignId] = useState('none');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Sync form with content
  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setCaption(content.caption || '');
      setStatus(content.status);
      setCampaignId(content.campaign_id || 'none');
      setSelectedAssetIds(content.assets?.map(a => a.id) || []);
    }
  }, [content]);
  
  const handleSave = async () => {
    await updateContentItem({
      id: contentId!,
      title,
      caption,
      status,
      campaign_id: campaignId !== 'none' ? campaignId : undefined,
      asset_ids: selectedAssetIds,
    });
    onOpenChange(false);
  };
  
  const handleDelete = async () => {
    await deleteContentItem(contentId!);
    onOpenChange(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* Platform icon and date header */}
        {/* Form fields: title, caption, status, campaign */}
        {/* Media section with upload/picker */}
        {/* Save/Delete buttons */}
      </SheetContent>
    </Sheet>
  );
}
```

### AssetPicker.tsx Structure

```tsx
interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelect: (assetIds: string[]) => void;
  multiple?: boolean;
}

export function AssetPicker({ open, onOpenChange, selectedIds, onSelect, multiple = true }: AssetPickerProps) {
  const { assets, isLoading } = useSMAssets();
  const [selected, setSelected] = useState<string[]>(selectedIds);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        
        {/* Grid of assets with selection checkboxes */}
        <div className="grid grid-cols-4 gap-2 overflow-y-auto">
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => toggleAsset(asset.id)}
              className={cn(
                'relative aspect-square rounded cursor-pointer',
                selected.includes(asset.id) && 'ring-2 ring-primary'
              )}
            >
              <img src={asset.thumbnail_url || asset.file_url} />
              {selected.includes(asset.id) && <CheckIcon />}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button onClick={() => { onSelect(selected); onOpenChange(false); }}>
            Select ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## User Flow

### Viewing/Editing Existing Content

1. User clicks on a platform stripe with content (full color)
2. ContentDrawer opens showing list of content for that date/platform
3. User clicks on a content item thumbnail
4. ContentDetailDrawer opens with full edit form:
   - Title, caption, status, campaign fields
   - Media section showing attached assets
   - Buttons to upload new or select from library
   - Save and Delete buttons

### Creating New Content with Media

1. User clicks "Add Content" in drawer or ContentList page
2. Form shows platform toggles, date picker, title, caption, status
3. New "Media" section allows:
   - "Upload New" - Opens AssetUploader for direct upload
   - "From Library" - Opens AssetPicker to choose existing assets
4. Selected assets shown as thumbnails with remove button
5. On submit, content item created with linked assets

---

## Expected Results

1. **Click to edit** - Clicking content in calendar opens detail drawer for editing
2. **Media upload** - Users can attach images/videos when creating or editing content
3. **Asset reuse** - Users can select from existing asset library
4. **Consistent UX** - Same upload flow as Asset Library page

