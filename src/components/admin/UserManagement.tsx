import { useState } from 'react';
import { useWorkspaceUsers, WorkspaceUser, PendingInvitation } from '@/hooks/useWorkspaceUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Loader2, Users, Shield, ShieldCheck, User, UserCog, Trash2, Plus, Copy, Check, Pencil, X, Mail } from 'lucide-react';
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
  const { 
    users, 
    pendingInvitations,
    loading, 
    updateUserRole, 
    toggleUserActive, 
    deleteUser,
    updateUserName,
    createInvitation,
    revokeInvitation,
  } = useWorkspaceUsers();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<WorkspaceUser | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('user');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const isSuperAdmin = (targetUser: WorkspaceUser): boolean => {
    return targetUser.role === 'super_admin';
  };

  const canEditRole = (targetUser: WorkspaceUser): boolean => {
    if (targetUser.user_id === user?.id) return false;
    if (!canAssignRole(currentUserRole, 'user')) return false;
    // Super admin guard: non-super_admins cannot edit super_admin users
    if (isSuperAdmin(targetUser) && currentUserRole !== 'super_admin') return false;
    return true;
  };

  const canDelete = (targetUser: WorkspaceUser): boolean => {
    if (targetUser.user_id === user?.id) return false;
    // Super admin guard: cannot delete super_admin
    if (isSuperAdmin(targetUser)) return false;
    return canDeleteRole(currentUserRole, targetUser.role);
  };

  const canToggleActive = (targetUser: WorkspaceUser): boolean => {
    if (targetUser.user_id === user?.id) return false;
    // Super admin guard: cannot deactivate super_admin
    if (isSuperAdmin(targetUser) && currentUserRole !== 'super_admin') return false;
    return canEditRole(targetUser);
  };

  const canEditName = (targetUser: WorkspaceUser): boolean => {
    // Can edit own name or if admin/super_admin
    return targetUser.user_id === user?.id || 
           currentUserRole === 'super_admin' || 
           currentUserRole === 'admin';
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

  const handleCreateInvitation = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsCreatingInvite(true);
    await createInvitation(inviteEmail, inviteRole);
    setIsCreatingInvite(false);
    setInviteEmail('');
    setInviteRole('user');
    setInviteDialogOpen(false);
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartEditName = (workspaceUser: WorkspaceUser) => {
    setEditingUserId(workspaceUser.user_id);
    setEditingName(workspaceUser.full_name || '');
  };

  const handleSaveName = async (userId: string) => {
    if (editingName.trim()) {
      await updateUserName(userId, editingName.trim());
    }
    setEditingUserId(null);
    setEditingName('');
  };

  const handleCancelEditName = () => {
    setEditingUserId(null);
    setEditingName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assignableRoles = ALL_ROLES.filter(r => r !== 'super_admin');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team Members</CardTitle>
            </div>
            {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>
                      Create an invitation code for a new team member. They'll use this code when signing up.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((roleOption) => (
                            <SelectItem 
                              key={roleOption} 
                              value={roleOption}
                              disabled={!canAssignRole(currentUserRole, roleOption)}
                            >
                              <div className="flex items-center gap-2">
                                {ROLE_ICONS[roleOption]}
                                {ROLE_LABELS[roleOption]}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvitation} disabled={isCreatingInvite || !inviteEmail.trim()}>
                      {isCreatingInvite ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Invitation'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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
                  const isTargetSuperAdmin = isSuperAdmin(workspaceUser);
                  const showRoleDropdown = canEditRole(workspaceUser);
                  const showDelete = canDelete(workspaceUser);
                  const showActiveToggle = canToggleActive(workspaceUser);
                  const isEditingThisUser = editingUserId === workspaceUser.user_id;

                  return (
                    <TableRow key={workspaceUser.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            {isEditingThisUser ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-8 w-48"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName(workspaceUser.user_id);
                                    if (e.key === 'Escape') handleCancelEditName();
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleSaveName(workspaceUser.user_id)}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={handleCancelEditName}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {workspaceUser.full_name || 'Unnamed User'}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                  )}
                                </p>
                                {canEditName(workspaceUser) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleStartEditName(workspaceUser)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground">{workspaceUser.email}</p>
                          </div>
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

      {/* Pending Invitations */}
      {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Pending Invitations</CardTitle>
            </div>
            <CardDescription>
              Users who have been invited but haven't signed up yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invitation.role)} className="gap-1">
                        {getRoleIcon(invitation.role)}
                        {ROLE_LABELS[invitation.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {invitation.invite_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCode(invitation.invite_code)}
                        >
                          {copiedCode === invitation.invite_code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revokeInvitation(invitation.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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