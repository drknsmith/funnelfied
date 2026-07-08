import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAccount, useAccounts } from '@/hooks/useAccounts';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useTrainers, usePullTrainers } from '@/hooks/useTrainers';
import { useAuth } from '@/contexts/AuthContext';
import AccountFormDialog from '@/components/accounts/AccountFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HealthScoreDot } from '@/components/ui/HealthScoreDot';
import { ArrowLeft, Pencil, Users, Handshake, Loader2, UserSearch, Mail, Phone, Linkedin, ExternalLink, Plus, Instagram, Globe, MapPin } from 'lucide-react';

// Treneur workspace ID
const TRENEUR_WORKSPACE_ID = "14e69d30-13a2-45c0-bcea-0ebe6e638b47";

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspaceId } = useAuth();
  const { data: account, isLoading } = useAccount(id);
  const { contacts } = useContacts(id);
  const { deals } = useDeals();
  const { stages } = usePipelineStages();
  const { data: trainers, isLoading: trainersLoading } = useTrainers(id);
  const pullTrainers = usePullTrainers();
  const [editOpen, setEditOpen] = useState(false);

  const accountDeals = deals.filter((d) => d.account_id === id);
  const isTreneurWorkspace = activeWorkspaceId === TRENEUR_WORKSPACE_ID;

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

  const handlePullTrainers = async () => {
    if (!id) return;
    await pullTrainers.mutateAsync({ accountId: id });
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
              {(account as any).health_score && (
                <HealthScoreDot score={(account as any).health_score} showScore size="lg" />
              )}
            </div>
            <p className="text-muted-foreground">{account.segment || 'No segment'}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Pull Trainers button - only for Treneur workspace */}
            {isTreneurWorkspace && (
              <Button 
                variant="outline" 
                onClick={handlePullTrainers}
                disabled={pullTrainers.isPending}
              >
                {pullTrainers.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserSearch className="mr-2 h-4 w-4" />
                )}
                {pullTrainers.isPending ? 'Searching...' : 'Pull Trainers'}
              </Button>
            )}
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {isTreneurWorkspace && (
                  <div>
                    <p className="text-sm text-muted-foreground">Segment</p>
                    <p className="font-medium">{account.segment || '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Size</p>
                  <p className="font-medium">{account.portfolio_size} {account.portfolio_size === '1' ? 'site' : 'sites'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isTreneurWorkspace ? 'Business Model' : 'Default Deal Type'}</p>
                  <p className="font-medium">{account.deal_type_default?.replace('_', '-') || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isTreneurWorkspace ? 'Status' : 'Created'}</p>
                  <p className="font-medium">{isTreneurWorkspace ? (account.status || '-') : new Date(account.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isTreneurWorkspace ? 'Require Client Memberships' : 'Buying Motive'}</p>
                  <p className="font-medium">{account.buying_motive || '-'}</p>
                </div>
                {(account as any).email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${(account as any).email}`} className="font-medium flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      {(account as any).email}
                    </a>
                  </div>
                )}
                {(account as any).phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${(account as any).phone}`} className="font-medium flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {(account as any).phone}
                    </a>
                  </div>
                )}
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

            {/* Nearby Trainers - Only for Treneur workspace */}
            {isTreneurWorkspace && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserSearch className="h-5 w-5" />
                    Nearby Trainers ({trainers?.length || 0})
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handlePullTrainers}
                    disabled={pullTrainers.isPending}
                  >
                    {pullTrainers.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Pull More'
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {trainersLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !trainers || trainers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No trainers found yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePullTrainers}
                        disabled={pullTrainers.isPending}
                      >
                        <UserSearch className="mr-2 h-4 w-4" />
                        Search for Trainers
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainers.map((trainer) => (
                        <div key={trainer.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{trainer.name}</p>
                              {trainer.career_health_score && (
                                <HealthScoreDot score={trainer.career_health_score} showScore size="sm" />
                              )}
                            </div>
                          </div>
                          
                          {/* Contact info */}
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {trainer.email && (
                              <a href={`mailto:${trainer.email}`} className="flex items-center gap-1 hover:text-foreground">
                                <Mail className="h-3 w-3" />
                                {trainer.email}
                              </a>
                            )}
                            {trainer.phone && (
                              <a href={`tel:${trainer.phone}`} className="flex items-center gap-1 hover:text-foreground">
                                <Phone className="h-3 w-3" />
                                {trainer.phone}
                              </a>
                            )}
                            {trainer.linkedin_url && (
                              <a 
                                href={trainer.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                <Linkedin className="h-3 w-3" />
                                LinkedIn
                              </a>
                            )}
                            {trainer.instagram_url && (
                              <a 
                                href={trainer.instagram_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                <Instagram className="h-3 w-3" />
                                Instagram
                              </a>
                            )}
                            {trainer.website_url && (
                              <a 
                                href={trainer.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                            {trainer.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {trainer.address}
                              </span>
                            )}
                          </div>

                          {/* Career mentions */}
                          {trainer.career_mentions && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {trainer.career_mentions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Opportunities ({accountDeals.length})
                </CardTitle>
                <Button size="sm" onClick={() => navigate(`/deals/new?account_id=${id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Opportunity
                </Button>
              </CardHeader>
              <CardContent>
                {accountDeals.length === 0 ? (
                  <p className="text-muted-foreground">No deals yet</p>
                ) : (
                  <div className="space-y-3">
                    {accountDeals.map((deal) => {
                      const stageLabel = stages.find(s => s.value === deal.stage)?.label || deal.stage.replace('_', ' ');
                      return (
                        <div
                          key={deal.id}
                          className="cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50"
                          onClick={() => navigate(`/deals/${deal.id}`)}
                        >
                          {deal.deal_name && (
                            <p className="font-medium text-sm mb-1">{deal.deal_name}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{stageLabel}</Badge>
                            <span className="text-sm text-muted-foreground">{deal.deal_size_range || '-'}</span>
                          </div>
                          {deal.next_action && (
                            <p className="mt-2 text-sm">{deal.next_action}</p>
                          )}
                        </div>
                      );
                    })}
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
