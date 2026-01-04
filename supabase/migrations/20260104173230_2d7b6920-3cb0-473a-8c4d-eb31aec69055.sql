-- Update super_admin RLS policies to scope by current_workspace()
-- This ensures super_admins only see data from their currently selected workspace

-- ACCOUNTS
DROP POLICY IF EXISTS "Super admins can do everything on accounts" ON public.accounts;
CREATE POLICY "Super admins can do everything on accounts" 
ON public.accounts FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- CONTACTS
DROP POLICY IF EXISTS "Super admins can do everything on contacts" ON public.contacts;
CREATE POLICY "Super admins can do everything on contacts" 
ON public.contacts FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- DEALS
DROP POLICY IF EXISTS "Super admins can do everything on deals" ON public.deals;
CREATE POLICY "Super admins can do everything on deals" 
ON public.deals FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- INTERACTIONS
DROP POLICY IF EXISTS "Super admins can do everything on interactions" ON public.interactions;
CREATE POLICY "Super admins can do everything on interactions" 
ON public.interactions FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- TASKS
DROP POLICY IF EXISTS "Super admins can do everything on tasks" ON public.tasks;
CREATE POLICY "Super admins can do everything on tasks" 
ON public.tasks FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- LEADS
DROP POLICY IF EXISTS "Super admins can do everything on leads" ON public.leads;
CREATE POLICY "Super admins can do everything on leads" 
ON public.leads FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- ASSETS
DROP POLICY IF EXISTS "Super admins can do everything on assets" ON public.assets;
CREATE POLICY "Super admins can do everything on assets" 
ON public.assets FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- PLAYBOOKS
DROP POLICY IF EXISTS "Super admins can do everything on playbooks" ON public.playbooks;
CREATE POLICY "Super admins can do everything on playbooks" 
ON public.playbooks FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- DEAL_FILES
DROP POLICY IF EXISTS "Super admins can do everything on deal_files" ON public.deal_files;
CREATE POLICY "Super admins can do everything on deal_files" 
ON public.deal_files FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- ASSET_PLAYBOOKS
DROP POLICY IF EXISTS "Super admins can do everything on asset_playbooks" ON public.asset_playbooks;
CREATE POLICY "Super admins can do everything on asset_playbooks" 
ON public.asset_playbooks FOR ALL 
USING (is_super_admin() AND EXISTS (
  SELECT 1 FROM assets a WHERE a.id = asset_playbooks.asset_id AND a.workspace_id = current_workspace()
))
WITH CHECK (is_super_admin() AND EXISTS (
  SELECT 1 FROM assets a WHERE a.id = asset_playbooks.asset_id AND a.workspace_id = current_workspace()
));

-- LEAD_CONTACTS
DROP POLICY IF EXISTS "Super admins can do everything on lead_contacts" ON public.lead_contacts;
CREATE POLICY "Super admins can do everything on lead_contacts" 
ON public.lead_contacts FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- LEAD_STAKEHOLDERS
DROP POLICY IF EXISTS "Super admins can do everything on lead_stakeholders" ON public.lead_stakeholders;
CREATE POLICY "Super admins can do everything on lead_stakeholders" 
ON public.lead_stakeholders FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- PROFILES - special case: super_admin should still see profiles in current workspace
DROP POLICY IF EXISTS "Super admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Super admins can do everything on profiles" 
ON public.profiles FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());

-- WORKSPACE_PULL_CONFIGS
DROP POLICY IF EXISTS "Super admins can manage all configs" ON public.workspace_pull_configs;
CREATE POLICY "Super admins can manage all configs" 
ON public.workspace_pull_configs FOR ALL 
USING (is_super_admin() AND workspace_id = current_workspace())
WITH CHECK (is_super_admin() AND workspace_id = current_workspace());