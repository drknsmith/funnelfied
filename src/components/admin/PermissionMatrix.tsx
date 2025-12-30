import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Eye, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Resource = 'accounts' | 'contacts' | 'deals' | 'interactions' | 'playbooks' | 'settings' | 'users';
type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';
type Crud = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';

const RESOURCE_LABELS: Record<Resource, string> = {
  accounts: 'Accounts',
  contacts: 'Contacts',
  deals: 'Deals',
  interactions: 'Interactions',
  playbooks: 'Playbooks',
  settings: 'Settings',
  users: 'Users',
};

const ACTION_ICONS: Record<Crud, React.ReactNode> = {
  can_view: <Eye className="h-4 w-4" />,
  can_create: <Plus className="h-4 w-4" />,
  can_edit: <Pencil className="h-4 w-4" />,
  can_delete: <Trash2 className="h-4 w-4" />,
};

const ACTION_LABELS: Record<Crud, string> = {
  can_view: 'View',
  can_create: 'Create',
  can_edit: 'Edit',
  can_delete: 'Delete',
};

export default function PermissionMatrix() {
  const { permissions, loading, getPermission, togglePermission, resources, actions, editableRoles } = useWorkspacePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editableRoles.map((role) => (
        <Card key={role}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="capitalize">{role} Permissions</CardTitle>
            </div>
            <CardDescription>
              Configure what {role}s can do in your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Resource</TableHead>
                    {actions.map((action) => (
                      <TableHead key={action} className="text-center w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          {ACTION_ICONS[action]}
                          <span className="text-xs">{ACTION_LABELS[action]}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => {
                    const perm = getPermission(resource as Resource, role as AppRole);
                    
                    return (
                      <TableRow key={resource}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="capitalize">
                            {RESOURCE_LABELS[resource as Resource]}
                          </Badge>
                        </TableCell>
                        {actions.map((action) => {
                          const isChecked = perm?.[action] ?? false;
                          
                          return (
                            <TableCell key={action} className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(resource as Resource, role as AppRole, action as Crud)}
                                  className={cn(
                                    'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
                                    action === 'can_delete' && 'data-[state=checked]:bg-destructive data-[state=checked]:border-destructive'
                                  )}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> Super Admins and Admins have full access to all resources and cannot be restricted.
            Only Moderator and User permissions can be customized.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
