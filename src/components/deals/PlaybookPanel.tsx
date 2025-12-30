import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Book, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlaybooks, PLAYBOOK_DEAL_TYPES } from '@/hooks/usePlaybooks';
import { DealWithRelations } from '@/hooks/useDeals';

interface PlaybookPanelProps {
  deal: DealWithRelations;
  onUpdate: (updates: Partial<DealWithRelations>) => void;
  isUpdating?: boolean;
}

export function PlaybookPanel({ deal, onUpdate, isUpdating }: PlaybookPanelProps) {
  const { playbooks } = usePlaybooks({ status: 'active' });
  const [localNextAction, setLocalNextAction] = useState(deal.next_action || '');
  const [localNextActionDate, setLocalNextActionDate] = useState(deal.next_action_date || '');

  useEffect(() => {
    setLocalNextAction(deal.next_action || '');
    setLocalNextActionDate(deal.next_action_date || '');
  }, [deal.next_action, deal.next_action_date]);

  const handlePlaybookChange = (playbookId: string) => {
    onUpdate({
      playbook_id: playbookId || null,
    });
  };

  const handleNextActionBlur = () => {
    if (localNextAction !== deal.next_action) {
      onUpdate({ next_action: localNextAction || null });
    }
  };

  const handleNextActionDateChange = (date: string) => {
    setLocalNextActionDate(date);
    onUpdate({ next_action_date: date || null });
  };

  const selectedPlaybook = playbooks.find(p => p.id === deal.playbook_id);
  const isSignalTarget = deal.stage === 'signal_target';
  const needsPlaybook = !isSignalTarget && !deal.playbook_id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Book className="h-4 w-4" />
          Playbook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsPlaybook && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>A playbook is required for deals past Signal Target stage.</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="playbook">Assigned Playbook</Label>
          <Select
            value={deal.playbook_id || ''}
            onValueChange={handlePlaybookChange}
            disabled={isUpdating}
          >
            <SelectTrigger id="playbook">
              <SelectValue placeholder="Select a playbook" />
            </SelectTrigger>
            <SelectContent>
              {playbooks.map((playbook) => (
                <SelectItem key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-type">Deal Type</Label>
          <Select
            value={deal.deal_type || ''}
            onValueChange={(value) => onUpdate({ deal_type: value || null })}
            disabled={isUpdating}
          >
            <SelectTrigger id="deal-type">
              <SelectValue placeholder="Select deal type" />
            </SelectTrigger>
            <SelectContent>
              {PLAYBOOK_DEAL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next-action">Next Action</Label>
          <Input
            id="next-action"
            value={localNextAction}
            onChange={(e) => setLocalNextAction(e.target.value)}
            onBlur={handleNextActionBlur}
            placeholder="What's the next step?"
            disabled={isUpdating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next-action-date">Next Action Date</Label>
          <Input
            id="next-action-date"
            type="date"
            value={localNextActionDate}
            onChange={(e) => handleNextActionDateChange(e.target.value)}
            disabled={isUpdating}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Last Meaningful Activity</Label>
          <p className="text-sm">
            {deal.last_meaningful_activity_date
              ? format(new Date(deal.last_meaningful_activity_date), 'MMM d, yyyy')
              : 'No activity recorded'}
          </p>
        </div>

        {selectedPlaybook && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Playbook: {selectedPlaybook.name}
              {selectedPlaybook.associated_deal_type && (
                <span className="ml-2">
                  ({PLAYBOOK_DEAL_TYPES.find(t => t.value === selectedPlaybook.associated_deal_type)?.label})
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
