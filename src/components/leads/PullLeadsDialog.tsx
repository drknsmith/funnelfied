import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { usePullLeads } from '@/hooks/usePullLeads';
import { usePullConfig } from '@/hooks/usePullConfig';

interface PullLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fallback values if no config exists
const DEFAULT_VERTICALS = [
  { id: 'Multifamily', label: 'Multifamily' },
  { id: 'Boutique Studio', label: 'Boutique Studio' },
  { id: 'Gym', label: 'Gym' },
  { id: 'Country Club', label: 'Country Club' },
];

const DEFAULT_SIGNAL_TYPES = ['New Build', 'Renovation', 'RFP', 'Expansion'];

const LIMIT_OPTIONS = [
  { value: '5', label: '5 leads' },
  { value: '10', label: '10 leads' },
  { value: '20', label: '20 leads' },
];

export function PullLeadsDialog({ open, onOpenChange }: PullLeadsDialogProps) {
  const { data: pullConfig, isLoading: configLoading } = usePullConfig();
  
  const [geography, setGeography] = useState('');
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [signalType, setSignalType] = useState('');
  const [limit, setLimit] = useState('5');

  const pullLeads = usePullLeads();

  // Use config values or fallback to defaults
  const verticals = pullConfig?.verticals?.length 
    ? pullConfig.verticals.map(v => ({ id: v, label: v }))
    : DEFAULT_VERTICALS;
  
  const signalTypes = pullConfig?.signal_types?.length 
    ? pullConfig.signal_types 
    : DEFAULT_SIGNAL_TYPES;

  // Initialize selected values when config loads
  useEffect(() => {
    if (verticals.length > 0 && selectedVerticals.length === 0) {
      setSelectedVerticals([verticals[0].id]);
    }
  }, [verticals, selectedVerticals.length]);

  useEffect(() => {
    if (signalTypes.length > 0 && !signalType) {
      setSignalType(signalTypes[0]);
    }
  }, [signalTypes, signalType]);

  const handleVerticalToggle = (verticalId: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(verticalId)
        ? prev.filter((v) => v !== verticalId)
        : [...prev, verticalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!geography.trim()) {
      return;
    }

    if (selectedVerticals.length === 0) {
      return;
    }

    try {
      await pullLeads.mutateAsync({
        geography: geography.trim(),
        verticals: selectedVerticals,
        signalType,
        limit: parseInt(limit, 10),
        searchContext: pullConfig?.search_context || undefined,
      });
      onOpenChange(false);
      // Reset form
      setGeography('');
      setSelectedVerticals(verticals.length > 0 ? [verticals[0].id] : []);
      setSignalType(signalTypes[0] || 'New Build');
      setLimit('5');
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pull Leads with AI
          </DialogTitle>
          <DialogDescription>
            Search the web for potential leads using AI-powered discovery
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="geography">Geography</Label>
            <Input
              id="geography"
              placeholder="e.g., Texas, Los Angeles, National"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter a city, state, or "National" for broader search
            </p>
          </div>

          <div className="space-y-2">
            <Label>Verticals</Label>
            {configLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {verticals.map((vertical) => (
                  <div key={vertical.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={vertical.id}
                      checked={selectedVerticals.includes(vertical.id)}
                      onCheckedChange={() => handleVerticalToggle(vertical.id)}
                    />
                    <label
                      htmlFor={vertical.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vertical.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signalType">Signal Type</Label>
            <Select value={signalType} onValueChange={setSignalType}>
              <SelectTrigger id="signalType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {signalTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Number of Leads</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger id="limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pullLeads.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pullLeads.isPending || !geography.trim() || selectedVerticals.length === 0}
            >
              {pullLeads.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Pull Leads
                </>
              )}
            </Button>
          </div>
        </form>

        {pullLeads.isPending && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Searching the web and extracting leads...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take 30-60 seconds
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
