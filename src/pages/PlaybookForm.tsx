import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Copy, X, HelpCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  usePlaybooks,
  usePlaybook,
  PLAYBOOK_DEAL_TYPES,
  PLAYBOOK_STATUSES,
  MERGE_VARIABLES,
  PlaybookFormData,
} from '@/hooks/usePlaybooks';

export default function PlaybookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { playbook, isLoading: isLoadingPlaybook } = usePlaybook(id);
  const { createPlaybook, updatePlaybook, duplicatePlaybook } = usePlaybooks();

  const [formData, setFormData] = useState<PlaybookFormData>({
    name: '',
    status: 'active',
    associated_deal_type: '',
    objective: '',
    trigger: '',
    first_message_email_template: '',
    first_message_linkedin_template: '',
    proof_asset_type: 'url',
    proof_asset_url: '',
    proof_asset_file_ref: '',
    proof_asset_label: '',
    followup_day3_template: '',
    followup_day10_template: '',
    followup_day21_template: '',
    expansion_seed: '',
    exit_rule: '',
    default_nurture_tag: '',
    expedited: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (playbook && isEditing) {
      setFormData({
        name: playbook.name || '',
        status: playbook.status || 'active',
        associated_deal_type: playbook.associated_deal_type || '',
        objective: playbook.objective || '',
        trigger: playbook.trigger || '',
        first_message_email_template: playbook.first_message_email_template || '',
        first_message_linkedin_template: playbook.first_message_linkedin_template || '',
        proof_asset_type: playbook.proof_asset_type || 'url',
        proof_asset_url: playbook.proof_asset_url || '',
        proof_asset_file_ref: playbook.proof_asset_file_ref || '',
        proof_asset_label: playbook.proof_asset_label || '',
        followup_day3_template: playbook.followup_day3_template || '',
        followup_day10_template: playbook.followup_day10_template || '',
        followup_day21_template: playbook.followup_day21_template || '',
        expansion_seed: playbook.expansion_seed || '',
        exit_rule: playbook.exit_rule || '',
        default_nurture_tag: playbook.default_nurture_tag || '',
        expedited: playbook.expedited || false,
      });
    }
  }, [playbook, isEditing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.associated_deal_type) newErrors.associated_deal_type = 'Deal type is required';
    if (!formData.objective?.trim()) newErrors.objective = 'Objective is required';
    if (!formData.first_message_email_template?.trim()) newErrors.first_message_email_template = 'First email template is required';
    if (!formData.first_message_linkedin_template?.trim()) newErrors.first_message_linkedin_template = 'First LinkedIn template is required';
    if (!formData.exit_rule?.trim()) newErrors.exit_rule = 'Exit rule is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (duplicate = false) => {
    if (!validate()) {
      toast({ title: 'Please fix the errors', variant: 'destructive' });
      return;
    }

    try {
      if (isEditing) {
        await updatePlaybook.mutateAsync({ id, ...formData });
        toast({ title: 'Playbook updated successfully' });

        if (duplicate) {
          await duplicatePlaybook.mutateAsync(id);
          toast({ title: 'Playbook duplicated successfully' });
        }
      } else {
        const newPlaybook = await createPlaybook.mutateAsync(formData);
        toast({ title: 'Playbook created successfully' });

        if (duplicate && newPlaybook?.id) {
          await duplicatePlaybook.mutateAsync(newPlaybook.id);
          toast({ title: 'Playbook duplicated successfully' });
        }
      }

      navigate('/playbooks');
    } catch (error: any) {
      toast({ title: error.message || 'Failed to save playbook', variant: 'destructive' });
    }
  };

  const updateField = (field: keyof PlaybookFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingPlaybook) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Playbook' : 'New Playbook'}
          </h1>
          <Button variant="ghost" onClick={() => navigate('/playbooks')}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="space-y-6">
          {/* Section A: Basics */}
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Playbook Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., PB1 - Single Site"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYBOOK_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-type">Associated Deal Type *</Label>
                <Select
                  value={formData.associated_deal_type}
                  onValueChange={(v) => updateField('associated_deal_type', v)}
                >
                  <SelectTrigger id="deal-type" className={errors.associated_deal_type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select deal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYBOOK_DEAL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.associated_deal_type && <p className="text-xs text-destructive">{errors.associated_deal_type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objective * (1-2 sentences)</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => updateField('objective', e.target.value)}
                  placeholder="What is the goal of this playbook?"
                  className={errors.objective ? 'border-destructive' : ''}
                  rows={2}
                />
                {errors.objective && <p className="text-xs text-destructive">{errors.objective}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Textarea
                  id="trigger"
                  value={formData.trigger}
                  onChange={(e) => updateField('trigger', e.target.value)}
                  placeholder="What triggers this playbook? (bullet points welcome)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section B: First Touch Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                First Touch Templates
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Merge Variables:</p>
                    <p className="text-xs">{MERGE_VARIABLES.join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-template">First Email Template *</Label>
                <Textarea
                  id="email-template"
                  value={formData.first_message_email_template}
                  onChange={(e) => updateField('first_message_email_template', e.target.value)}
                  placeholder="Hi {{FirstName}},&#10;&#10;..."
                  className={errors.first_message_email_template ? 'border-destructive' : ''}
                  rows={6}
                />
                {errors.first_message_email_template && <p className="text-xs text-destructive">{errors.first_message_email_template}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin-template">First LinkedIn DM Template *</Label>
                <Textarea
                  id="linkedin-template"
                  value={formData.first_message_linkedin_template}
                  onChange={(e) => updateField('first_message_linkedin_template', e.target.value)}
                  placeholder="Hi {{FirstName}}, I noticed..."
                  className={errors.first_message_linkedin_template ? 'border-destructive' : ''}
                  rows={4}
                />
                {errors.first_message_linkedin_template && <p className="text-xs text-destructive">{errors.first_message_linkedin_template}</p>}
              </div>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-medium mb-1">Available Merge Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {MERGE_VARIABLES.map((v) => (
                    <code key={v} className="text-xs bg-background px-1 py-0.5 rounded">{v}</code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section C: Proof Asset */}
          <Card>
            <CardHeader>
              <CardTitle>Proof Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <RadioGroup
                  value={formData.proof_asset_type}
                  onValueChange={(v) => updateField('proof_asset_type', v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="asset-url" />
                    <Label htmlFor="asset-url" className="cursor-pointer">URL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="asset-file" />
                    <Label htmlFor="asset-file" className="cursor-pointer">File Reference</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.proof_asset_type === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="proof-url">Proof Asset URL</Label>
                  <Input
                    id="proof-url"
                    type="url"
                    value={formData.proof_asset_url}
                    onChange={(e) => updateField('proof_asset_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="proof-file">File Reference</Label>
                  <Input
                    id="proof-file"
                    value={formData.proof_asset_file_ref}
                    onChange={(e) => updateField('proof_asset_file_ref', e.target.value)}
                    placeholder="Path or identifier"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="proof-label">Proof Asset Label (optional)</Label>
                <Input
                  id="proof-label"
                  value={formData.proof_asset_label}
                  onChange={(e) => updateField('proof_asset_label', e.target.value)}
                  placeholder="e.g., Case Study PDF"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section D: Follow-Up Cadence */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Cadence Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="day3">Day 3 Follow-Up Template</Label>
                <Textarea
                  id="day3"
                  value={formData.followup_day3_template}
                  onChange={(e) => updateField('followup_day3_template', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="day10">Day 10 Follow-Up Template</Label>
                <Textarea
                  id="day10"
                  value={formData.followup_day10_template}
                  onChange={(e) => updateField('followup_day10_template', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="day21">Day 21 Follow-Up Template</Label>
                <Textarea
                  id="day21"
                  value={formData.followup_day21_template}
                  onChange={(e) => updateField('followup_day21_template', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section E: Expansion + Exit */}
          <Card>
            <CardHeader>
              <CardTitle>Expansion + Exit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expansion">Expansion Seed Language</Label>
                <Textarea
                  id="expansion"
                  value={formData.expansion_seed}
                  onChange={(e) => updateField('expansion_seed', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exit-rule">Exit Rule *</Label>
                <Textarea
                  id="exit-rule"
                  value={formData.exit_rule}
                  onChange={(e) => updateField('exit_rule', e.target.value)}
                  placeholder="When should this playbook end?"
                  className={errors.exit_rule ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.exit_rule && <p className="text-xs text-destructive">{errors.exit_rule}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nurture-tag">Default Nurture Tag (optional)</Label>
                <Input
                  id="nurture-tag"
                  value={formData.default_nurture_tag}
                  onChange={(e) => updateField('default_nurture_tag', e.target.value)}
                  placeholder="e.g., Portfolio, Retrofit"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section F: Operational Guardrails */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Guardrails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                Standard proposal turnaround is up to 14 days unless expedited.
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expedited">Expedited</Label>
                  <p className="text-xs text-muted-foreground">
                    If enabled, shows warning banner in Deal messages
                  </p>
                </div>
                <Switch
                  id="expedited"
                  checked={formData.expedited}
                  onCheckedChange={(v) => updateField('expedited', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/playbooks')}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={createPlaybook.isPending || updatePlaybook.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Save + Duplicate
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={createPlaybook.isPending || updatePlaybook.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Playbook
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
