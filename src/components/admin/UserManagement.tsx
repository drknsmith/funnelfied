import { useWorkspaceUsers, WorkspaceUser } from '@/hooks/useWorkspaceUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Shield, ShieldCheck, User, UserCog } from 'lucide-react';
import { format } from 'date-fns';

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

const ROLE_OPTIONS: { value: AppRole; label: string; icon: React.ReactNode }[] = [
  { value: 'admin', label: 'Admin', icon: <ShieldCheck className="h-4 w-4" /> },
  { value: 'moderator', label: 'Moderator', icon: <UserCog className="h-4 w-4" /> },
  { value: 'user', label: 'User', icon: <User className="h-4 w-4" /> },
];

function getRoleBadgeVariant(role: AppRole | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'moderator':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getRoleIcon(role: AppRole | null) {
  switch (role) {
    case 'super_admin':
      return <Shield className="h-3 w-3" />;
    case 'admin':
      return <ShieldCheck className="h-3 w-3" />;
    case 'moderator':
      return <UserCog className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
}

export default function UserManagement() {
  const { user, role: currentUserRole } = useAuth();
  const { users, loading, updateUserRole, toggleUserActive } = useWorkspaceUsers();

  const canEditUser = (targetUser: WorkspaceUser): boolean => {
    // Can't edit yourself
    if (targetUser.user_id === user?.id) return false;
    // Super admins can't be edited by non-super-admins
    if (targetUser.role === 'super_admin' && currentUserRole !== 'super_admin') return false;
    // Admins can edit moderators and users
    if (currentUserRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>
            Manage users in your workspace and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found in this workspace
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((workspaceUser) => {
                  const isCurrentUser = workspaceUser.user_id === user?.id;
                  const canEdit = canEditUser(workspaceUser);

                  return (
                    <TableRow key={workspaceUser.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {workspaceUser.full_name || 'Unnamed User'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{workspaceUser.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select
                            value={workspaceUser.role || 'user'}
                            onValueChange={(value) => updateUserRole(workspaceUser.user_id, value as AppRole)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {option.icon}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(workspaceUser.role)} className="gap-1">
                            {getRoleIcon(workspaceUser.role)}
                            {workspaceUser.role?.replace('_', ' ') || 'user'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={workspaceUser.is_active ? 'default' : 'secondary'}>
                          {workspaceUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(workspaceUser.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-muted-foreground">
                              {workspaceUser.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Switch
                              checked={workspaceUser.is_active}
                              onCheckedChange={(checked) => toggleUserActive(workspaceUser.user_id, checked)}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
