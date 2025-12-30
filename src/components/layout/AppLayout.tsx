import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  MessageSquare,
  BookOpen,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink to={to}>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        {icon}
        <span>{label}</span>
        <ChevronRight
          className={cn(
            'ml-auto h-4 w-4 opacity-0 transition-opacity',
            isActive && 'opacity-100'
          )}
        />
      </div>
    </NavLink>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">Karl's CRM</span>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
            <NavItem to="/deals" icon={<Handshake className="h-4 w-4" />} label="Deals" />
            <NavItem to="/accounts" icon={<Building2 className="h-4 w-4" />} label="Accounts" />
            <NavItem to="/contacts" icon={<Users className="h-4 w-4" />} label="Contacts" />
            <NavItem to="/interactions" icon={<MessageSquare className="h-4 w-4" />} label="Interactions" />
            <NavItem to="/playbooks" icon={<BookOpen className="h-4 w-4" />} label="Playbooks" />
          </nav>

          {isAdmin && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </div>
              <nav className="space-y-1">
                <NavItem to="/admin" icon={<Settings className="h-4 w-4" />} label="Workspace Admin" />
                {isSuperAdmin && (
                  <NavItem to="/super-admin" icon={<Shield className="h-4 w-4" />} label="Super Admin" />
                )}
              </nav>
            </>
          )}
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User Info & Logout */}
        <div className="p-4">
          <div className="mb-3 rounded-lg bg-sidebar-accent p-3">
            <p className="text-sm font-medium text-sidebar-foreground">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
            {role && (
              <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {role.replace('_', ' ')}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}