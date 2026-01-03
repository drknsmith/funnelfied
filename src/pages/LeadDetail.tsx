import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Ban,
  Rocket,
  Building2,
  MapPin,
  Signal,
  Mail,
  MessageSquare,
  ExternalLink,
  User,
  Link2,
} from 'lucide-react';
import { useLead, useUpdateLead } from '@/hooks/useLeads';
import { useLeadContacts } from '@/hooks/useLeadContacts';
import { useAccounts } from '@/hooks/useAccounts';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { StakeholdersList } from '@/components/leads/StakeholdersList';
import { DisqualifyDialog } from '@/components/leads/DisqualifyDialog';
import { ConvertToDealModal } from '@/components/leads/ConvertToDealModal';
import { OwnerSelect } from '@/components/leads/OwnerSelect';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const STATUS_OPTIONS = ['New', 'Reviewing', 'Converted', 'Disqualified'];
const FACILITY_TYPES = ['Multifamily', 'Boutique Studio', 'Gym', 'Country Club'];
const PLAYBOOK_OPTIONS = ['PB2', 'PB3', 'PB4'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id || '');
  const { data: linkedContacts } = useLeadContacts(id || '');
  const { accounts } = useAccounts();
  const updateLead = useUpdateLead();

  const [isEditing, setIsEditing] = useState(false);
  const [showDisqualifyDialog, setShowDisqualifyDialog] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    status: string;
    facility_type: string | null;
    estimated_timeline: string | null;
    recommended_playbook: string | null;
    signal_reason: string | null;
    contact_notes: string | null;
    owner_user_id: string | null;
  } | null>(null);

  // Find matching account for stakeholder → contact creation
  const matchingAccount = accounts?.find(
    (a) => a.name.toLowerCase() === lead?.company?.toLowerCase()
  );

  // Initialize form data when lead loads
  if (lead && !formData) {
    setFormData({
      status: lead.status,
      facility_type: lead.facility_type,
      estimated_timeline: lead.estimated_timeline,
      recommended_playbook: lead.recommended_playbook,
      signal_reason: lead.signal_reason,
      contact_notes: lead.contact_notes,
      owner_user_id: lead.owner_user_id,
    });
  }

  const handleSave = async () => {
    if (!lead || !formData) return;

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        ...formData,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDisqualify = async (reason?: string) => {
    if (!lead) return;

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        status: 'Disqualified',
        signal_reason: reason
          ? `${lead.signal_reason || ''}\n\nDisqualified: ${reason}`.trim()
          : lead.signal_reason,
      });
      setShowDisqualifyDialog(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderSourceLinks = (sourceLinks: Json | null) => {
    if (!sourceLinks) return null;

    let links: string[] = [];
    if (Array.isArray(sourceLinks)) {
      links = sourceLinks.filter((l): l is string => typeof l === 'string');
    } else if (typeof sourceLinks === 'string') {
      links = [sourceLinks];
    }

    if (links.length === 0) return null;

    return (
      <div className="space-y-1">
        {links.map((link, i) => (
          <a
            key={i}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            <ExternalLink className="h-3 w-3" />
            {link.length > 50 ? `${link.slice(0, 50)}...` : link}
          </a>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Lead not found</h2>
            <Button variant="link" onClick={() => navigate('/leads')}>
              Back to Leads
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isConverted = lead.status === 'Converted';
  const isDisqualified = lead.status === 'Disqualified';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {lead.company} – {lead.project_name}
                </h1>
                <LeadStatusBadge status={lead.status} />
              </div>
              <p className="text-muted-foreground">{lead.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConverted && !isDisqualified && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDisqualifyDialog(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Disqualify
                </Button>
                <Button onClick={() => setShowConvertModal(true)}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Convert to Deal
                </Button>
              </>
            )}
            {isConverted && lead.deal_id && (
              <Button onClick={() => navigate(`/deals/${lead.deal_id}`)}>
                View Deal
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Core Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Core Information
              </CardTitle>
              {!isConverted && !isDisqualified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={updateLead.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Owner Field */}
              <div>
                <Label className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner
                </Label>
                {isEditing && formData ? (
                  <div className="mt-1">
                    <OwnerSelect
                      value={formData.owner_user_id}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev!, owner_user_id: v }))
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {lead.owner_user_id ? (
                      <Badge variant="secondary">Assigned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  {isEditing && formData ? (
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev!, status: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{lead.status}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Facility Type</Label>
                  {isEditing && formData ? (
                    <Select
                      value={formData.facility_type || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev!, facility_type: v || null }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACILITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{lead.facility_type || '—'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{lead.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project Name</Label>
                  <p className="font-medium">{lead.project_name}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </Label>
                <p className="font-medium">{lead.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Estimated Timeline</Label>
                  {isEditing && formData ? (
                    <Input
                      value={formData.estimated_timeline || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev!,
                          estimated_timeline: e.target.value || null,
                        }))
                      }
                      placeholder="e.g., Q2 2026"
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{lead.estimated_timeline || '—'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Recommended Playbook</Label>
                  {isEditing && formData ? (
                    <Select
                      value={formData.recommended_playbook || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev!,
                          recommended_playbook: v || null,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select playbook" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYBOOK_OPTIONS.map((pb) => (
                          <SelectItem key={pb} value={pb}>
                            {pb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{lead.recommended_playbook || '—'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Signal className="h-4 w-4" />
                Signal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Signal Reason</Label>
                {isEditing && formData ? (
                  <Textarea
                    value={formData.signal_reason || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev!,
                        signal_reason: e.target.value || null,
                      }))
                    }
                    placeholder="Why this lead looks promising..."
                    className="mt-1"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {lead.signal_reason || '—'}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Source Links</Label>
                {renderSourceLinks(lead.source_links) || (
                  <p className="text-sm text-muted-foreground">No source links</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stakeholders */}
          <StakeholdersList 
            stakeholders={lead.stakeholders_json} 
            leadId={lead.id}
            accountId={matchingAccount?.id}
          />

          {/* Linked Contacts */}
          {linkedContacts && linkedContacts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="h-4 w-4" />
                  Linked Contacts
                  <Badge variant="secondary" className="ml-auto">{linkedContacts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkedContacts.map((lc) => (
                  <div
                    key={lc.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                  >
                    <div>
                      <p className="font-medium">{lc.contact?.name}</p>
                      {lc.contact?.email && (
                        <p className="text-sm text-muted-foreground">{lc.contact.email}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/contacts/${lc.contact_id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && formData ? (
                <Textarea
                  value={formData.contact_notes || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev!,
                      contact_notes: e.target.value || null,
                    }))
                  }
                  placeholder="Notes about contacts/stakeholders..."
                  rows={4}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {lead.contact_notes || 'No contact notes'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Outreach Drafts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                First-touch Email Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap">
                  {lead.first_touch_email || 'No email draft'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                LinkedIn DM Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap">
                  {lead.linkedin_dm || 'No LinkedIn draft'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DisqualifyDialog
        open={showDisqualifyDialog}
        onOpenChange={setShowDisqualifyDialog}
        onConfirm={handleDisqualify}
        leadName={`${lead.company} – ${lead.project_name}`}
      />

      {lead && (
        <ConvertToDealModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          lead={lead}
        />
      )}
    </AppLayout>
  );
}
