import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import WorkspaceSettings from '@/components/admin/WorkspaceSettings';
import UserManagement from '@/components/admin/UserManagement';
import PermissionMatrix from '@/components/admin/PermissionMatrix';
import { Settings, Users, Lock, HelpCircle } from 'lucide-react';

export default function Admin() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admins
  if (!loading && role !== 'admin' && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspace Admin</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your workspace settings, team members, and permissions
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/help')}
          >
            <HelpCircle className="h-4 w-4" />
            Documentation
          </Button>
        </header>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <WorkspaceSettings />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionMatrix />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
