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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, inviteCode: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

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

      setRole(roleData?.role as AppRole ?? null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
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

    // First, validate the invite code
    const { data: invitation, error: inviteError } = await supabase
      .from('pending_invitations')
      .select('*')
      .eq('invite_code', normalizedCode)
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (inviteError) {
      return { error: new Error('Error validating invite code') };
    }

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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
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