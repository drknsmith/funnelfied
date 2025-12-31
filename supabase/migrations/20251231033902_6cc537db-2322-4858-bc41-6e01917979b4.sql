-- Super Admin Guard: Prevent non-super_admins from modifying super_admin users

-- Create a function to check if a user is super_admin
CREATE OR REPLACE FUNCTION public.is_target_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Update user_roles policy to prevent non-super_admins from modifying super_admin roles
DROP POLICY IF EXISTS "Admins can manage roles in their workspace" ON public.user_roles;

CREATE POLICY "Admins can manage roles in their workspace"
ON public.user_roles FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id 
    AND p1.workspace_id = p2.workspace_id
  )
  -- Admins cannot modify super_admin users
  AND NOT is_target_super_admin(user_roles.user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = user_roles.user_id 
    AND p1.workspace_id = p2.workspace_id
  )
  -- Admins cannot assign super_admin role or modify super_admin users
  AND role <> 'super_admin'
  AND NOT is_target_super_admin(user_roles.user_id)
);

-- Update profiles policy to prevent non-super_admins from deactivating super_admin
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- If updating own profile and user is super_admin, allow it
  -- Otherwise, non-super_admins cannot deactivate super_admins
  AND (
    NOT is_target_super_admin(user_id) 
    OR is_super_admin()
  )
);

-- Add policy for admins to update profiles in their workspace (except super_admin)
CREATE POLICY "Admins can update profiles in their workspace except super_admin"
ON public.profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  AND workspace_id = current_workspace()
  AND NOT is_target_super_admin(user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  AND workspace_id = current_workspace()
  AND NOT is_target_super_admin(user_id)
);

-- Add 'assets' to workspace_permissions for existing workspaces
-- This will be handled by the app when accessing permissions