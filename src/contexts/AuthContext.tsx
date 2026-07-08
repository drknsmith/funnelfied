import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

interface Profile {
  id: string;
  user_id: string;
  workspace_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
}

interface Workspace {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  workspaceName: string | null;
  activeWorkspaceId: string | null;
  /** The effective workspace ID - use this for all data operations */
  workspaceId: string | null;
  availableWorkspaces: Workspace[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, inviteCode: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile/role fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const userRole = roleData?.role as AppRole ?? null;
      setRole(userRole);

      // For super_admin, check for workspace override and fetch all workspaces
      if (userRole === 'super_admin') {
        const { data: overrideData } = await supabase
          .from('super_admin_workspace_overrides')
          .select('active_workspace_id')
          .eq('user_id', userId)
          .maybeSingle();

        const { data: allWorkspaces } = await supabase
          .from('workspaces')
          .select('id, name')
          .order('name');

        setAvailableWorkspaces(allWorkspaces || []);

        const effectiveWorkspaceId = overrideData?.active_workspace_id || profileData?.workspace_id;
        setActiveWorkspaceId(effectiveWorkspaceId);

        // Fetch workspace name for effective workspace
        if (effectiveWorkspaceId) {
          const { data: wsData } = await supabase
            .from('workspaces')
            .select('name')
            .eq('id', effectiveWorkspaceId)
            .single();
          setWorkspaceName(wsData?.name || null);
        }
      } else if (profileData?.workspace_id) {
        // For non-super_admin, just fetch their workspace name
        setActiveWorkspaceId(profileData.workspace_id);
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', profileData.workspace_id)
          .single();
        setWorkspaceName(wsData?.name || null);
        setAvailableWorkspaces([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string): Promise<boolean> => {
    if (!user || role !== 'super_admin') return false;

    try {
      // Upsert the workspace override
      const { error } = await supabase
        .from('super_admin_workspace_overrides')
        .upsert({
          user_id: user.id,
          active_workspace_id: workspaceId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Verify the upsert succeeded
      const { data: verifyData, error: verifyError } = await supabase
        .from('super_admin_workspace_overrides')
        .select('active_workspace_id')
        .eq('user_id', user.id)
        .single();

      if (verifyError || verifyData?.active_workspace_id !== workspaceId) {
        throw new Error('Workspace switch failed to persist');
      }

      setActiveWorkspaceId(workspaceId);
      const workspace = availableWorkspaces.find(w => w.id === workspaceId);
      setWorkspaceName(workspace?.name || null);

      // Small delay to ensure transaction is fully committed before reload
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Reload page to refresh all data with new workspace context
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error switching workspace:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, inviteCode: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = inviteCode.toUpperCase().trim();

    // First, validate the invite code via secure edge function
    const { data: validateData, error: inviteError } = await supabase.functions.invoke(
      'validate-invitation',
      { body: { invite_code: normalizedCode, email: normalizedEmail } },
    );

    if (inviteError) {
      return { error: new Error('Error validating invite code') };
    }

    const invitation = (validateData as { invitation: { id: string; workspace_id: string; role: 'admin' | 'moderator' | 'super_admin' | 'user'; email: string } | null } | null)?.invitation;
    if (!invitation) {
      return { error: new Error('Invalid or expired invite code. Please check the code and email address.') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // If signup successful and we have a user, create profile + role in the invited workspace
    if (data.user) {
      try {
        // Create the profile in the invitation's workspace
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            workspace_id: invitation.workspace_id,
            full_name: fullName,
            email: normalizedEmail,
          });

        if (profileError) throw profileError;

        // Create the user role with the role from the invitation
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: invitation.role,
          });

        if (roleError) throw roleError;

        // Mark the invitation as used
        const { error: updateError } = await supabase
          .from('pending_invitations')
          .update({ used_at: new Date().toISOString() })
          .eq('id', invitation.id);

        if (updateError) {
          console.error('Error marking invitation as used:', updateError);
        }

      } catch (setupError) {
        console.error('Error setting up user:', setupError);
        return { error: setupError as Error };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setWorkspaceName(null);
    setActiveWorkspaceId(null);
    setAvailableWorkspaces([]);
  };

  // The effective workspace ID - activeWorkspaceId for super_admin, profile.workspace_id otherwise
  const workspaceId = activeWorkspaceId || profile?.workspace_id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        workspaceName,
        activeWorkspaceId,
        workspaceId,
        availableWorkspaces,
        signIn,
        signUp,
        signOut,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}