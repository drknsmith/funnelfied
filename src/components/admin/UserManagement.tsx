import { useState } from 'react';
import { useWorkspaceUsers, WorkspaceUser } from '@/hooks/useWorkspaceUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Loader2, Users, Shield, ShieldCheck, User, UserCog, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ALL_ROLES, ROLE_LABELS, canDeleteRole, canAssignRole } from '@/lib/permissions';

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  super_admin: <Shield className="h-4 w-4" />,
  admin: <ShieldCheck className="h-4 w-4" />,
  moderator: <UserCog className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
};

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
  const { users, loading, updateUserRole, toggleUserActive, deleteUser } = useWorkspaceUsers();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<WorkspaceUser | null>(null);

  const canEditRole = (targetUser: WorkspaceUser): boolean => {
    // Can't edit yourself
    if (targetUser.user_id === user?.id) return false;
    // Check if current role can assign roles
    if (!canAssignRole(currentUserRole, 'user')) return false;
    return true;
  };

  const canDelete = (targetUser: WorkspaceUser): boolean => {
    // Can't delete yourself
    if (targetUser.user_id === user?.id) return false;
    // Check hierarchy
    return canDeleteRole(currentUserRole, targetUser.role);
  };

  const handleDeleteClick = (workspaceUser: WorkspaceUser) => {
    setUserToDelete(workspaceUser);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.user_id, userToDelete.role);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
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
                  const showRoleDropdown = canEditRole(workspaceUser);
                  const showDelete = canDelete(workspaceUser);
                  const showActiveToggle = canEditRole(workspaceUser);

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
                        {showRoleDropdown ? (
                          <Select
                            value={workspaceUser.role || 'user'}
                            onValueChange={(value) => updateUserRole(workspaceUser.user_id, value as AppRole)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map((roleOption) => {
                                const canAssign = canAssignRole(currentUserRole, roleOption);
                                return (
                                  <SelectItem 
                                    key={roleOption} 
                                    value={roleOption}
                                    disabled={!canAssign}
                                  >
                                    <div className="flex items-center gap-2">
                                      {ROLE_ICONS[roleOption]}
                                      {ROLE_LABELS[roleOption]}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(workspaceUser.role)} className="gap-1">
                            {getRoleIcon(workspaceUser.role)}
                            {ROLE_LABELS[workspaceUser.role || 'user']}
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
                        <div className="flex items-center justify-end gap-2">
                          {showActiveToggle && (
                            <>
                              <span className="text-sm text-muted-foreground">
                                {workspaceUser.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <Switch
                                checked={workspaceUser.is_active}
                                onCheckedChange={(checked) => toggleUserActive(workspaceUser.user_id, checked)}
                              />
                            </>
                          )}
                          {showDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteClick(workspaceUser)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{userToDelete?.full_name || userToDelete?.email}</strong> from the workspace?
              This will deactivate their account and remove their role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
