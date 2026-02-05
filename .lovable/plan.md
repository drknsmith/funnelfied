

# Fix: Variable Declaration Order in AddContentDialog

## Issue Identified

The app is crashing due to a **Temporal Dead Zone (TDZ) error** in `AddContentDialog.tsx`.

### Root Cause

On **line 50**, `campaignId` is referenced:
```tsx
const selectedCampaign = campaigns.find(c => c.id === campaignId);
```

But `campaignId` is declared later on **line 56**:
```tsx
const [campaignId, setCampaignId] = useState<string>('none');
```

In JavaScript/TypeScript, you cannot reference a `const` or `let` variable before its declaration - this causes a runtime error that crashes the entire React application.

---

## Solution

Move the `selectedCampaign` declaration to AFTER the `campaignId` state is declared.

**File: `src/components/social-media/AddContentDialog.tsx`**

### Before (broken):
```tsx
// Line 47-50
const { generateCaption, isGenerating } = useSMCaptionGenerator();

// Get selected campaign for AI caption generation
const selectedCampaign = campaigns.find(c => c.id === campaignId);  // ❌ ERROR: campaignId not yet declared

// Form state
const [scheduledDate, setScheduledDate] = useState(...);
...
const [campaignId, setCampaignId] = useState<string>('none');  // Line 56
```

### After (fixed):
```tsx
// Line 47
const { generateCaption, isGenerating } = useSMCaptionGenerator();

// Form state
const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
const [title, setTitle] = useState('');
const [selectedPlatforms, setSelectedPlatforms] = useState<SMPlatform[]>([]);
const [campaignId, setCampaignId] = useState<string>('none');
const [caption, setCaption] = useState('');
const [status, setStatus] = useState<ContentStatus>('idea');
const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

// Get selected campaign for AI caption generation (moved AFTER campaignId declaration)
const selectedCampaign = campaigns.find(c => c.id === campaignId);  // ✅ Now works

// UI state
const [showAssetUploader, setShowAssetUploader] = useState(false);
const [showAssetPicker, setShowAssetPicker] = useState(false);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/social-media/AddContentDialog.tsx` | Move `selectedCampaign` declaration after `campaignId` state |

---

## Expected Result

After this fix, the app will load correctly again. The variable ordering ensures `campaignId` is declared before it's used in the `campaigns.find()` call.

