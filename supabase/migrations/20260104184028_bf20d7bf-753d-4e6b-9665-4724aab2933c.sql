-- Fix profiles RLS to allow:
-- 1) Users can always read their own profile (regardless of workspace switch)
-- 2) Super admins can read/modify all profiles globally

-- Add policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop the existing super admin policy that is workspace-scoped
DROP POLICY IF EXISTS "Super admins can do everything on profiles" ON public.profiles;

-- Recreate super admin policy with global access (not workspace-scoped)
CREATE POLICY "Super admins can do everything on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());