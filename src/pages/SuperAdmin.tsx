import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useSuperAdminData } from '@/hooks/useSuperAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Building2, Users, Handshake, Pencil } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

const ROLES = Constants.public.Enums.app_role;

export default function SuperAdmin() {
  const {
    workspaces,
    users,
    stats,
    isLoading,
    createWorkspace,
    updateWorkspace,
    updateUserRole,
    toggleUserActive,
    isCreatingWorkspace,
    isUpdatingWorkspace,
  } = useSuperAdminData();

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all');

  const filteredUsers = workspaceFilter === 'all'
    ? users
    : users.filter((u) => u.workspace_id === workspaceFilter);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setCreateDialogOpen(false);
  };

  const handleUpdateWorkspace = () => {
    if (!editingWorkspace || !editingWorkspace.name.trim()) return;
    updateWorkspace({ id: editingWorkspace.id, name: editingWorkspace.name.trim() });
    setEditingWorkspace(null);
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

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Super Admin Panel</h1>
          <p className="text-muted-foreground">Manage all workspaces and users across the system</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Workspaces
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalWorkspaces}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Deals
                  </CardTitle>
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalDeals}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Workspaces</CardTitle>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Workspace</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Workspace name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateWorkspace} disabled={isCreatingWorkspace}>
                          {isCreatingWorkspace ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.map((workspace) => (
                      <TableRow key={workspace.id}>
                        <TableCell className="font-medium">
                          {editingWorkspace?.id === workspace.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingWorkspace.name}
                                onChange={(e) => setEditingWorkspace({ ...editingWorkspace, name: e.target.value })}
                                className="h-8"
                              />
                              <Button size="sm" onClick={handleUpdateWorkspace} disabled={isUpdatingWorkspace}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingWorkspace(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            workspace.name
                          )}
                        </TableCell>
                        <TableCell>{workspace.user_count}</TableCell>
                        <TableCell>{workspace.deal_count}</TableCell>
                        <TableCell>
                          {editingWorkspace?.id !== workspace.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingWorkspace({ id: workspace.id, name: workspace.name })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users</CardTitle>
                <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces</SelectItem>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || 'No name'}
                        </TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.workspace_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(role: 'super_admin' | 'admin' | 'moderator' | 'user') => updateUserRole({ userId: user.user_id, role })}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(checked) =>
                              toggleUserActive({ profileId: user.id, isActive: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
