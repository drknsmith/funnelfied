
-- ============================================================================
-- Security hardening migration
-- ============================================================================

-- 1) Move SECURITY DEFINER helper functions out of the exposed public API
--    into a private schema so they cannot be invoked as RPCs.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, app_role)        SET SCHEMA private;
ALTER FUNCTION public.is_super_admin()                SET SCHEMA private;
ALTER FUNCTION public.is_admin_or_above()             SET SCHEMA private;
ALTER FUNCTION public.is_target_super_admin(uuid)     SET SCHEMA private;
ALTER FUNCTION public.get_user_role(uuid)             SET SCHEMA private;
ALTER FUNCTION public.current_workspace()             SET SCHEMA private;

-- 2) Defense-in-depth: current_workspace() only consults the super-admin
--    override table when the caller actually is a super admin.
CREATE OR REPLACE FUNCTION private.current_workspace()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(
    (SELECT active_workspace_id
       FROM public.super_admin_workspace_overrides
      WHERE user_id = auth.uid()
        AND private.is_super_admin()),
    (SELECT workspace_id FROM public.profiles WHERE user_id = auth.uid())
  )
$$;

-- 3) proposal_reports: enforce token expiration.
UPDATE public.proposal_reports
   SET expires_at = now() + interval '30 days'
 WHERE expires_at IS NULL;

ALTER TABLE public.proposal_reports
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN expires_at SET NOT NULL;

DROP POLICY IF EXISTS "Users can view research reports" ON public.proposal_reports;
CREATE POLICY "Users can view research reports"
  ON public.proposal_reports FOR SELECT
  USING (
    (owner_user_id = auth.uid())
    OR private.is_super_admin()
    OR (deal_id IN (SELECT id FROM public.deals WHERE workspace_id = private.current_workspace()))
    OR (token IS NOT NULL AND expires_at > now())
  );

-- 4) pending_invitations: remove the public SELECT policy and expose only a
--    narrow validation RPC.
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.pending_invitations;

-- Allow a freshly-signed-up user to mark their own invitation consumed.
DROP POLICY IF EXISTS "Users can consume their own invitation" ON public.pending_invitations;
CREATE POLICY "Users can consume their own invitation"
  ON public.pending_invitations FOR UPDATE
  USING (email = lower((auth.jwt() ->> 'email')) AND used_at IS NULL)
  WITH CHECK (email = lower((auth.jwt() ->> 'email')));

CREATE OR REPLACE FUNCTION public.validate_invitation_code(
  _invite_code text,
  _email text
)
RETURNS TABLE(id uuid, workspace_id uuid, email text, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, workspace_id, email, role
    FROM public.pending_invitations
   WHERE invite_code = upper(trim(_invite_code))
     AND email       = lower(trim(_email))
     AND used_at IS NULL
     AND expires_at > now()
   LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.validate_invitation_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(text, text) TO anon, authenticated;

-- 5) Storage policies: workspace-scope all three buckets.
--    Path convention: '{workspace_id}/...'
DROP POLICY IF EXISTS "Users can view asset files in their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload asset files"                  ON storage.objects;
DROP POLICY IF EXISTS "Users can update their asset files"            ON storage.objects;
DROP POLICY IF EXISTS "Users can delete asset files"                  ON storage.objects;

DROP POLICY IF EXISTS "SM assets are publicly accessible"             ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload SM assets"      ON storage.objects;
DROP POLICY IF EXISTS "Users can update their SM assets"              ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their SM assets"              ON storage.objects;

DROP POLICY IF EXISTS "Users can view deal files"                     ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload deal files"     ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their deal files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete deal files"     ON storage.objects;

-- assets bucket
CREATE POLICY "assets: workspace select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "assets: workspace insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "assets: workspace update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  )
  WITH CHECK (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "assets: workspace delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );

-- sm-assets bucket
CREATE POLICY "sm-assets: workspace select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sm-assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "sm-assets: workspace insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sm-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "sm-assets: workspace update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'sm-assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  )
  WITH CHECK (
    bucket_id = 'sm-assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "sm-assets: workspace delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sm-assets'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );

-- deal-files bucket (bucket is currently empty, so path convention change is safe)
CREATE POLICY "deal-files: workspace select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "deal-files: workspace insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'deal-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "deal-files: workspace update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  )
  WITH CHECK (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
CREATE POLICY "deal-files: workspace delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1]::uuid = private.current_workspace()
  );
