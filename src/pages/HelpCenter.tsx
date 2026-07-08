import { useRef, useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  Shield,
  Lock,
  ChevronUp,
  Target,
  Phone,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  UserCog,
  User,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'getting-started', label: 'Getting Started', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'navigation', label: 'Navigation Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'workspaces', label: 'Understanding Workspaces', icon: <Building2 className="h-4 w-4" /> },
  { id: 'roles', label: 'User Roles & Permissions', icon: <Shield className="h-4 w-4" /> },
  { id: 'managing-users', label: 'Managing Users', icon: <Users className="h-4 w-4" /> },
  { id: 'permission-matrix', label: 'Permission Matrix', icon: <Lock className="h-4 w-4" /> },
  { id: 'crm-objects', label: 'Core CRM Objects', icon: <Handshake className="h-4 w-4" /> },
  { id: 'pipeline', label: 'Sales Pipeline Workflow', icon: <Target className="h-4 w-4" /> },
  { id: 'stages', label: 'Deal Stages Explained', icon: <ArrowRight className="h-4 w-4" /> },
  { id: 'playbooks', label: 'Playbooks', icon: <FileText className="h-4 w-4" /> },
  { id: 'super-admin', label: 'Super Admin Features', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'tips', label: 'Tips & Best Practices', icon: <Lightbulb className="h-4 w-4" /> },
];

export default function HelpCenter() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;

      const sections = TOC_ITEMS.map(item => document.getElementById(item.id));
      const scrollPosition = mainRef.current.scrollTop + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(TOC_ITEMS[i].id);
          break;
        }
      }
    };

    const mainElement = mainRef.current;
    mainElement?.addEventListener('scroll', handleScroll);
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && mainRef.current) {
      mainRef.current.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Sidebar Table of Contents */}
        <aside className="hidden lg:block w-64 border-r border-border bg-muted/30 p-4">
          <div className="sticky top-0">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation
            </h2>
            <ScrollArea className="h-[calc(100vh-180px)]">
              <nav className="space-y-1">
                {TOC_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <div ref={mainRef} className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
              <p className="mt-2 text-muted-foreground">
                Everything you need to know about using Funnelfied CRM
              </p>
            </header>

            {/* Getting Started */}
            <section id="getting-started">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle>Getting Started</CardTitle>
                  </div>
                  <CardDescription>Welcome to Funnelfied CRM</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Funnelfied is a modern CRM designed to help you manage your sales pipeline, 
                    track deals, and maintain relationships with your accounts and contacts.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">First Time Login</h4>
                      <p className="text-sm text-muted-foreground">
                        After logging in, you'll be taken to your Dashboard where you can see 
                        key metrics and quick access to your deals and accounts.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Your Dashboard</h4>
                      <p className="text-sm text-muted-foreground">
                        The Dashboard shows open deals, accounts needing attention, 
                        and actions scheduled for today.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Navigation Overview */}
            <section id="navigation">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <CardTitle>Navigation Overview</CardTitle>
                  </div>
                  <CardDescription>Understanding the sidebar menu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { icon: <LayoutDashboard className="h-4 w-4" />, name: 'Dashboard', desc: 'Your command center with key metrics and quick actions' },
                      { icon: <Handshake className="h-4 w-4" />, name: 'Deals', desc: 'Kanban-style pipeline board to manage your opportunities' },
                      { icon: <Building2 className="h-4 w-4" />, name: 'Accounts', desc: 'Company-level records you\'re selling to' },
                      { icon: <Users className="h-4 w-4" />, name: 'Contacts', desc: 'Individual stakeholders at your accounts' },
                      { icon: <MessageSquare className="h-4 w-4" />, name: 'Interactions', desc: 'Activity logs including calls, emails, and meetings' },
                      { icon: <FileText className="h-4 w-4" />, name: 'Playbooks', desc: 'Structured templates for consistent sales outreach' },
                      { icon: <Settings className="h-4 w-4" />, name: 'Workspace Admin', desc: 'Manage settings, users, and permissions (Admin only)' },
                      { icon: <Shield className="h-4 w-4" />, name: 'Super Admin', desc: 'Cross-workspace management (Super Admin only)' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted">
                        <div className="text-primary mt-0.5">{item.icon}</div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Understanding Workspaces */}
            <section id="workspaces">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>Understanding Workspaces</CardTitle>
                  </div>
                  <CardDescription>How data is organized and isolated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    A <strong>workspace</strong> is a completely isolated environment for your team's data. 
                    Each workspace has its own accounts, contacts, deals, and settings.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Points</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Data in one workspace is completely separate from other workspaces</li>
                      <li>Users belong to a single workspace (except Super Admins)</li>
                      <li>Permissions and settings are workspace-specific</li>
                      <li>Super Admins can view and manage all workspaces</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* User Roles & Permissions */}
            <section id="roles">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>User Roles & Permissions</CardTitle>
                  </div>
                  <CardDescription>Understanding the role hierarchy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p>
                    Funnelfied uses a role-based access control system with four distinct roles:
                  </p>
                  <div className="grid gap-4">
                    {[
                      {
                        role: 'Super Admin',
                        icon: <Shield className="h-5 w-5" />,
                        variant: 'destructive' as const,
                        desc: 'Full system access across all workspaces. Can manage all users, create workspaces, and has unrestricted access to everything.',
                      },
                      {
                        role: 'Admin',
                        icon: <ShieldCheck className="h-5 w-5" />,
                        variant: 'default' as const,
                        desc: 'Full access within their workspace. Can manage users, permissions, and all CRM data. Cannot access other workspaces.',
                      },
                      {
                        role: 'Moderator',
                        icon: <UserCog className="h-5 w-5" />,
                        variant: 'secondary' as const,
                        desc: 'Can create, edit, and delete CRM records (accounts, contacts, deals, interactions) based on configured permissions.',
                      },
                      {
                        role: 'User',
                        icon: <User className="h-5 w-5" />,
                        variant: 'outline' as const,
                        desc: 'View access with limited editing capabilities. Permissions are configured by administrators.',
                      },
                    ].map((item) => (
                      <div key={item.role} className="flex gap-4 p-4 border rounded-lg">
                        <Badge variant={item.variant} className="h-8 px-3 gap-2">
                          {item.icon}
                          {item.role}
                        </Badge>
                        <p className="text-sm text-muted-foreground flex-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Managing Users */}
            <section id="managing-users">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Managing Users</CardTitle>
                  </div>
                  <CardDescription>Adding and managing team members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Viewing Team Members</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigate to <strong>Workspace Admin → Users</strong> to see all team members 
                        in your workspace with their roles and status.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Changing User Roles</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the role dropdown next to each user's name to change their role. 
                        Super Admins can assign any role. Admins can assign Admin, Moderator, or User roles.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Delete Authority</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li><strong>Super Admins</strong> can delete any user</li>
                        <li><strong>Admins</strong> can delete Admins, Moderators, and Users</li>
                        <li><strong>Moderators and Users</strong> cannot delete anyone</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Activating/Deactivating Users</h4>
                      <p className="text-sm text-muted-foreground">
                        Toggle the switch in the Actions column to activate or deactivate a user. 
                        Deactivated users cannot log in or access the workspace.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Permission Matrix */}
            <section id="permission-matrix">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle>Permission Matrix</CardTitle>
                  </div>
                  <CardDescription>Configuring granular access control</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Permission Matrix allows administrators to control exactly what each role 
                    can do with different resources.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Resources</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Accounts</li>
                        <li>Contacts</li>
                        <li>Opportunities</li>
                        <li>Interactions</li>
                        <li>Playbooks</li>
                        <li>Settings</li>
                        <li>Users</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Operations (CRUD)</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li><strong>View:</strong> See records</li>
                        <li><strong>Create:</strong> Add new records</li>
                        <li><strong>Edit:</strong> Modify existing records</li>
                        <li><strong>Delete:</strong> Remove records</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Super Admins and Admins have full access and their 
                      permissions cannot be restricted. Only Moderator and User permissions can be customized.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Core CRM Objects */}
            <section id="crm-objects">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    <CardTitle>Core CRM Objects</CardTitle>
                  </div>
                  <CardDescription>Understanding the data model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Accounts', desc: 'Companies you\'re selling to. Each account can have multiple contacts and deals.' },
                      { name: 'Contacts', desc: 'Individual people at your accounts. Track their title, role, and contact information.' },
                      { name: 'Deals', desc: 'Sales opportunities tied to accounts. Track stage, size, probability, and next actions.' },
                      { name: 'Interactions', desc: 'Activity logs for deals including calls, emails, meetings, and LinkedIn messages.' },
                      { name: 'Playbooks', desc: 'Structured templates for sales sequences with email and LinkedIn outreach templates.' },
                    ].map((item) => (
                      <div key={item.name} className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-1">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Sales Pipeline Workflow */}
            <section id="pipeline">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle>Sales Pipeline Workflow</CardTitle>
                  </div>
                  <CardDescription>Managing your sales process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Creating a Deal</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the "Add Deal" button, select an account, assign a contact, 
                        and set the initial stage and details.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Moving Deals</h4>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop deal cards between stage columns on the Kanban board, 
                        or update the stage from the deal detail page.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Logging Interactions</h4>
                      <p className="text-sm text-muted-foreground">
                        Record calls, emails, and meetings from the deal page. 
                        Track summaries, objections, and commitments.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Quick Filters</h4>
                      <p className="text-sm text-muted-foreground">
                        Use filters like "Actions Today", "High-Leverage", and "Stalled" 
                        to focus on the most important deals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Deal Stages Explained */}
            <section id="stages">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <CardTitle>Deal Stages Explained</CardTitle>
                  </div>
                  <CardDescription>The 9 stages of your sales pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { stage: 'Signal Target', icon: <Target className="h-4 w-4" />, desc: 'Initial identification of a potential opportunity' },
                      { stage: 'Contacted', icon: <Phone className="h-4 w-4" />, desc: 'First outreach has been made' },
                      { stage: 'Discovery Scheduled', icon: <Calendar className="h-4 w-4" />, desc: 'Meeting has been booked' },
                      { stage: 'Discovery Done', icon: <CheckCircle2 className="h-4 w-4" />, desc: 'Discovery meeting completed' },
                      { stage: 'Proposal Out', icon: <FileText className="h-4 w-4" />, desc: 'Quote or proposal has been sent' },
                      { stage: 'Decision', icon: <Clock className="h-4 w-4" />, desc: 'Waiting for the prospect\'s decision' },
                      { stage: 'Won', icon: <Trophy className="h-4 w-4" />, desc: 'Deal closed successfully!' },
                      { stage: 'Lost/Archived', icon: <XCircle className="h-4 w-4" />, desc: 'Deal was not successful or archived' },
                      { stage: 'Nurture', icon: <Clock className="h-4 w-4" />, desc: 'Long-term follow-up for future opportunity' },
                    ].map((item) => (
                      <div key={item.stage} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                        <div className="text-primary">{item.icon}</div>
                        <div>
                          <p className="font-medium">{item.stage}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Playbooks */}
            <section id="playbooks">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Playbooks</CardTitle>
                  </div>
                  <CardDescription>Structured sales sequences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Playbooks are reusable templates that standardize your sales outreach 
                    across the team.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Email Templates</h4>
                      <p className="text-sm text-muted-foreground">
                        First message templates and follow-up sequences for day 3, 10, and 21.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">LinkedIn Templates</h4>
                      <p className="text-sm text-muted-foreground">
                        Connection request and message templates for social selling.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Super Admin Features */}
            <section id="super-admin">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Super Admin Features</CardTitle>
                  </div>
                  <CardDescription>System-wide management (Super Admins only)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm">
                      These features are only available to Super Admins and provide 
                      cross-workspace management capabilities.
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>View and manage all workspaces in the system</li>
                    <li>Create new workspaces</li>
                    <li>Manage users across all workspaces</li>
                    <li>View system-wide statistics and metrics</li>
                    <li>Assign Super Admin role to other users</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Tips & Best Practices */}
            <section id="tips">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle>Tips & Best Practices</CardTitle>
                  </div>
                  <CardDescription>Get the most out of Funnelfied</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {[
                      'Keep next actions updated for every deal to maintain momentum',
                      'Log interactions regularly to maintain a complete history',
                      'Use stage progression consistently across your team',
                      'Review stalled deals weekly to prevent opportunities from going cold',
                      'Leverage dashboard quick filters to focus on what matters today',
                      'Assign playbooks to deals for consistent follow-up sequences',
                      'Use the Nurture stage for long-term opportunities',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Spacer for scroll */}
            <div className="h-20" />
          </div>

          {/* Back to Top Button */}
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 shadow-lg"
            onClick={scrollToTop}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
