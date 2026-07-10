-- 1) STORAGE: replace path-only policies with policies that also verify workspace membership via profiles
DROP POLICY IF EXISTS "assets: workspace select"     ON storage.objects;
DROP POLICY IF EXISTS "assets: workspace insert"     ON storage.objects;
DROP POLICY IF EXISTS "assets: workspace update"     ON storage.objects;
DROP POLICY IF EXISTS "assets: workspace delete"     ON storage.objects;
DROP POLICY IF EXISTS "deal-files: workspace select" ON storage.objects;
DROP POLICY IF EXISTS "deal-files: workspace insert" ON storage.objects;
DROP POLICY IF EXISTS "deal-files: workspace update" ON storage.objects;
DROP POLICY IF EXISTS "deal-files: workspace delete" ON storage.objects;
DROP POLICY IF EXISTS "sm-assets: workspace select"  ON storage.objects;
DROP POLICY IF EXISTS "sm-assets: workspace insert"  ON storage.objects;
DROP POLICY IF EXISTS "sm-assets: workspace update"  ON storage.objects;
DROP POLICY IF EXISTS "sm-assets: workspace delete"  ON storage.objects;

-- Helper: safely coerce first folder segment to uuid (returns NULL on bad input)
CREATE OR REPLACE FUNCTION private.storage_first_folder_uuid(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  seg text;
BEGIN
  seg := (storage.foldername(object_name))[1];
  IF seg IS NULL THEN RETURN NULL; END IF;
  BEGIN
    RETURN seg::uuid;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$;

-- Helper: verified workspace membership check
CREATE OR REPLACE FUNCTION private.user_belongs_to_workspace(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
     AND _workspace_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.user_id = _user_id AND p.workspace_id = _workspace_id
     );
$$;

-- Recreate policies: require path uuid to match current_workspace() AND user is a verified member of that workspace
DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['assets','deal-files','sm-assets']
  LOOP
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = %L
        AND private.storage_first_folder_uuid(name) = private.current_workspace()
        AND private.user_belongs_to_workspace(auth.uid(), private.storage_first_folder_uuid(name))
      );
    $p$, b || ': workspace select', b);

    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = %L
        AND auth.uid() IS NOT NULL
        AND private.storage_first_folder_uuid(name) = private.current_workspace()
        AND private.user_belongs_to_workspace(auth.uid(), private.storage_first_folder_uuid(name))
      );
    $p$, b || ': workspace insert', b);

    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = %L
        AND private.storage_first_folder_uuid(name) = private.current_workspace()
        AND private.user_belongs_to_workspace(auth.uid(), private.storage_first_folder_uuid(name))
      )
      WITH CHECK (
        bucket_id = %L
        AND private.storage_first_folder_uuid(name) = private.current_workspace()
        AND private.user_belongs_to_workspace(auth.uid(), private.storage_first_folder_uuid(name))
      );
    $p$, b || ': workspace update', b, b);

    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = %L
        AND private.storage_first_folder_uuid(name) = private.current_workspace()
        AND private.user_belongs_to_workspace(auth.uid(), private.storage_first_folder_uuid(name))
      );
    $p$, b || ': workspace delete', b);
  END LOOP;
END $$;

-- 2) PENDING_INVITATIONS: drop the row-level SELECT policy that let invited users read their invitation directly.
-- Invite validation must go through the validate-invitation edge function (service role), which returns only
-- the fields the client needs. Admin & super_admin policies are unchanged; the "consume" UPDATE policy is unchanged.
DROP POLICY IF EXISTS "Invited user can view their own invitation" ON public.pending_invitations;

-- 3) PROPOSAL_REPORTS: enforce mandatory expiration whenever a share token is present.
CREATE OR REPLACE FUNCTION public.enforce_proposal_report_token_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.token IS NOT NULL AND NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '30 days';
  END IF;
  IF NEW.token IS NOT NULL AND NEW.expires_at > now() + interval '365 days' THEN
    NEW.expires_at := now() + interval '365 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proposal_reports_token_expiry ON public.proposal_reports;
CREATE TRIGGER trg_proposal_reports_token_expiry
BEFORE INSERT OR UPDATE ON public.proposal_reports
FOR EACH ROW
EXECUTE FUNCTION public.enforce_proposal_report_token_expiry();

-- Backfill: any existing tokenized rows without an expiration get 30 days from now
UPDATE public.proposal_reports
   SET expires_at = now() + interval '30 days'
 WHERE token IS NOT NULL AND expires_at IS NULL;

-- 4) SUPER_ADMIN_WORKSPACE_OVERRIDES: defense-in-depth trigger to guarantee
--    the caller only writes their own row and the target workspace exists.
CREATE OR REPLACE FUNCTION public.enforce_super_admin_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'super_admin_workspace_overrides: user_id must equal auth.uid()';
  END IF;
  IF NOT private.is_super_admin() THEN
    RAISE EXCEPTION 'super_admin_workspace_overrides: caller is not a super admin';
  END IF;
  IF NEW.active_workspace_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = NEW.active_workspace_id) THEN
    RAISE EXCEPTION 'super_admin_workspace_overrides: workspace does not exist';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_super_admin_override_guard ON public.super_admin_workspace_overrides;
CREATE TRIGGER trg_super_admin_override_guard
BEFORE INSERT OR UPDATE ON public.super_admin_workspace_overrides
FOR EACH ROW
EXECUTE FUNCTION public.enforce_super_admin_override();