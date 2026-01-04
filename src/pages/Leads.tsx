import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Inbox, User, Sparkles, Trash2 } from 'lucide-react';
import { useLeads, useDeleteLead, LeadFilters } from '@/hooks/useLeads';
import { useWorkspaceUsers } from '@/hooks/useWorkspaceUsers';
import { useAuth } from '@/contexts/AuthContext';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { PullLeadsDialog } from '@/components/leads/PullLeadsDialog';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['New', 'Reviewing', 'Converted', 'Disqualified'];
const FACILITY_TYPES = ['Multifamily', 'Boutique Studio', 'Gym', 'Country Club'];
const PLAYBOOK_OPTIONS = ['PB2', 'PB3', 'PB4'];

export default function Leads() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [showPullLeadsDialog, setShowPullLeadsDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; company: string } | null>(null);
  
  const deleteLead = useDeleteLead();

  const { data: leads, isLoading } = useLeads(filters);
  const { users } = useWorkspaceUsers();

  // Only admins and super_admins can pull leads
  const canPullLeads = role === 'super_admin' || role === 'admin';

  // Helper to get owner name
  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return null;
    const user = users?.find((u) => u.user_id === ownerId);
    return user?.full_name || 'Unknown';
  };
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Inbox className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Leads</h1>
              <p className="text-muted-foreground">Signals Inbox - Review and convert opportunities</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            {canPullLeads && (
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowPullLeadsDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Pull Leads
              </Button>
            )}
            <Button className="w-full sm:w-auto" onClick={() => setShowNewLeadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] max-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search company, project, location..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  status: v === 'all' ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.facility_type || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  facility_type: v === 'all' ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Facility Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {FACILITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.recommended_playbook || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  recommended_playbook: v === 'all' ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Playbook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Playbooks</SelectItem>
                {PLAYBOOK_OPTIONS.map((pb) => (
                  <SelectItem key={pb} value={pb}>
                    {pb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filters.status || filters.facility_type || filters.recommended_playbook || filters.search) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Facility Type</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Playbook</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No leads found. Create your first lead to get started.
                  </TableCell>
                </TableRow>
              ) : (
                leads?.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="font-medium">{lead.company}</TableCell>
                    <TableCell>
                      {lead.owner_user_id ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{getOwnerName(lead.owner_user_id)}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.facility_type || '—'}</TableCell>
                    <TableCell>{lead.project_name}</TableCell>
                    <TableCell>{lead.location}</TableCell>
                    <TableCell>{lead.recommended_playbook || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadToDelete({ id: lead.id, company: lead.company });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <LeadFormDialog
        open={showNewLeadDialog}
        onOpenChange={setShowNewLeadDialog}
        onSuccess={(id) => navigate(`/leads/${id}`)}
      />

      <PullLeadsDialog 
        open={showPullLeadsDialog} 
        onOpenChange={setShowPullLeadsDialog} 
      />

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the lead for "{leadToDelete?.company}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (leadToDelete) {
                  deleteLead.mutate(leadToDelete.id);
                  setLeadToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
