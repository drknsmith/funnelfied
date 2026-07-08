
-- ============================================================
-- 1) pending_invitations: explicit restrictive SELECT policies
-- ============================================================
-- Existing ALL policies for admins/super admins already cover SELECT.
-- Add an explicit SELECT policy for the invited user (matched by email).
DROP POLICY IF EXISTS "Invited user can view their own invitation" ON public.pending_invitations;
CREATE POLICY "Invited user can view their own invitation"
  ON public.pending_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = lower((auth.jwt() ->> 'email'))
    AND used_at IS NULL
    AND expires_at > now()
  );

-- Belt-and-suspenders: revoke any legacy anon SELECT grants; only authenticated should see rows.
REVOKE SELECT ON public.pending_invitations FROM anon;
GRANT SELECT ON public.pending_invitations TO authenticated;

-- ============================================================
-- 2) proposal_reports: add revocation column and enforce in policy
-- ============================================================
ALTER TABLE public.proposal_reports
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

DROP POLICY IF EXISTS "Users can view research reports" ON public.proposal_reports;
CREATE POLICY "Users can view research reports"
  ON public.proposal_reports
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR private.is_super_admin()
    OR (deal_id IN (
      SELECT deals.id FROM public.deals
      WHERE deals.workspace_id = private.current_workspace()
    ))
    OR (
      token IS NOT NULL
      AND expires_at > now()
      AND revoked_at IS NULL
    )
  );

-- ============================================================
-- 3) super_admin_workspace_overrides: defense-in-depth trigger
-- ============================================================
CREATE OR REPLACE FUNCTION private.enforce_super_admin_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  -- Re-verify the caller is authenticated and is the row owner.
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'super_admin override may only be managed by the owning super admin (user_id must equal auth.uid())';
  END IF;

  -- Re-verify super admin role server-side via user_roles (bypasses RLS via SECURITY DEFINER).
  IF NOT private.is_super_admin() THEN
    RAISE EXCEPTION 'super_admin override requires the super_admin role';
  END IF;

  -- Validate the target workspace exists (FK already covers this, but fail loud early).
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = NEW.active_workspace_id) THEN
    RAISE EXCEPTION 'active_workspace_id must reference an existing workspace';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_super_admin_override_bi ON public.super_admin_workspace_overrides;
CREATE TRIGGER enforce_super_admin_override_bi
BEFORE INSERT OR UPDATE ON public.super_admin_workspace_overrides
FOR EACH ROW EXECUTE FUNCTION private.enforce_super_admin_override();

-- Reinforce current_workspace(): explicit re-check of is_super_admin() before honoring override.
CREATE OR REPLACE FUNCTION private.current_workspace()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    -- Only read the override when the caller currently has the super_admin role.
    (SELECT o.active_workspace_id
       FROM public.super_admin_workspace_overrides o
      WHERE o.user_id = auth.uid()
        AND private.is_super_admin()
        AND EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = o.active_workspace_id)),
    (SELECT workspace_id FROM public.profiles WHERE user_id = auth.uid())
  );
$$;
