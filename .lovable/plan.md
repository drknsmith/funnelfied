
# Content List Actions + AI Caption Generator

## Overview

This plan adds two features:
1. **Edit/Delete actions on Content List page** - Add an actions column to the table for editing and deleting content items
2. **AI Caption Generator** - Add a button in content creation/editing that generates captions based on campaign rules (description_brief and do_dont_guidance)

---

## Part 1: Content List Edit/Delete Actions

### Current State
- `ContentList.tsx` displays a table of content items with title, platform, campaign, dates, and frequency
- No actions column exists for edit/delete
- `ContentDetailDrawer.tsx` already handles editing and deleting content

### Solution
Add an Actions column to the table with Edit and Delete buttons that open the ContentDetailDrawer or trigger a delete confirmation.

**File: `src/pages/social-media/ContentList.tsx`**

Changes:
- Import `ContentDetailDrawer` component
- Import `useSMContentItems` delete mutation
- Add `selectedContentId` state to track which content to edit
- Add Actions column with Edit and Delete buttons
- Add delete confirmation dialog
- Render `ContentDetailDrawer` for editing

```tsx
// New imports
import { ContentDetailDrawer } from '@/components/social-media/ContentDetailDrawer';
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// New state
const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
const [deleteId, setDeleteId] = useState<string | null>(null);
const { deleteContentItem, isDeleting } = useSMContentItems();

// Actions column in table
<TableHead className="w-[80px]">Actions</TableHead>

<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => setSelectedContentId(item.id)}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => setDeleteId(item.id)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

---

## Part 2: AI Caption Generator

### Current State
- Content creation happens in `AddContentDialog.tsx`, `ContentDrawer.tsx`, and `ContentDetailDrawer.tsx`
- Campaigns have `description_brief` and `do_dont_guidance` fields
- No AI integration exists in the social media content flow
- `scribe-chat` edge function exists for CRM AI assistance

### Solution
Create a new edge function `sm-caption-generator` that generates captions based on campaign rules, and add a "Generate Caption" button next to the caption textarea.

### New Edge Function

**File: `supabase/functions/sm-caption-generator/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, title, campaign } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt from campaign rules
    let systemPrompt = `You are a social media expert generating captions for ${platform}.
Write engaging, platform-appropriate captions.
Keep captions concise and impactful.`;

    if (campaign?.description_brief) {
      systemPrompt += `\n\nCampaign Description:\n${campaign.description_brief}`;
    }

    if (campaign?.do_dont_guidance) {
      systemPrompt += `\n\nDo's and Don'ts:\n${campaign.do_dont_guidance}`;
    }

    if (campaign?.default_cta_style) {
      systemPrompt += `\n\nDefault CTA Style: ${campaign.default_cta_style}`;
    }

    if (campaign?.keyword_tags?.length > 0) {
      systemPrompt += `\n\nKeywords to incorporate: ${campaign.keyword_tags.join(', ')}`;
    }

    const userPrompt = title 
      ? `Generate a caption for: "${title}"`
      : `Generate a caption for this ${campaign?.name || ''} campaign post`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ caption }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Caption generator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Frontend Hook

**File: `src/hooks/useSMCaptionGenerator.ts`**

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SMCampaign } from './useSMCampaigns';
import type { SMPlatform } from '@/lib/socialMediaConstants';

export function useSMCaptionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCaption = async ({
    platform,
    title,
    campaign,
  }: {
    platform: SMPlatform | SMPlatform[];
    title?: string;
    campaign?: SMCampaign | null;
  }): Promise<string | null> => {
    setIsGenerating(true);
    
    try {
      // Use first platform if array
      const platformStr = Array.isArray(platform) ? platform[0] : platform;
      
      const { data, error } = await supabase.functions.invoke('sm-caption-generator', {
        body: {
          platform: platformStr,
          title,
          campaign: campaign ? {
            name: campaign.name,
            description_brief: campaign.description_brief,
            do_dont_guidance: campaign.do_dont_guidance,
            default_cta_style: campaign.default_cta_style,
            keyword_tags: campaign.keyword_tags,
          } : null,
        },
      });
      
      if (error) throw error;
      
      return data?.caption || null;
    } catch (error: any) {
      console.error('Caption generation error:', error);
      if (error?.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again.');
      } else if (error?.message?.includes('Usage limit')) {
        toast.error('AI usage limit reached.');
      } else {
        toast.error('Failed to generate caption');
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCaption, isGenerating };
}
```

### UI Changes

Add "Generate with AI" button to all content forms. The button should:
- Be disabled if no campaign is selected (campaign provides the rules)
- Show loading state while generating
- Replace/append the generated caption to the textarea

**Files to modify:**
- `src/components/social-media/AddContentDialog.tsx`
- `src/components/social-media/ContentDrawer.tsx`
- `src/components/social-media/ContentDetailDrawer.tsx`

**Button placement:** Next to the Caption label

```tsx
import { useSMCaptionGenerator } from '@/hooks/useSMCaptionGenerator';
import { Sparkles } from 'lucide-react';

// In component
const { generateCaption, isGenerating } = useSMCaptionGenerator();
const selectedCampaign = campaigns.find(c => c.id === campaignId);

const handleGenerateCaption = async () => {
  const newCaption = await generateCaption({
    platform: selectedPlatforms, // or content.platform for edit
    title,
    campaign: selectedCampaign,
  });
  if (newCaption) {
    setCaption(newCaption);
  }
};

// In JSX
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="caption">Caption</Label>
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleGenerateCaption}
      disabled={isGenerating || campaignId === 'none'}
      title={campaignId === 'none' ? 'Select a campaign first' : undefined}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Sparkles className="h-4 w-4 mr-1" />
      )}
      Generate with AI
    </Button>
  </div>
  <Textarea ... />
  {campaignId === 'none' && (
    <p className="text-xs text-muted-foreground">
      Select a campaign to enable AI caption generation
    </p>
  )}
</div>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/sm-caption-generator/index.ts` | Edge function to generate captions using Lovable AI |
| `src/hooks/useSMCaptionGenerator.ts` | Hook to invoke the caption generator |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/social-media/ContentList.tsx` | Add Actions column with Edit/Delete, render ContentDetailDrawer |
| `src/components/social-media/AddContentDialog.tsx` | Add "Generate with AI" button for caption |
| `src/components/social-media/ContentDrawer.tsx` | Add "Generate with AI" button for caption |
| `src/components/social-media/ContentDetailDrawer.tsx` | Add "Generate with AI" button for caption |
| `supabase/config.toml` | Add sm-caption-generator function config |

---

## User Experience

### Edit/Delete Flow
1. User views Content List page
2. Each row shows an actions menu (three dots)
3. Click "Edit" → Opens ContentDetailDrawer with full form
4. Click "Delete" → Shows confirmation dialog → Deletes on confirm

### AI Caption Generator Flow
1. User creates/edits content
2. Selects a campaign (required for AI)
3. Clicks "Generate with AI" button
4. AI generates caption based on:
   - Platform type
   - Content title (if provided)
   - Campaign description_brief
   - Campaign do_dont_guidance
   - Campaign default_cta_style
   - Campaign keyword_tags
5. Generated caption populates the textarea
6. User can edit or regenerate as needed

---

## Visual Summary

```
Content List Table
+----------+----------+----------+----------+----------+----------+---------+
| Content  | Platform | Campaign | Upcoming | Last     | Frequency| Actions |
+----------+----------+----------+----------+----------+----------+---------+
| Post #1  | IG       | Weekly   | Feb 10   | Feb 3    | 5        | [...]   |
|          |          |          |          |          |          | > Edit  |
|          |          |          |          |          |          | > Delete|
+----------+----------+----------+----------+----------+----------+---------+

Caption Field with AI Button
+-------------------------------------------+
| Caption                [✨ Generate with AI] |
+-------------------------------------------+
| [                                         ] |
| [    Textarea for caption                 ] |
| [                                         ] |
+-------------------------------------------+
```
