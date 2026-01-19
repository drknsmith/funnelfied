-- Make deal_id nullable on interactions table to support contact-only interactions
ALTER TABLE interactions 
  ALTER COLUMN deal_id DROP NOT NULL;

-- Add follow-up tracking fields to contacts table
ALTER TABLE contacts 
  ADD COLUMN next_action text,
  ADD COLUMN next_action_date date;

-- Drop existing policies that require deal_id and recreate them
DROP POLICY IF EXISTS "Users can create interactions on their deals" ON interactions;
DROP POLICY IF EXISTS "Users can view own or team interactions" ON interactions;
DROP POLICY IF EXISTS "Users can update own or team interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete own or team interactions" ON interactions;

-- Create updated INSERT policy for interactions (supports deals OR contacts)
CREATE POLICY "Users can create interactions on their deals or contacts"
ON interactions FOR INSERT
WITH CHECK (
  workspace_id = current_workspace() 
  AND (
    -- Allow if user owns the deal
    deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid())
    -- Allow if user owns the contact
    OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth.uid())
    -- Allow admins
    OR is_admin_or_above()
  )
);

-- Create updated SELECT policy for interactions
CREATE POLICY "Users can view own or team interactions"
ON interactions FOR SELECT
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above()
    OR deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid())
    OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth.uid())
  )
);

-- Create updated UPDATE policy for interactions
CREATE POLICY "Users can update own or team interactions"
ON interactions FOR UPDATE
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above()
    OR deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid())
    OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth.uid())
  )
)
WITH CHECK (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above()
    OR deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid())
    OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth.uid())
  )
);

-- Create updated DELETE policy for interactions
CREATE POLICY "Users can delete own or team interactions"
ON interactions FOR DELETE
USING (
  workspace_id = current_workspace() 
  AND (
    is_admin_or_above()
    OR deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid())
    OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth.uid())
  )
);