import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';
import {
  useLeadStakeholders,
  LeadStakeholder,
} from '@/hooks/useLeadStakeholders';
import { useLeadContacts, useCreateContactFromStakeholder } from '@/hooks/useLeadContacts';
import { toast } from 'sonner';

interface LegacyStakeholder {
  name?: string;
  title?: string;
  email?: string;
  linkedin?: string;
  role?: string;
  phone?: string;
}

interface StakeholdersListProps {
  stakeholders?: Json | null;
  leadId?: string;
  accountId?: string | null;
}

export function StakeholdersList({ stakeholders, leadId, accountId }: StakeholdersListProps) {
  const { data: dbStakeholders, isLoading } = useLeadStakeholders(leadId || '');
  const { data: linkedContacts } = useLeadContacts(leadId || '');
  const createContact = useCreateContactFromStakeholder();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Get linked contact emails for checking if already linked
  const linkedEmails = new Set(
    linkedContacts?.map((lc) => lc.contact?.email?.toLowerCase()).filter(Boolean)
  );

  // Use database stakeholders if available, otherwise fall back to JSON
  const useDbStakeholders = leadId && dbStakeholders && dbStakeholders.length > 0;

  // Parse legacy JSON stakeholders
  let legacyStakeholders: LegacyStakeholder[] = [];
  if (!useDbStakeholders && stakeholders) {
    if (Array.isArray(stakeholders)) {
      legacyStakeholders = stakeholders as LegacyStakeholder[];
    } else if (typeof stakeholders === 'object') {
      legacyStakeholders = [stakeholders as LegacyStakeholder];
    }
  }

  const hasStakeholders = useDbStakeholders 
    ? dbStakeholders.length > 0 
    : legacyStakeholders.length > 0;

  if (!hasStakeholders && !isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Stakeholders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No stakeholders found</p>
        </CardContent>
      </Card>
    );
  }

  const handleAddToContacts = async (stakeholder: LeadStakeholder | LegacyStakeholder, isDb: boolean) => {
    if (!leadId || !accountId) {
      toast.error('Cannot add contact: Lead must be linked to an account first');
      return;
    }

    const name = isDb 
      ? (stakeholder as LeadStakeholder).stakeholder_name 
      : (stakeholder as LegacyStakeholder).name;

    if (!name) {
      toast.error('Stakeholder must have a name to create a contact');
      return;
    }

    const id = isDb ? (stakeholder as LeadStakeholder).id : `legacy-${name}`;
    setProcessingId(id);

    try {
      await createContact.mutateAsync({
        leadId,
        accountId,
        stakeholderName: name,
        email: isDb 
          ? (stakeholder as LeadStakeholder).email 
          : (stakeholder as LegacyStakeholder).email,
        phone: isDb 
          ? (stakeholder as LeadStakeholder).phone 
          : (stakeholder as LegacyStakeholder).phone,
        title: isDb 
          ? (stakeholder as LeadStakeholder).title 
          : (stakeholder as LegacyStakeholder).title,
        linkedinUrl: isDb 
          ? (stakeholder as LeadStakeholder).linkedin_url 
          : (stakeholder as LegacyStakeholder).linkedin,
        roleType: isDb 
          ? (stakeholder as LeadStakeholder).stakeholder_role_type 
          : (stakeholder as LegacyStakeholder).role,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const isLinked = (email?: string | null) => {
    return email && linkedEmails.has(email.toLowerCase());
  };

  const renderStakeholderCard = (
    stakeholder: LeadStakeholder | LegacyStakeholder,
    index: number,
    isDb: boolean
  ) => {
    const name = isDb 
      ? (stakeholder as LeadStakeholder).stakeholder_name 
      : (stakeholder as LegacyStakeholder).name;
    const title = isDb 
      ? (stakeholder as LeadStakeholder).title 
      : (stakeholder as LegacyStakeholder).title;
    const role = isDb 
      ? (stakeholder as LeadStakeholder).stakeholder_role_type 
      : (stakeholder as LegacyStakeholder).role;
    const email = isDb 
      ? (stakeholder as LeadStakeholder).email 
      : (stakeholder as LegacyStakeholder).email;
    const phone = isDb ? (stakeholder as LeadStakeholder).phone : (stakeholder as LegacyStakeholder).phone;
    const linkedin = isDb 
      ? (stakeholder as LeadStakeholder).linkedin_url 
      : (stakeholder as LegacyStakeholder).linkedin;
    const confidence = isDb ? (stakeholder as LeadStakeholder).confidence : null;
    const id = isDb ? (stakeholder as LeadStakeholder).id : `legacy-${index}`;

    const alreadyLinked = isLinked(email);
    const isProcessing = processingId === id;

    return (
      <div
        key={id}
        className="rounded-lg border bg-muted/30 p-3 space-y-2"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {name && <p className="font-medium">{name}</p>}
            {title && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {title}
              </p>
            )}
            {role && role !== 'Other' && (
              <Badge variant="outline" className="text-xs">
                {role}
              </Badge>
            )}
          </div>
          {confidence && (
            <Badge 
              variant={confidence === 'CONFIRMED' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {confidence === 'CONFIRMED' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {confidence}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {email}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Phone className="h-3 w-3" />
              {phone}
            </a>
          )}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </a>
          )}
        </div>

        {leadId && accountId && name && (
          <div className="pt-2 border-t">
            {alreadyLinked ? (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Linked to Contacts
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddToContacts(stakeholder, isDb)}
                disabled={isProcessing}
                className="h-7 text-xs"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3 mr-1" />
                )}
                Add to Contacts
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Stakeholders
          {hasStakeholders && (
            <Badge variant="secondary" className="ml-auto">
              {useDbStakeholders ? dbStakeholders.length : legacyStakeholders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : useDbStakeholders ? (
          dbStakeholders.map((s, i) => renderStakeholderCard(s, i, true))
        ) : (
          legacyStakeholders.map((s, i) => renderStakeholderCard(s, i, false))
        )}
      </CardContent>
    </Card>
  );
}
