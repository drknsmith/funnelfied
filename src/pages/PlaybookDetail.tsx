import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Copy, Archive, ArrowLeft, Book, FileText, Users } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePlaybook, usePlaybookUsage, usePlaybooks, PLAYBOOK_DEAL_TYPES } from '@/hooks/usePlaybooks';

export default function PlaybookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { playbook, isLoading, error } = usePlaybook(id);
  const { deals, isLoading: isLoadingUsage } = usePlaybookUsage(id);
  const { duplicatePlaybook, archivePlaybook } = usePlaybooks();

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      await duplicatePlaybook.mutateAsync(id);
      toast({ title: 'Playbook duplicated successfully' });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to duplicate', variant: 'destructive' });
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archivePlaybook.mutateAsync(id);
      toast({ title: 'Playbook archived successfully' });
      navigate('/playbooks');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to archive', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !playbook) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Playbook not found</h2>
          <Button onClick={() => navigate('/playbooks')}>Back to Playbooks</Button>
        </div>
      </AppLayout>
    );
  }

  const dealTypeLabel = PLAYBOOK_DEAL_TYPES.find(t => t.value === playbook.associated_deal_type)?.label;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/playbooks')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playbooks
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{playbook.name}</h1>
              <Badge variant={playbook.status === 'active' ? 'default' : 'secondary'}>
                {playbook.status}
              </Badge>
              {dealTypeLabel && (
                <Badge variant="outline">{dealTypeLabel}</Badge>
              )}
            </div>
            {playbook.objective && (
              <p className="text-muted-foreground">{playbook.objective}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/playbooks/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={duplicatePlaybook.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={archivePlaybook.isPending || playbook.status === 'archived'}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage ({deals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objective</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{playbook.objective || 'Not specified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trigger</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{playbook.trigger || 'Not specified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expansion Seed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{playbook.expansion_seed || 'Not specified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exit Rule</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{playbook.exit_rule || 'Not specified'}</p>
                </CardContent>
              </Card>

              {playbook.proof_asset_url && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Proof Asset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={playbook.proof_asset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {playbook.proof_asset_label || playbook.proof_asset_url}
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">First Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {playbook.first_message_email_template || 'Not configured'}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">First LinkedIn Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {playbook.first_message_linkedin_template || 'Not configured'}
                  </pre>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Day 3 Follow-Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md max-h-48 overflow-auto">
                      {playbook.followup_day3_template || 'Not configured'}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Day 10 Follow-Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md max-h-48 overflow-auto">
                      {playbook.followup_day10_template || 'Not configured'}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Day 21 Follow-Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md max-h-48 overflow-auto">
                      {playbook.followup_day21_template || 'Not configured'}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deals Using This Playbook</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : deals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deals are currently using this playbook.</p>
                ) : (
                  <ul className="divide-y">
                    {deals.map((deal: any) => (
                      <li key={deal.id} className="py-3 flex items-center justify-between">
                        <div>
                          <Link
                            to={`/deals/${deal.id}`}
                            className="font-medium hover:underline"
                          >
                            {deal.account?.name || 'Unnamed Deal'}
                          </Link>
                          <Badge variant="outline" className="ml-2">{deal.stage}</Badge>
                        </div>
                        <Badge variant={deal.status === 'open' ? 'default' : 'secondary'}>
                          {deal.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
