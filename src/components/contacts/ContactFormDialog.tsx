import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Contact, useContacts } from '@/hooks/useContacts';
import { useAccounts } from '@/hooks/useAccounts';
import { Loader2 } from 'lucide-react';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  defaultAccountId?: string;
}

const ROLE_TYPES = ['Decision Maker', 'Champion', 'Influencer', 'User'];

export default function ContactFormDialog({ open, onOpenChange, contact, defaultAccountId }: ContactFormDialogProps) {
  const { createContact, updateContact } = useContacts();
  const { accounts } = useAccounts();
  const isEdit = !!contact;

  const [formData, setFormData] = useState({
    account_id: '',
    name: '',
    title: '',
    email: '',
    phone: '',
    role_type: '',
    linkedin_url: '',
    notes: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        account_id: contact.account_id,
        name: contact.name,
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        role_type: contact.role_type || '',
        linkedin_url: contact.linkedin_url || '',
        notes: contact.notes || '',
      });
    } else {
      setFormData({
        account_id: defaultAccountId || '',
        name: '',
        title: '',
        email: '',
        phone: '',
        role_type: '',
        linkedin_url: '',
        notes: '',
      });
    }
  }, [contact, defaultAccountId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      account_id: formData.account_id,
      name: formData.name,
      title: formData.title || null,
      email: formData.email || null,
      phone: formData.phone || null,
      role_type: formData.role_type || null,
      linkedin_url: formData.linkedin_url || null,
      notes: formData.notes || null,
    };

    if (isEdit && contact) {
      await updateContact.mutateAsync({ id: contact.id, ...input });
    } else {
      await createContact.mutateAsync(input);
    }

    onOpenChange(false);
  };

  const isLoading = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_id">Account *</Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Facilities Manager"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_type">Role Type</Label>
            <Select
              value={formData.role_type}
              onValueChange={(value) => setFormData({ ...formData, role_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this contact..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.account_id}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}