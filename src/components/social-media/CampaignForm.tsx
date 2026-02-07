import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SM_PLATFORMS, DAYS_OF_WEEK, RECURRENCE_FREQUENCIES, WEEKS_OF_MONTH, type SMPlatform, type RecurrenceFrequency, type RecurrenceRule } from '@/lib/socialMediaConstants';
import { useSMCampaigns, type SMCampaign, type CreateCampaignInput } from '@/hooks/useSMCampaigns';
import { useSMScheduleSlots } from '@/hooks/useSMScheduleSlots';

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: SMCampaign | null;
}

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CampaignForm({ open, onOpenChange, campaign }: CampaignFormProps) {
  const { createCampaign, updateCampaign, isCreating, isUpdating } = useSMCampaigns();
  const { generateSlotsForCampaign } = useSMScheduleSlots();
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [descriptionBrief, setDescriptionBrief] = useState('');
  const [platforms, setPlatforms] = useState<SMPlatform[]>([]);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [weekOfMonth, setWeekOfMonth] = useState(1); // Week 1 for monthly
  const [doDontGuidance, setDoDontGuidance] = useState('');
  const [defaultCtaStyle, setDefaultCtaStyle] = useState('');
  const [keywordTags, setKeywordTags] = useState('');

  const isEditing = !!campaign;

  // Reset form when campaign changes
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setColor(campaign.color);
      setDescriptionBrief(campaign.description_brief || '');
      setPlatforms(campaign.platforms);
      setFrequency(campaign.recurrence_rule.frequency);
      setDayOfWeek(campaign.recurrence_rule.day_of_week);
      setWeekOfMonth(campaign.recurrence_rule.week_of_month || 1);
      setDoDontGuidance(campaign.do_dont_guidance || '');
      setDefaultCtaStyle(campaign.default_cta_style || '');
      setKeywordTags(campaign.keyword_tags.join(', '));
    } else {
      setName('');
      setColor(COLOR_OPTIONS[0]);
      setDescriptionBrief('');
      setPlatforms([]);
      setFrequency('weekly');
      setDayOfWeek(1);
      setWeekOfMonth(1);
      setDoDontGuidance('');
      setDefaultCtaStyle('');
      setKeywordTags('');
    }
  }, [campaign, open]);

  const togglePlatform = (platform: SMPlatform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || platforms.length === 0) return;

    const recurrenceRule: RecurrenceRule = {
      frequency,
      day_of_week: dayOfWeek,
      ...(frequency === 'monthly' && { week_of_month: weekOfMonth }),
    };

    const data: CreateCampaignInput = {
      name: name.trim(),
      color,
      description_brief: descriptionBrief.trim() || undefined,
      platforms,
      recurrence_rule: recurrenceRule,
      do_dont_guidance: doDontGuidance.trim() || undefined,
      default_cta_style: defaultCtaStyle.trim() || undefined,
      keyword_tags: keywordTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    };

    if (isEditing) {
      await updateCampaign({ id: campaign.id, ...data });
    } else {
      const newCampaign = await createCampaign(data);
      // Generate schedule slots for the new campaign
      if (newCampaign?.id) {
        await generateSlotsForCampaign(newCampaign.id, platforms, recurrenceRule);
      }
    }

    onOpenChange(false);
  };

  const isSaving = isCreating || isUpdating;
  const isValid = name.trim() && platforms.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
          <DialogDescription>
            Set up a recurring content campaign for your social media channels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Weekly Tips"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Campaign Color *</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SM_PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <label
                    key={p.value}
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={platforms.includes(p.value)}
                      onCheckedChange={() => togglePlatform(p.value)}
                    />
                    <Icon className="h-4 w-4" style={{ color: p.color }} />
                    <span className="text-sm">{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Frequency & Schedule */}
          <div className={`grid gap-4 ${frequency === 'monthly' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week of Month - only shown for monthly frequency */}
            {frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="weekOfMonth">Week</Label>
                <Select
                  value={String(weekOfMonth)}
                  onValueChange={(v) => setWeekOfMonth(parseInt(v))}
                >
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

            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day</Label>
              <Select
                value={String(dayOfWeek)}
                onValueChange={(v) => setDayOfWeek(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description (for AI) */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Campaign Description
              <span className="text-xs text-muted-foreground ml-2">
                (Required for AI suggestions)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the campaign intent, tone, and typical content (1-3 sentences)"
              value={descriptionBrief}
              onChange={(e) => setDescriptionBrief(e.target.value)}
              rows={3}
            />
          </div>

          {/* Optional Fields */}
          <div className="space-y-2">
            <Label htmlFor="guidance">Do/Don't Guidance (Optional)</Label>
            <Textarea
              id="guidance"
              placeholder="Guidelines for content in this campaign..."
              value={doDontGuidance}
              onChange={(e) => setDoDontGuidance(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Default CTA Style (Optional)</Label>
            <Input
              id="cta"
              placeholder="e.g., Learn more at..."
              value={defaultCtaStyle}
              onChange={(e) => setDefaultCtaStyle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Keyword Tags (Optional)</Label>
            <Input
              id="tags"
              placeholder="Comma-separated tags"
              value={keywordTags}
              onChange={(e) => setKeywordTags(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
