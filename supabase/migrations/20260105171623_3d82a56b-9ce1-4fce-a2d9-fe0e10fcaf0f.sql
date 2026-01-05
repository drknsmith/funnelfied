-- Add owner_user_id column to playbooks
ALTER TABLE public.playbooks ADD COLUMN IF NOT EXISTS owner_user_id uuid;

-- Migrate existing data: set owner to creator
UPDATE public.playbooks SET owner_user_id = created_by WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- Create helper function to check if user is admin or above
CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
$$;

-- ============================================
-- PLAYBOOKS: Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view playbooks in their workspace" ON public.playbooks;
DROP POLICY IF EXISTS "Users can insert playbooks in their workspace" ON public.playbooks;
DROP POLICY IF EXISTS "Users can update playbooks in their workspace" ON public.playbooks;
DROP POLICY IF EXISTS "Users can delete playbooks in their workspace" ON public.playbooks;

CREATE POLICY "Users can view own or team playbooks"
ON public.playbooks FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can create their own playbooks"
ON public.playbooks FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update own or team playbooks"
ON public.playbooks FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can delete own or team playbooks"
ON public.playbooks FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

-- ============================================
-- ACCOUNTS: Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view accounts in their workspace" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert accounts in their workspace" ON public.accounts;
DROP POLICY IF EXISTS "Users can update accounts in their workspace" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete accounts in their workspace" ON public.accounts;

CREATE POLICY "Users can view own or team accounts"
ON public.accounts FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can create their own accounts"
ON public.accounts FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update own or team accounts"
ON public.accounts FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can delete own or team accounts"
ON public.accounts FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

-- ============================================
-- CONTACTS: Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts in their workspace" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their workspace" ON public.contacts;

CREATE POLICY "Users can view own or team contacts"
ON public.contacts FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can create their own contacts"
ON public.contacts FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update own or team contacts"
ON public.contacts FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can delete own or team contacts"
ON public.contacts FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

-- ============================================
-- DEALS: Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view deals in their workspace" ON public.deals;
DROP POLICY IF EXISTS "Users can insert deals in their workspace" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals in their workspace" ON public.deals;
DROP POLICY IF EXISTS "Users can delete deals in their workspace" ON public.deals;

CREATE POLICY "Users can view own or team deals"
ON public.deals FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can create their own deals"
ON public.deals FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update own or team deals"
ON public.deals FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can delete own or team deals"
ON public.deals FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

-- ============================================
-- LEADS: Update RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their workspace" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their workspace" ON public.leads;

CREATE POLICY "Users can view own or team leads"
ON public.leads FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can create their own leads"
ON public.leads FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Users can update own or team leads"
ON public.leads FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

CREATE POLICY "Users can delete own or team leads"
ON public.leads FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (is_admin_or_above() OR owner_user_id = auth.uid())
);

-- ============================================
-- INTERACTIONS: Update RLS policies (based on deal ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view interactions in their workspace" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert interactions in their workspace" ON public.interactions;
DROP POLICY IF EXISTS "Users can update interactions in their workspace" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete interactions in their workspace" ON public.interactions;

CREATE POLICY "Users can view own or team interactions"
ON public.interactions FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above() 
    OR deal_id IN (SELECT id FROM public.deals WHERE owner_user_id = auth.uid())
  )
);

CREATE POLICY "Users can create interactions on their deals"
ON public.interactions FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND deal_id IN (SELECT id FROM public.deals WHERE owner_user_id = auth.uid() OR is_admin_or_above())
);

CREATE POLICY "Users can update own or team interactions"
ON public.interactions FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above() 
    OR deal_id IN (SELECT id FROM public.deals WHERE owner_user_id = auth.uid())
  )
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above() 
    OR deal_id IN (SELECT id FROM public.deals WHERE owner_user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete own or team interactions"
ON public.interactions FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above() 
    OR deal_id IN (SELECT id FROM public.deals WHERE owner_user_id = auth.uid())
  )
);