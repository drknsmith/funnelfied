import { useState } from 'react';
import { Copy, FileText, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePlaybook } from '@/hooks/usePlaybooks';
import { useInteractions } from '@/hooks/useInteractions';
import { mergeTemplate, getAvailableTemplates } from '@/lib/templateMerge';
import { DealWithRelations } from '@/hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';

interface MessagesTabProps {
  deal: DealWithRelations;
}

export function MessagesTab({ deal }: MessagesTabProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { playbook } = usePlaybook(deal.playbook_id || undefined);
  const { createInteraction, isCreating } = useInteractions(deal.id);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const templates = getAvailableTemplates();

  const getTemplateContent = (templateKey: string): string | null => {
    if (!playbook) return null;
    return (playbook as any)[templateKey] || null;
  };

  const mergedContent = selectedTemplate
    ? mergeTemplate(getTemplateContent(selectedTemplate), {
        contact: deal.contacts,
        account: deal.accounts,
        deal: {
          stage: deal.stage,
          deal_type: deal.deal_type?.join(', ') ?? null,
          deal_size_range: deal.deal_size_range,
          next_action_date: deal.next_action_date,
        },
        currentUser: { full_name: profile?.full_name },
      })
    : '';

  const handleCopy = async () => {
    if (!mergedContent) return;

    try {
      await navigator.clipboard.writeText(mergedContent);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleCreateInteraction = () => {
    if (!mergedContent || !selectedTemplate) return;

    const templateLabel = templates.find(t => t.value === selectedTemplate)?.label || 'Template';
    const isLinkedIn = selectedTemplate.includes('linkedin');

    createInteraction({
      deal_id: deal.id,
      contact_id: deal.primary_contact_id || null,
      type: isLinkedIn ? 'note' : 'email',
      summary: `Draft generated: ${templateLabel}`,
      objections: null,
      commitments: null,
      next_action: null,
      next_action_date: null,
      external_ref: null,
      occurred_at: new Date().toISOString(),
    });
  };

  const handleExport = () => {
    if (!mergedContent) return;

    const templateLabel = templates.find(t => t.value === selectedTemplate)?.label || 'template';
    const blob = new Blob([mergedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deal.accounts?.name || 'deal'}-${templateLabel.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!deal.playbook_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Playbook Assigned</h3>
          <p className="text-muted-foreground">
            Assign a playbook to this deal to access message templates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Draft from Playbook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-select">Select Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => {
                const content = getTemplateContent(template.value);
                return (
                  <SelectItem 
                    key={template.value} 
                    value={template.value}
                    disabled={!content}
                  >
                    {template.label}
                    {!content && ' (not configured)'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <>
            <div className="space-y-2">
              <Label>Preview</Label>
              <Textarea
                value={mergedContent}
                readOnly
                className="min-h-[200px] resize-none font-mono text-sm"
                placeholder="Select a template to see the preview"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCopy}
                disabled={!mergedContent}
                variant="outline"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>

              <Button
                onClick={handleCreateInteraction}
                disabled={!mergedContent || isCreating}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Interaction from Draft
              </Button>

              <Button
                onClick={handleExport}
                disabled={!mergedContent}
                variant="ghost"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export .txt
              </Button>
            </div>
          </>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Using playbook: <span className="font-medium">{playbook?.name}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
