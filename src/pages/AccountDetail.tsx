import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAccount, useAccounts } from '@/hooks/useAccounts';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import AccountFormDialog from '@/components/accounts/AccountFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, Users, Handshake, Loader2 } from 'lucide-react';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading } = useAccount(id);
  const { contacts } = useContacts(id);
  const { deals } = useDeals();
  const [editOpen, setEditOpen] = useState(false);

  const accountDeals = deals.filter((d) => d.account_id === id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!account) {
    return (
      <AppLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
          <div className="mt-8 text-center">
            <p className="text-lg text-muted-foreground">Account not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'churned': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{account.name}</h1>
              <Badge variant="outline" className={getStatusColor(account.status)}>
                {account.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{account.segment || 'No segment'}</p>
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
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Size</p>
                  <p className="font-medium">{account.portfolio_size} {account.portfolio_size === '1' ? 'site' : 'sites'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Deal Type</p>
                  <p className="font-medium">{account.deal_type_default?.replace('_', '-') || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buying Motive</p>
                  <p className="font-medium">{account.buying_motive || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(account.created_at).toLocaleDateString()}</p>
                </div>
                {account.expansion_notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Expansion Notes</p>
                    <p className="font-medium">{account.expansion_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacts ({contacts.length})
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/contacts?account=${id}`)}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-muted-foreground">No contacts yet</p>
                ) : (
                  <div className="space-y-3">
                    {contacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.title || contact.email}</p>
                        </div>
                        {contact.role_type && (
                          <Badge variant="outline">{contact.role_type}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Deals ({accountDeals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accountDeals.length === 0 ? (
                  <p className="text-muted-foreground">No deals yet</p>
                ) : (
                  <div className="space-y-3">
                    {accountDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50"
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{deal.stage.replace('_', ' ')}</Badge>
                          <span className="text-sm text-muted-foreground">{deal.deal_size_range || '-'}</span>
                        </div>
                        {deal.next_action && (
                          <p className="mt-2 text-sm">{deal.next_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <AccountFormDialog open={editOpen} onOpenChange={setEditOpen} account={account} />
      </div>
    </AppLayout>
  );
}