import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Building2, User, Handshake, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateLead, Lead } from '@/hooks/useLeads';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConvertToDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

type Step = 'account' | 'contact' | 'deal' | 'confirm';

const DEAL_TYPES = [
  'Single-Site / Fast Turn',
  'Portfolio / Standardization',
  'Design-Led / Early Signal',
  'Retrofit / Upgrade',
];

export function ConvertToDealModal({ open, onOpenChange, lead }: ConvertToDealModalProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const updateLead = useUpdateLead();
  const { playbooks } = usePlaybooks();

  const [step, setStep] = useState<Step>('account');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account step state
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountMode, setAccountMode] = useState<'existing' | 'new'>('new');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState(lead.company);

  // Contact step state
  const [contacts, setContacts] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [contactMode, setContactMode] = useState<'skip' | 'existing' | 'new'>('skip');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Deal step state
  const [dealName, setDealName] = useState(`${lead.company} – ${lead.project_name}`);
  const [dealType, setDealType] = useState('');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');

  // Search existing accounts on mount
  useEffect(() => {
    if (open && profile?.workspace_id) {
      searchAccounts(lead.company);
    }
  }, [open, profile?.workspace_id, lead.company]);

  // Set default deal type based on facility type
  useEffect(() => {
    if (lead.facility_type) {
      if (lead.facility_type === 'Multifamily') {
        setDealType(''); // User should choose
      } else {
        setDealType('Design-Led / Early Signal');
      }
    }
  }, [lead.facility_type]);

  // Map recommended playbook
  useEffect(() => {
    if (lead.recommended_playbook && playbooks) {
      const matchingPlaybook = playbooks.find(
        (pb) => pb.name.includes(lead.recommended_playbook!) || 
                pb.name.toLowerCase().includes(lead.recommended_playbook!.toLowerCase())
      );
      if (matchingPlaybook) {
        setSelectedPlaybookId(matchingPlaybook.id);
      }
    }
  }, [lead.recommended_playbook, playbooks]);

  const searchAccounts = async (searchTerm: string) => {
    if (!profile?.workspace_id) return;

    const { data } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('workspace_id', profile.workspace_id)
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    setAccounts(data || []);
    
    // Auto-select if exact match found
    const exactMatch = data?.find(
      (a) => a.name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (exactMatch) {
      setAccountMode('existing');
      setSelectedAccountId(exactMatch.id);
    }
  };

  const loadContacts = async (accountId: string) => {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('account_id', accountId)
      .limit(20);

    setContacts(data || []);
  };

  const handleAccountNext = async () => {
    if (accountMode === 'existing' && selectedAccountId) {
      await loadContacts(selectedAccountId);
      setStep('contact');
    } else if (accountMode === 'new' && newAccountName) {
      setStep('contact');
    }
  };

  const handleContactNext = () => {
    setStep('deal');
  };

  const handleDealNext = () => {
    if (!dealType) {
      toast.error('Please select a deal type');
      return;
    }
    setStep('confirm');
  };

  const handleConvert = async () => {
    if (!profile?.workspace_id) return;

    setIsSubmitting(true);

    try {
      let accountId = selectedAccountId;
      let contactId: string | null = null;

      // Step 1: Create account if new
      if (accountMode === 'new') {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            name: newAccountName,
            workspace_id: profile.workspace_id,
            owner_user_id: lead.owner_user_id || profile.user_id,
            status: 'active',
            health_score: lead.health_score,
            lat: lead.lat,
            lng: lead.lng,
          })
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Step 2: Create contact if new
      if (contactMode === 'new' && newContactName) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: newContactName,
            email: newContactEmail || null,
            account_id: accountId,
            workspace_id: profile.workspace_id,
            owner_user_id: lead.owner_user_id || profile.user_id,
          })
          .select()
          .single();

        if (contactError) throw contactError;
        contactId = newContact.id;
      } else if (contactMode === 'existing' && selectedContactId) {
        contactId = selectedContactId;
      }

      // Step 3: Create deal
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          account_id: accountId,
          deal_name: dealName,
          deal_type: dealType,
          stage: 'signal_target',
          status: 'open',
          workspace_id: profile.workspace_id,
          owner_user_id: lead.owner_user_id || profile.user_id,
          primary_contact_id: contactId,
          playbook_id: selectedPlaybookId || null,
          next_action: 'Send first-touch email',
          last_meaningful_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Step 4: Update lead status
      await updateLead.mutateAsync({
        id: lead.id,
        status: 'Converted',
        deal_id: newDeal.id,
      });

      toast.success('Lead converted to deal successfully');
      onOpenChange(false);
      navigate(`/deals/${newDeal.id}`);
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNumber = { account: 1, contact: 2, deal: 3, confirm: 4 }[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 pb-4">
          {['Account', 'Contact', 'Deal', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  i + 1 < stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : i + 1 === stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1 < stepNumber ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < 3 && (
                <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[60vh]">
          {/* Step 1: Account Resolution */}
          {step === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Account Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={accountMode}
                  onValueChange={(v) => setAccountMode(v as 'existing' | 'new')}
                >
                  {accounts.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing">Use existing account</Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new">Create new account</Label>
                  </div>
                </RadioGroup>

                {accountMode === 'existing' && accounts.length > 0 && (
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {accountMode === 'new' && (
                  <div>
                    <Label>Account Name</Label>
                    <Input
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="Enter account name"
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleAccountNext}
                    disabled={
                      (accountMode === 'existing' && !selectedAccountId) ||
                      (accountMode === 'new' && !newAccountName)
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Contact Selection */}
          {step === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Primary Contact (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={contactMode}
                  onValueChange={(v) => setContactMode(v as 'skip' | 'existing' | 'new')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip">Skip for now</Label>
                  </div>
                  {contacts.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="contact-existing" />
                      <Label htmlFor="contact-existing">Select existing contact</Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="contact-new" />
                    <Label htmlFor="contact-new">Create new contact</Label>
                  </div>
                </RadioGroup>

                {contactMode === 'existing' && contacts.length > 0 && (
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} {contact.email && `(${contact.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {contactMode === 'new' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Enter contact name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('account')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleContactNext}
                    disabled={
                      contactMode === 'existing' && !selectedContactId
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Deal Configuration */}
          {step === 'deal' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Handshake className="h-4 w-4" />
                  Deal Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Deal Name</Label>
                  <Input
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Deal Type *</Label>
                  <Select value={dealType} onValueChange={setDealType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select deal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lead.facility_type === 'Multifamily' && !dealType && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Please choose between Portfolio/Standardization or Single-Site
                    </p>
                  )}
                </div>

                <div>
                  <Label>Playbook</Label>
                  <Select
                    value={selectedPlaybookId}
                    onValueChange={setSelectedPlaybookId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select playbook (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {playbooks?.map((pb) => (
                        <SelectItem key={pb.id} value={pb.id}>
                          {pb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lead.recommended_playbook && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: {lead.recommended_playbook}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('contact')}>
                    Back
                  </Button>
                  <Button onClick={handleDealNext}>
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Check className="h-4 w-4" />
                  Review & Confirm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-medium">
                      {accountMode === 'new'
                        ? `${newAccountName} (new)`
                        : accounts.find((a) => a.id === selectedAccountId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">
                      {contactMode === 'skip'
                        ? 'None'
                        : contactMode === 'new'
                        ? `${newContactName} (new)`
                        : contacts.find((c) => c.id === selectedContactId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deal Name:</span>
                    <span className="font-medium">{dealName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deal Type:</span>
                    <span className="font-medium">{dealType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">Signal / Target</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Playbook:</span>
                    <span className="font-medium">
                      {selectedPlaybookId
                        ? playbooks?.find((p) => p.id === selectedPlaybookId)?.name
                        : 'None'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('deal')}>
                    Back
                  </Button>
                  <Button onClick={handleConvert} disabled={isSubmitting}>
                    {isSubmitting ? 'Converting...' : 'Convert to Deal'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
