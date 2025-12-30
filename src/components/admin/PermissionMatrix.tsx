import { useState } from 'react';
import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, Plus, Pencil, Trash2, Shield, ShieldCheck, UserCog, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_ROLES, ROLE_LABELS, EDITABLE_ROLES } from '@/lib/permissions';

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

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  super_admin: <Shield className="h-4 w-4" />,
  admin: <ShieldCheck className="h-4 w-4" />,
  moderator: <UserCog className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
};

export default function PermissionMatrix() {
  const { permissions, loading, getPermission, togglePermission, resources, actions } = useWorkspacePermissions();
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  const isEditable = EDITABLE_ROLES.includes(selectedRole);

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
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Permission Matrix</CardTitle>
          </div>
          <CardDescription>
            Configure what each role can do in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection Radio Group */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Role to Configure</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as AppRole)}
              className="flex flex-wrap gap-4"
            >
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={`role-${role}`} />
                  <Label 
                    htmlFor={`role-${role}`} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {ROLE_ICONS[role]}
                    {ROLE_LABELS[role]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Permission Matrix for Selected Role */}
          <div className="overflow-x-auto">
            {!isEditable && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <strong>{ROLE_LABELS[selectedRole]}</strong> has full access to all resources. 
                These permissions cannot be modified.
              </div>
            )}
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
                  const perm = getPermission(resource as Resource, selectedRole);
                  
                  return (
                    <TableRow key={resource}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="capitalize">
                          {RESOURCE_LABELS[resource as Resource]}
                        </Badge>
                      </TableCell>
                      {actions.map((action) => {
                        // For non-editable roles, always show checked
                        const isChecked = isEditable ? (perm?.[action] ?? false) : true;
                        
                        return (
                          <TableCell key={action} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isChecked}
                                disabled={!isEditable}
                                onCheckedChange={() => {
                                  if (isEditable) {
                                    togglePermission(resource as Resource, selectedRole, action as Crud);
                                  }
                                }}
                                className={cn(
                                  'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
                                  action === 'can_delete' && 'data-[state=checked]:bg-destructive data-[state=checked]:border-destructive',
                                  !isEditable && 'opacity-50 cursor-not-allowed'
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
