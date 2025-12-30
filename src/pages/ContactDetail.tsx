import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useContact, useContacts } from '@/hooks/useContacts';
import ContactFormDialog from '@/components/contacts/ContactFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Mail, Phone, Linkedin, Building2, Loader2 } from 'lucide-react';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const [editOpen, setEditOpen] = useState(false);

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
          <div className="lg:col-span-2">
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
          </div>

          <div>
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
      </div>
    </AppLayout>
  );
}