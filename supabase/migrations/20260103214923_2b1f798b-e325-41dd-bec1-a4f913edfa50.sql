-- Create lead_stakeholders table (replaces JSON storage)
CREATE TABLE public.lead_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  stakeholder_name text,
  stakeholder_role_type text NOT NULL DEFAULT 'Other',
  title text,
  email text,
  phone text,
  linkedin_url text,
  confidence text DEFAULT 'UNCONFIRMED',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_lead_stakeholders_lead ON lead_stakeholders(lead_id);
CREATE INDEX idx_lead_stakeholders_email ON lead_stakeholders(email) WHERE email IS NOT NULL;
CREATE INDEX idx_lead_stakeholders_workspace ON lead_stakeholders(workspace_id);

-- Enable RLS
ALTER TABLE lead_stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can do everything on lead_stakeholders"
  ON lead_stakeholders FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view lead_stakeholders in their workspace"
  ON lead_stakeholders FOR SELECT
  USING (workspace_id = current_workspace());

CREATE POLICY "Users can insert lead_stakeholders in their workspace"
  ON lead_stakeholders FOR INSERT
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can update lead_stakeholders in their workspace"
  ON lead_stakeholders FOR UPDATE
  USING (workspace_id = current_workspace())
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can delete lead_stakeholders in their workspace"
  ON lead_stakeholders FOR DELETE
  USING (workspace_id = current_workspace());

-- Create lead_contacts link table
CREATE TABLE public.lead_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (lead_id, contact_id)
);

-- Indexes
CREATE INDEX idx_lead_contacts_lead ON lead_contacts(lead_id);
CREATE INDEX idx_lead_contacts_contact ON lead_contacts(contact_id);
CREATE INDEX idx_lead_contacts_workspace ON lead_contacts(workspace_id);

-- Enable RLS
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can do everything on lead_contacts"
  ON lead_contacts FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view lead_contacts in their workspace"
  ON lead_contacts FOR SELECT
  USING (workspace_id = current_workspace());

CREATE POLICY "Users can insert lead_contacts in their workspace"
  ON lead_contacts FOR INSERT
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can update lead_contacts in their workspace"
  ON lead_contacts FOR UPDATE
  USING (workspace_id = current_workspace())
  WITH CHECK (workspace_id = current_workspace());

CREATE POLICY "Users can delete lead_contacts in their workspace"
  ON lead_contacts FOR DELETE
  USING (workspace_id = current_workspace());

-- Add unique constraint on contacts for email deduplication within workspace
CREATE UNIQUE INDEX idx_contacts_workspace_email 
  ON contacts(workspace_id, email) 
  WHERE email IS NOT NULL;

-- Patch existing orphan lead - assign owner
UPDATE leads 
SET owner_user_id = (
  SELECT user_id FROM profiles 
  WHERE workspace_id = leads.workspace_id 
  LIMIT 1
)
WHERE owner_user_id IS NULL;