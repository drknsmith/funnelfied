-- Create pending_invitations table for invitation-based signup
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'user',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  UNIQUE(workspace_id, email)
);

-- Enable RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations in their workspace
CREATE POLICY "Admins can manage invitations in their workspace"
  ON public.pending_invitations FOR ALL
  USING (has_role(auth.uid(), 'admin') AND workspace_id = current_workspace())
  WITH CHECK (has_role(auth.uid(), 'admin') AND workspace_id = current_workspace());

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage all invitations"
  ON public.pending_invitations FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Anyone can read invitations to validate codes during signup (before auth)
CREATE POLICY "Anyone can validate invite codes"
  ON public.pending_invitations FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_pending_invitations_invite_code ON public.pending_invitations(invite_code);
CREATE INDEX idx_pending_invitations_email ON public.pending_invitations(email);