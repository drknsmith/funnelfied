-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');

-- Create workspaces table (multi-tenancy)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table (user metadata linked to workspace)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create workspace_permissions table (CRUD toggles per role per resource)
CREATE TABLE public.workspace_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  resource TEXT NOT NULL, -- accounts, contacts, deals, interactions, playbooks, settings, users
  role app_role NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, resource, role)
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  segment TEXT, -- Enterprise, Mid-Market, SMB
  portfolio_size TEXT NOT NULL DEFAULT '1', -- 1, 2-5, 6-20, 20+
  deal_type_default TEXT, -- portfolio, design_led, transactional, other
  buying_motive TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, churned
  expansion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  role_type TEXT, -- Decision Maker, Champion, Influencer, User
  linkedin_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create playbooks table
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT,
  first_message_email_template TEXT,
  first_message_linkedin_template TEXT,
  proof_asset_url TEXT,
  followup_day3_template TEXT,
  followup_day10_template TEXT,
  followup_day21_template TEXT,
  expansion_seed TEXT,
  exit_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  primary_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  playbook_id UUID REFERENCES public.playbooks(id) ON DELETE SET NULL,
  deal_type TEXT, -- portfolio, design_led, transactional, other
  stage TEXT NOT NULL DEFAULT 'signal_target', -- signal_target, contacted, discovery_scheduled, discovery_done, proposal_out, decision, won, lost_archived, nurture
  deal_size_range TEXT, -- Under $10k, $10-25k, $25-50k, $50-100k, $100k+
  probability INTEGER DEFAULT 0,
  next_action TEXT,
  next_action_date DATE,
  last_meaningful_activity_date DATE,
  status TEXT NOT NULL DEFAULT 'open', -- open, won, lost
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create interactions table
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- email, call, meeting, note
  summary TEXT,
  objections TEXT,
  commitments TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  external_ref TEXT, -- for Outlook integration later
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table (optional enhancement)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ms_outlook_connections table (for future Outlook integration)
CREATE TABLE public.ms_outlook_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_outlook_connections ENABLE ROW LEVEL SECURITY;

-- Create security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function: get_user_role (returns highest role)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1
$$;

-- Create security definer function: current_workspace
CREATE OR REPLACE FUNCTION public.current_workspace()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Create security definer function: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

-- RLS Policies for workspaces
CREATE POLICY "Super admins can do everything on workspaces"
  ON public.workspaces FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view their own workspace"
  ON public.workspaces FOR SELECT TO authenticated
  USING (id = public.current_workspace());

-- RLS Policies for profiles
CREATE POLICY "Super admins can do everything on profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view profiles in their workspace"
  ON public.profiles FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Super admins can do everything on user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Admins can manage roles in their workspace"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') AND
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.user_id = auth.uid()
        AND p2.user_id = public.user_roles.user_id
        AND p1.workspace_id = p2.workspace_id
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.user_id = auth.uid()
        AND p2.user_id = public.user_roles.user_id
        AND p1.workspace_id = p2.workspace_id
    ) AND
    role != 'super_admin' -- Admins cannot create super_admins
  );

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for workspace_permissions
CREATE POLICY "Super admins can do everything on permissions"
  ON public.workspace_permissions FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Admins can manage permissions in their workspace"
  ON public.workspace_permissions FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') AND
    workspace_id = public.current_workspace()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND
    workspace_id = public.current_workspace()
  );

CREATE POLICY "Users can view permissions in their workspace"
  ON public.workspace_permissions FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for accounts (workspace-scoped with permission check)
CREATE POLICY "Super admins can do everything on accounts"
  ON public.accounts FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view accounts in their workspace"
  ON public.accounts FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert accounts in their workspace"
  ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update accounts in their workspace"
  ON public.accounts FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete accounts in their workspace"
  ON public.accounts FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for contacts
CREATE POLICY "Super admins can do everything on contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view contacts in their workspace"
  ON public.contacts FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert contacts in their workspace"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update contacts in their workspace"
  ON public.contacts FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete contacts in their workspace"
  ON public.contacts FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for playbooks
CREATE POLICY "Super admins can do everything on playbooks"
  ON public.playbooks FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view playbooks in their workspace"
  ON public.playbooks FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert playbooks in their workspace"
  ON public.playbooks FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update playbooks in their workspace"
  ON public.playbooks FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete playbooks in their workspace"
  ON public.playbooks FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for deals
CREATE POLICY "Super admins can do everything on deals"
  ON public.deals FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view deals in their workspace"
  ON public.deals FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert deals in their workspace"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update deals in their workspace"
  ON public.deals FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete deals in their workspace"
  ON public.deals FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for interactions
CREATE POLICY "Super admins can do everything on interactions"
  ON public.interactions FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view interactions in their workspace"
  ON public.interactions FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert interactions in their workspace"
  ON public.interactions FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update interactions in their workspace"
  ON public.interactions FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete interactions in their workspace"
  ON public.interactions FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for tasks
CREATE POLICY "Super admins can do everything on tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view tasks in their workspace"
  ON public.tasks FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace());

CREATE POLICY "Users can insert tasks in their workspace"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can update tasks in their workspace"
  ON public.tasks FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace())
  WITH CHECK (workspace_id = public.current_workspace());

CREATE POLICY "Users can delete tasks in their workspace"
  ON public.tasks FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace());

-- RLS Policies for ms_outlook_connections
CREATE POLICY "Users can manage their own Outlook connection"
  ON public.ms_outlook_connections FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_permissions_updated_at
  BEFORE UPDATE ON public.workspace_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ms_outlook_connections_updated_at
  BEFORE UPDATE ON public.ms_outlook_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();