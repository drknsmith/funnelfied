import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAccounts, Account } from '@/hooks/useAccounts';
import AccountFormDialog from '@/components/accounts/AccountFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Loader2, X } from 'lucide-react';

export default function Accounts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accounts, isLoading, deleteAccount } = useAccounts();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filter = searchParams.get('filter');

  const filteredAccounts = useMemo(() => {
    let result = accounts;
    
    // Apply expansion filter
    if (filter === 'expansion') {
      result = result.filter((a) => parseInt(a.portfolio_size) > 1);
    }
    
    // Apply search filter
    if (search) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [accounts, filter, search]);

  const clearFilter = () => {
    setSearchParams({});
  };

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAccount.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
              {filter === 'expansion' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Expansion Watch
                  <button onClick={clearFilter} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
              {filter === 'expansion' ? ' with multi-site opportunities' : ''}
            </p>
          </div>
          <Button onClick={() => { setEditAccount(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No accounts yet</p>
              <p className="mb-4 text-muted-foreground">Create your first account to get started</p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Segment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Portfolio</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{account.name}</div>
                      {account.segment && (
                        <div className="text-sm text-muted-foreground">{account.segment}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{account.segment || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {account.portfolio_size} {account.portfolio_size === '1' ? 'site' : 'sites'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={getStatusColor(account.status)}>
                        {account.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(account); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteId(account.id); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AccountFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          account={editAccount}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this account and all associated contacts and deals. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}