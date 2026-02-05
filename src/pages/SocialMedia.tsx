import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canUseSocialMedia } from '@/lib/workspaceFeatures';
import AppLayout from '@/components/layout/AppLayout';
import { CalendarDays, Megaphone, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/social-media', label: 'Content Calendar', icon: CalendarDays, exact: true },
  { to: '/social-media/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/social-media/assets', label: 'Asset Library', icon: ImageIcon },
];

export default function SocialMedia() {
  const { activeWorkspaceId } = useAuth();
  const location = useLocation();

  if (!canUseSocialMedia(activeWorkspaceId)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Sub-navigation tabs */}
        <div className="border-b bg-background">
          <div className="px-6">
            <nav className="flex gap-1 -mb-px">
              {tabs.map((tab) => {
                const isActive = tab.exact 
                  ? location.pathname === tab.to
                  : location.pathname.startsWith(tab.to);
                const Icon = tab.icon;
                
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </AppLayout>
  );
}
