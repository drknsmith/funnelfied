import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Building2 } from 'lucide-react';

export default function WorkspaceSettings() {
  const { workspaceId } = useAuth();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch current workspace name
  useState(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single();

        if (error) throw error;
        setWorkspaceName(data.name);
      } catch (error) {
        console.error('Error fetching workspace:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchWorkspace();
  });

  const handleSave = async () => {
    if (!workspaceId || !workspaceName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: workspaceName.trim() })
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Workspace settings have been updated',
      });
    } catch (error) {
      console.error('Error saving workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workspace settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Workspace Information</CardTitle>
          </div>
          <CardDescription>
            Manage your workspace name and general settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Workspace ID</Label>
            <p className="text-sm font-mono text-muted-foreground">
              {workspaceId}
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading || !workspaceName.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
