import { ReactNode, useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useDeal } from '@/hooks/useDeals';
import { ScribeFloatingButton } from '@/components/chat/ScribeFloatingButton';
import { ScribeChatPanel, ScribeContext } from '@/components/chat/ScribeChatPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  MessageSquare,
  BookOpen,
  FileBox,
  CalendarDays,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  User,
  UserCog,
  HelpCircle,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Download,
  Inbox,
  Loader2,
  Map,
  FileBarChart,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canUseMapping, canUseResearch, canUseSocialMedia } from '@/lib/workspaceFeatures';
import logoPrimary from '@/assets/logo-primary.png';
import logoInverse from '@/assets/logo-inverse.png';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  collapsed?: boolean;
}

function NavItem({ to, icon, label, collapsed }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  const content = (
    <NavLink to={to}>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent',
          collapsed && 'justify-center px-2'
        )}
      >
        {icon}
        {!collapsed && (
          <>
            <span>{label}</span>
            <ChevronRight
              className={cn(
                'ml-auto h-4 w-4 opacity-0 transition-opacity',
                isActive && 'opacity-100'
              )}
            />
          </>
        )}
      </div>
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function getRoleIcon(role: string | null) {
  switch (role) {
    case 'super_admin':
      return <Shield className="h-3.5 w-3.5 text-destructive" />;
    case 'admin':
      return <Settings className="h-3.5 w-3.5 text-primary" />;
    case 'moderator':
      return <UserCog className="h-3.5 w-3.5 text-warning" />;
    default:
      return <User className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getRoleDisplayName(role: string | null, userName: string | null | undefined): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
    default:
      return userName || 'User';
  }
}

function getPageType(pathname: string): ScribeContext['pageType'] {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/deals/')) return 'deal';
  if (pathname === '/deals') return 'other';
  if (pathname.startsWith('/accounts/')) return 'account';
  if (pathname === '/accounts') return 'other';
  if (pathname.startsWith('/contacts/')) return 'contact';
  if (pathname === '/contacts') return 'other';
  if (pathname === '/calendar') return 'calendar';
  if (pathname.startsWith('/playbooks')) return 'playbook';
  if (pathname.startsWith('/assets')) return 'asset';
  if (pathname === '/interactions') return 'interactions';
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) return 'admin';
  return 'other';
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile, role, signOut, workspaceName, availableWorkspaces, switchWorkspace, activeWorkspaceId } = useAuth();
  const { viewMode, setViewMode, canToggleViewMode } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
  
  // Scribe chat state
  const [scribeChatOpen, setScribeChatOpen] = useState(false);
  
  // Extract deal ID from URL if on deal page
  const dealIdMatch = location.pathname.match(/^\/deals\/([^/]+)/);
  const dealId = dealIdMatch ? dealIdMatch[1] : undefined;
  
  // Fetch deal data if on deal page
  const { deal } = useDeal(dealId || '');
  
  // Build Scribe context
  const scribeContext: ScribeContext = useMemo(() => ({
    userName: profile?.full_name || null,
    userRole: role,
    currentPage: location.pathname,
    pageType: getPageType(location.pathname),
    deal: dealId ? deal : undefined,
    workspaceId: profile?.workspace_id || null,
  }), [profile?.full_name, profile?.workspace_id, role, location.pathname, dealId, deal]);
  
  // Sidebar collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // Check if running as standalone PWA
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const canSeeAdmin = role === 'admin' || role === 'super_admin' || role === 'moderator';
  const isSuperAdmin = role === 'super_admin';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Logo & Collapse Toggle */}
          <div className="flex h-16 items-center justify-between px-4">
            {!isCollapsed && (
              <img
                src={theme === 'dark' ? logoInverse : logoPrimary}
                alt="Funnelfied"
                className="h-8 w-auto"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="h-8 w-8 shrink-0"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" collapsed={isCollapsed} />
              <NavItem to="/leads" icon={<Inbox className="h-4 w-4" />} label="Leads" collapsed={isCollapsed} />
              <NavItem to="/deals" icon={<Handshake className="h-4 w-4" />} label="Deals" collapsed={isCollapsed} />
              <NavItem to="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="Calendar" collapsed={isCollapsed} />
              <NavItem to="/accounts" icon={<Building2 className="h-4 w-4" />} label="Accounts" collapsed={isCollapsed} />
              <NavItem to="/contacts" icon={<Users className="h-4 w-4" />} label="Contacts" collapsed={isCollapsed} />
              <NavItem to="/interactions" icon={<MessageSquare className="h-4 w-4" />} label="Interactions" collapsed={isCollapsed} />
              <NavItem to="/playbooks" icon={<BookOpen className="h-4 w-4" />} label="Playbooks" collapsed={isCollapsed} />
              <NavItem to="/assets" icon={<FileBox className="h-4 w-4" />} label="Assets" collapsed={isCollapsed} />
              {canUseMapping(activeWorkspaceId) && (
                <NavItem to="/mapping" icon={<Map className="h-4 w-4" />} label="Mapping" collapsed={isCollapsed} />
              )}
{canUseResearch(activeWorkspaceId) && (
                <NavItem to="/research" icon={<FileBarChart className="h-4 w-4" />} label="Research" collapsed={isCollapsed} />
              )}
              {canUseSocialMedia(activeWorkspaceId) && (
                <NavItem to="/social-media" icon={<Share2 className="h-4 w-4" />} label="Social Media" collapsed={isCollapsed} />
              )}
            </nav>

            {/* View Mode Toggle - Only visible for admin/super_admin */}
            {canToggleViewMode && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                {!isCollapsed ? (
                  <div className="rounded-lg bg-sidebar-accent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {viewMode === 'my' ? (
                          <User className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                        <Label htmlFor="view-mode-toggle" className="text-sm font-medium cursor-pointer">
                          {viewMode === 'my' ? 'My Data' : 'Team Data'}
                        </Label>
                      </div>
                      <Switch
                        id="view-mode-toggle"
                        checked={viewMode === 'team'}
                        onCheckedChange={(checked) => setViewMode(checked ? 'team' : 'my')}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {viewMode === 'my' ? 'Viewing your records only' : 'Viewing all team records'}
                    </p>
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode(viewMode === 'my' ? 'team' : 'my')}
                        className={cn(
                          'mx-auto',
                          viewMode === 'team' && 'text-primary'
                        )}
                      >
                        {viewMode === 'my' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {viewMode === 'my' ? 'My Data' : 'Team Data'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}

            {canSeeAdmin && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                {!isCollapsed && (
                  <div className="mb-2 px-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin
                    </div>
                    {workspaceName && (
                      <div className="mt-1 text-xs text-primary font-medium truncate">
                        {workspaceName}
                      </div>
                    )}
                  </div>
                )}
                <nav className="space-y-1">
                  <NavItem to="/admin" icon={<Settings className="h-4 w-4" />} label="Workspace Admin" collapsed={isCollapsed} />
                  {isSuperAdmin && (
                    <NavItem to="/super-admin" icon={<Shield className="h-4 w-4" />} label="Super Admin" collapsed={isCollapsed} />
                  )}
                </nav>
                
                {/* Workspace Switcher for Super Admin */}
                {isSuperAdmin && availableWorkspaces.length > 1 && !isCollapsed && (
                  <div className="mt-3 px-1">
                    <Select
                      value={activeWorkspaceId || ''}
                      onValueChange={async (workspaceId) => {
                        if (workspaceId === activeWorkspaceId) return;
                        setIsSwitchingWorkspace(true);
                        toast.info('Switching workspace...');
                        const success = await switchWorkspace(workspaceId);
                        if (!success) {
                          setIsSwitchingWorkspace(false);
                          toast.error('Failed to switch workspace');
                        }
                      }}
                      disabled={isSwitchingWorkspace}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        {isSwitchingWorkspace ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Switching...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Switch workspace" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {availableWorkspaces.map((ws) => (
                          <SelectItem key={ws.id} value={ws.id} className="text-xs">
                            {ws.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </ScrollArea>

          <Separator className="bg-sidebar-border" />

          {/* User Info & Logout */}
          <div className={cn('p-4', isCollapsed && 'p-2')}>
            {!isCollapsed ? (
              <>
                <div className="mb-3 rounded-lg bg-sidebar-accent p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {profile?.full_name || 'User'}
                    </p>
                    {getRoleIcon(role)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {role && (
                    <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {getRoleDisplayName(role, profile?.full_name)}
                    </span>
                  )}
                </div>

                {/* Refresh Button (visible in PWA mode) */}
                {isStandalone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 w-full justify-start gap-2 text-muted-foreground"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                )}

                {/* Get the App Link - Always visible when not standalone */}
                {!isStandalone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => navigate('/install')}
                  >
                    <Download className="h-4 w-4" />
                    Get the App
                  </Button>
                )}

                {/* Help Center Link */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => navigate('/help')}
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </Button>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 w-full justify-start gap-2 text-muted-foreground"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                {isStandalone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Refresh</TooltipContent>
                  </Tooltip>
                )}
                {!isStandalone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate('/install')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Get the App</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/help')}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Help Center</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:text-destructive">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Global Scribe Floating Button & Chat Panel */}
      <ScribeFloatingButton 
        onClick={() => setScribeChatOpen(true)} 
        isOpen={scribeChatOpen} 
      />
      <ScribeChatPanel
        context={scribeContext}
        isOpen={scribeChatOpen}
        onClose={() => setScribeChatOpen(false)}
      />
    </div>
  );
}
