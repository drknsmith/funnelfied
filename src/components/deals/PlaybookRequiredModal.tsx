import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { usePlaybooks } from '@/hooks/usePlaybooks';

interface PlaybookRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (playbookId: string) => void;
  targetStage: string;
}

export function PlaybookRequiredModal({
  open,
  onClose,
  onConfirm,
  targetStage,
}: PlaybookRequiredModalProps) {
  const { playbooks } = usePlaybooks({ status: 'active' });
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('');

  const handleConfirm = () => {
    if (selectedPlaybook) {
      onConfirm(selectedPlaybook);
      setSelectedPlaybook('');
    }
  };

  const handleClose = () => {
    setSelectedPlaybook('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a Playbook</DialogTitle>
          <DialogDescription>
            This deal must have a playbook before moving forward.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playbook-select">Select Playbook</Label>
            <Select value={selectedPlaybook} onValueChange={setSelectedPlaybook}>
              <SelectTrigger id="playbook-select">
                <SelectValue placeholder="Choose a playbook" />
              </SelectTrigger>
              <SelectContent>
                {playbooks.map((playbook) => (
                  <SelectItem key={playbook.id} value={playbook.id}>
                    {playbook.name}
                    {playbook.associated_deal_type && (
                      <span className="ml-2 text-muted-foreground">
                        ({playbook.associated_deal_type})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {playbooks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No playbooks available. Please create a playbook first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlaybook}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
