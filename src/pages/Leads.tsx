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
import { Card } from '@/components/ui/card';
import { Plus, Search, Inbox } from 'lucide-react';
import { useLeads, LeadFilters } from '@/hooks/useLeads';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['New', 'Reviewing', 'Converted', 'Disqualified'];
const FACILITY_TYPES = ['Multifamily', 'Boutique Studio', 'Gym', 'Country Club'];
const PLAYBOOK_OPTIONS = ['PB2', 'PB3', 'PB4'];

export default function Leads() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<LeadFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);

  const { data: leads, isLoading } = useLeads(filters);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Leads</h1>
              <p className="text-muted-foreground">Signals Inbox - Review and convert opportunities</p>
            </div>
          </div>
          <Button onClick={() => setShowNewLeadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
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
                <TableHead>Facility Type</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Playbook</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>{lead.facility_type || '—'}</TableCell>
                    <TableCell>{lead.project_name}</TableCell>
                    <TableCell>{lead.location}</TableCell>
                    <TableCell>{lead.recommended_playbook || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
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
    </AppLayout>
  );
}
