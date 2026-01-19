import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useContact, useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import ContactFormDialog from '@/components/contacts/ContactFormDialog';
import ContactInteractionFormDialog from '@/components/contacts/ContactInteractionFormDialog';
import InteractionList from '@/components/deals/InteractionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil, Mail, Phone, Linkedin, Building2, Loader2, Plus, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const { updateContact } = useContacts();
  const { interactions, createInteraction, deleteInteraction, isCreating, isDeleting } = useInteractions(undefined, id);
  const [editOpen, setEditOpen] = useState(false);
  const [interactionFormOpen, setInteractionFormOpen] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');

  // Sync follow-up fields with contact data
  useState(() => {
    if (contact) {
      setNextAction(contact.next_action || '');
      setNextActionDate(contact.next_action_date || '');
    }
  });

  const handleFollowUpSave = async () => {
    if (!contact) return;
    await updateContact.mutateAsync({
      id: contact.id,
      next_action: nextAction || null,
      next_action_date: nextActionDate || null,
    });
  };

  const handleLogInteraction = (data: any) => {
    createInteraction({
      contact_id: data.contact_id,
      deal_id: null,
      type: data.type,
      occurred_at: data.occurred_at,
      summary: data.summary || null,
      objections: data.objections || null,
      commitments: data.commitments || null,
      next_action: data.next_action || null,
      next_action_date: data.next_action_date || null,
      external_ref: null,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>
          <div className="mt-8 text-center">
            <p className="text-lg text-muted-foreground">Contact not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{contact.name}</h1>
              {contact.role_type && (
                <Badge variant="outline">{contact.role_type}</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{contact.title || 'No title'}</p>
          </div>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.accounts?.name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account</p>
                      <button
                        className="font-medium text-primary hover:underline"
                        onClick={() => navigate(`/accounts/${contact.account_id}`)}
                      >
                        {contact.accounts.name}
                      </button>
                    </div>
                  </div>
                )}

                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${contact.email}`} className="font-medium text-primary hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${contact.phone}`} className="font-medium">
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contact.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}

                {contact.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactions Tab */}
            <Tabs defaultValue="interactions" className="w-full">
              <TabsList>
                <TabsTrigger value="interactions" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Interactions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="interactions">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">Interaction History</CardTitle>
                    <Button size="sm" onClick={() => setInteractionFormOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Log Interaction
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <InteractionList
                      interactions={interactions}
                      onDelete={deleteInteraction}
                      isDeleting={isDeleting}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* Follow-up Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="next_action">Next Action</Label>
                  <Input
                    id="next_action"
                    placeholder="e.g., Send proposal"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    onBlur={handleFollowUpSave}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action_date">Date</Label>
                  <Input
                    id="next_action_date"
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    onBlur={handleFollowUpSave}
                  />
                </div>
                {contact.next_action_date && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled for {format(new Date(contact.next_action_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(contact.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(contact.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
        
        <ContactInteractionFormDialog
          open={interactionFormOpen}
          onOpenChange={setInteractionFormOpen}
          contactId={id || ''}
          onSubmit={handleLogInteraction}
          isLoading={isCreating}
          contactContext={{
            contact_name: contact.name,
            account_name: contact.accounts?.name || 'Unknown',
            title: contact.title || undefined,
          }}
        />
      </div>
    </AppLayout>
  );
}
