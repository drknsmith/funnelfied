import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Copy, Archive, BookOpen } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePlaybooks, PLAYBOOK_DEAL_TYPES, PLAYBOOK_STATUSES } from '@/hooks/usePlaybooks';
import { format } from 'date-fns';

export default function Playbooks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { playbooks, isLoading, duplicatePlaybook, archivePlaybook } = usePlaybooks({
    search,
    dealType: dealTypeFilter === 'all' ? '' : dealTypeFilter,
    status: statusFilter === 'all' ? '' : statusFilter,
  });

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePlaybook.mutateAsync(id);
      toast({ title: 'Playbook duplicated successfully' });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to duplicate', variant: 'destructive' });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePlaybook.mutateAsync(id);
      toast({ title: 'Playbook archived successfully' });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to archive', variant: 'destructive' });
    }
  };

  const getDealTypeLabel = (value: string | null) => {
    return PLAYBOOK_DEAL_TYPES.find(t => t.value === value)?.label || value || '-';
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Playbooks</h1>
          <Button onClick={() => navigate('/playbooks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Playbook
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, deal type, objective..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={dealTypeFilter} onValueChange={setDealTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Deal Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deal Types</SelectItem>
              {PLAYBOOK_DEAL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PLAYBOOK_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No playbooks yet.</h3>
            <p className="text-muted-foreground mb-4">
              Create your first playbook to get started with structured outreach.
            </p>
            <Button onClick={() => navigate('/playbooks/new')}>
              Create your first playbook
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Deal Type</TableHead>
                  <TableHead className="max-w-[300px]">Objective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playbooks.map((playbook) => (
                  <TableRow key={playbook.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => navigate(`/playbooks/${playbook.id}`)}
                        className="text-primary hover:underline text-left"
                      >
                        {playbook.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDealTypeLabel(playbook.associated_deal_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-muted-foreground">
                        {playbook.objective || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={playbook.status === 'active' ? 'default' : 'secondary'}>
                        {playbook.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(playbook.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/playbooks/${playbook.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/playbooks/${playbook.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(playbook.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleArchive(playbook.id)}
                            disabled={playbook.status === 'archived'}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
