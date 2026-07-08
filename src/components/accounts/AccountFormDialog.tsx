import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Account, useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { isTreneurWorkspace, isRedLoftWorkspace } from '@/lib/workspaceFeatures';
import { Loader2 } from 'lucide-react';

const SEGMENTS = ['Enterprise', 'Mid-Market', 'SMB'];
const TRENEUR_SEGMENTS = ['Boutique Gym', 'Yoga Studio', 'Pilates Studio', 'Big Box Gym', 'Martial Arts/Boxing', 'Student Rec Center', 'Corporate Wellness'];
const PORTFOLIO_SIZES = ['1', '2-5', '6-20', '20+'];
const DEAL_TYPES = ['portfolio', 'design_led', 'transactional', 'other'];
const REDLOFT_DEAL_TYPES = ['programming', 'design', 'policy'];
const TRENEUR_BUSINESS_MODELS = ['Hire Trainers', 'Rent to Trainers', 'Hybrid'];
const STATUSES = ['active', 'inactive', 'churned'];
const MEMBERSHIP_OPTIONS = ['Yes', 'No', 'Unknown'] as const;
interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

export default function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const { createAccount, updateAccount } = useAccounts();
  const { activeWorkspaceId } = useAuth();
  const isTreneur = isTreneurWorkspace(activeWorkspaceId);
  const isRedLoft = isRedLoftWorkspace(activeWorkspaceId);
  const isEdit = !!account;

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    segment: '',
    portfolio_size: '1',
    deal_type_default: '',
    buying_motive: '',
    status: 'active',
    expansion_notes: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        location: account.location || '',
        segment: account.segment || '',
        portfolio_size: account.portfolio_size,
        deal_type_default: account.deal_type_default || '',
        buying_motive: account.buying_motive || '',
        status: account.status,
        expansion_notes: account.expansion_notes || '',
        email: (account as any).email || '',
        phone: (account as any).phone || '',
      });
    } else {
      setFormData({
        name: '',
        location: '',
        segment: '',
        portfolio_size: '1',
        deal_type_default: '',
        buying_motive: '',
        status: 'active',
        expansion_notes: '',
        email: '',
        phone: '',
      });
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      name: formData.name,
      location: formData.location || null,
      segment: formData.segment || null,
      portfolio_size: formData.portfolio_size,
      deal_type_default: formData.deal_type_default || null,
      buying_motive: formData.buying_motive || null,
      status: formData.status,
      expansion_notes: formData.expansion_notes || null,
      email: formData.email || null,
      phone: formData.phone || null,
    };

    if (isEdit && account) {
      await updateAccount.mutateAsync({ id: account.id, ...input });
    } else {
      await createAccount.mutateAsync(input);
    }

    onOpenChange(false);
  };

  const isLoading = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Account' : 'Create Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Corp"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, State (e.g., Atlanta, GA)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <Select
                value={formData.segment}
                onValueChange={(value) => setFormData({ ...formData, segment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  {(isTreneur ? TRENEUR_SEGMENTS : SEGMENTS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio_size">Portfolio Size</Label>
              <Select
                value={formData.portfolio_size}
                onValueChange={(value) => setFormData({ ...formData, portfolio_size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>{s} {s === '1' ? 'site' : 'sites'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_type_default">{isTreneur ? 'Business Model' : 'Default Opportunity Type'}</Label>
              <Select
                value={formData.deal_type_default}
                onValueChange={(value) => setFormData({ ...formData, deal_type_default: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isTreneur ? 'Select model' : 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  {(isTreneur ? TRENEUR_BUSINESS_MODELS : isRedLoft ? REDLOFT_DEAL_TYPES : DEAL_TYPES).map((t) => (
                    <SelectItem key={t} value={t}>{isTreneur ? t : isRedLoft ? t.charAt(0).toUpperCase() + t.slice(1) : t.replace('_', '-')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isTreneur ? (
            <div className="space-y-2">
              <Label>Require Client Memberships</Label>
              <div className="flex items-center gap-6 pt-1">
                {MEMBERSHIP_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.buying_motive === opt}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, buying_motive: checked ? opt : '' })
                      }
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="buying_motive">Buying Motive</Label>
              <Input
                id="buying_motive"
                value={formData.buying_motive}
                onChange={(e) => setFormData({ ...formData, buying_motive: e.target.value })}
                placeholder="New build, renovation, expansion..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expansion_notes">Expansion Notes</Label>
            <Textarea
              id="expansion_notes"
              value={formData.expansion_notes}
              onChange={(e) => setFormData({ ...formData, expansion_notes: e.target.value })}
              placeholder="Notes about potential expansion opportunities..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}