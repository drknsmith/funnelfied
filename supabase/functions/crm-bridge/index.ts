import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apiKey = Deno.env.get('CRM_BRIDGE_API_KEY')!;

// Initialize Supabase client with service role for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper: Validate API key
function validateApiKey(req: Request): boolean {
  const providedKey = req.headers.get('x-api-key');
  return providedKey === apiKey;
}

// Helper: Extract path from URL
function getPath(req: Request): string {
  const url = new URL(req.url);
  // Handle both /crm-bridge/path and direct /path formats
  const pathname = url.pathname;
  // Remove function name prefix if present
  const cleanPath = pathname.replace(/^\/crm-bridge/, '');
  return cleanPath || '/';
}

// Helper: JSON response
function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper: Error response
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Helper: Normalize string for comparison
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

// Helper: Derive workspace_id with fallback logic
async function deriveWorkspaceId(body: any): Promise<{ workspace_id: string | null; error?: string }> {
  // Priority 1: Explicit workspace_id in request
  if (body.workspace_id) {
    console.log(`Using explicit workspace_id: ${body.workspace_id}`);
    return { workspace_id: body.workspace_id };
  }

  // Priority 2: Derive from owner_user_id via profiles table
  if (body.owner_user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('user_id', body.owner_user_id)
      .maybeSingle();
    
    if (profile?.workspace_id) {
      console.log(`Derived workspace_id from owner_user_id: ${profile.workspace_id}`);
      return { workspace_id: profile.workspace_id };
    }
    // If user not found, continue to fallback
    console.log(`No profile found for owner_user_id: ${body.owner_user_id}, falling back`);
  }

  // Priority 3: Fallback to first workspace in the system
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);
  
  if (workspaces && workspaces.length > 0) {
    console.log(`Derived workspace_id from default workspace: ${workspaces[0].id}`);
    return { workspace_id: workspaces[0].id };
  }

  // No workspace could be derived
  return { 
    workspace_id: null, 
    error: 'workspace_id could not be derived' 
  };
}

// =============================================
// ENDPOINT HANDLERS
// =============================================

// GET /health
async function handleHealth(): Promise<Response> {
  return jsonResponse({ status: 'ok', service: 'crm-bridge' });
}

// POST /leads/upsert
async function handleLeadsUpsert(body: any): Promise<Response> {
  console.log('Processing leads/upsert:', JSON.stringify(body, null, 2));

  // Derive workspace_id with fallback logic
  const { workspace_id: resolvedWorkspaceId, error: wsError } = await deriveWorkspaceId(body);
  
  if (!resolvedWorkspaceId) {
    return jsonResponse({ 
      error: 'workspace_id_missing', 
      message: wsError || 'workspace_id could not be derived' 
    }, 400);
  }

  const workspace_id = resolvedWorkspaceId;

  // Derive default owner if not provided
  let owner_user_id = body.owner_user_id || null;

  if (!owner_user_id) {
    // Get first user in the workspace as default owner
    const { data: defaultProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('workspace_id', workspace_id)
      .limit(1)
      .maybeSingle();
    
    if (defaultProfile) {
      owner_user_id = defaultProfile.user_id;
      console.log(`Assigned default owner: ${owner_user_id}`);
    }
  }

  // Validate other required fields
  const { company, project_name, location, facility_type } = body;
  
  if (!company) return errorResponse('company is required');
  if (!project_name) return errorResponse('project_name is required');
  if (!location) return errorResponse('location is required');
  if (!facility_type) return errorResponse('facility_type is required');

  // Prepare lead data
  const leadData: any = {
    workspace_id,
    company,
    project_name,
    location,
    facility_type,
    signal_reason: body.signal_reason || null,
    estimated_timeline: body.estimated_timeline || null,
    recommended_playbook: body.recommended_playbook || null,
    stakeholders_json: body.stakeholders || null,
    contact_notes: body.contact_notes || null,
    first_touch_email: body.first_touch_email || null,
    linkedin_dm: body.linkedin_dm || null,
    source_links: body.source_links || null,
    status: body.status || 'new',
    owner_user_id: owner_user_id,
    updated_at: new Date().toISOString(),
  };

  if (body.external_id) {
    leadData.external_id = body.external_id;
  }

  let action = 'inserted';
  let leadId: string;

  // Try to find existing lead
  let existingLead = null;

  // Priority 1: Match by external_id
  if (body.external_id) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('external_id', body.external_id)
      .single();
    existingLead = data;
  }

  // Priority 2: Match by normalized (workspace_id + company + project_name + location)
  if (!existingLead) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspace_id)
      .ilike('company', company)
      .ilike('project_name', project_name)
      .ilike('location', location)
      .is('external_id', null)
      .single();
    existingLead = data;
  }

  if (existingLead) {
    // Update existing lead
    const { error } = await supabase
      .from('leads')
      .update(leadData)
      .eq('id', existingLead.id);

    if (error) {
      console.error('Error updating lead:', error);
      return errorResponse(`Failed to update lead: ${error.message}`, 500);
    }

    leadId = existingLead.id;
    action = 'updated';
  } else {
    // Insert new lead
    leadData.created_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return errorResponse(`Failed to insert lead: ${error.message}`, 500);
    }

    leadId = data.id;
  }

  // Handle stakeholders array - write to lead_stakeholders table
  if (body.stakeholders && Array.isArray(body.stakeholders)) {
    console.log(`Processing ${body.stakeholders.length} stakeholders for lead ${leadId}`);
    
    for (const stakeholder of body.stakeholders) {
      const stakeholderData = {
        workspace_id,
        lead_id: leadId,
        stakeholder_name: stakeholder.stakeholder_name || stakeholder.name || null,
        stakeholder_role_type: stakeholder.stakeholder_role_type || stakeholder.role || 'Other',
        title: stakeholder.title || null,
        email: stakeholder.email || null,
        phone: stakeholder.phone || null,
        linkedin_url: stakeholder.linkedin_url || stakeholder.linkedin || null,
        confidence: stakeholder.confidence || 'UNCONFIRMED',
        notes: stakeholder.notes || null,
      };

      // Upsert by (lead_id + email) if email exists, else just insert
      if (stakeholder.email) {
        const { data: existing } = await supabase
          .from('lead_stakeholders')
          .select('id')
          .eq('lead_id', leadId)
          .eq('email', stakeholder.email)
          .maybeSingle();
        
        if (existing) {
          const { error: updateError } = await supabase
            .from('lead_stakeholders')
            .update(stakeholderData)
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('Error updating stakeholder:', updateError);
          } else {
            console.log(`Updated stakeholder: ${stakeholder.email}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('lead_stakeholders')
            .insert(stakeholderData);
          
          if (insertError) {
            console.error('Error inserting stakeholder:', insertError);
          } else {
            console.log(`Inserted stakeholder: ${stakeholder.email}`);
          }
        }
      } else {
        // No email - just insert
        const { error: insertError } = await supabase
          .from('lead_stakeholders')
          .insert(stakeholderData);
        
        if (insertError) {
          console.error('Error inserting stakeholder:', insertError);
        } else {
          console.log(`Inserted stakeholder: ${stakeholderData.stakeholder_name}`);
        }
      }
    }
  }

  console.log(`Lead ${action}: ${leadId}`);
  return jsonResponse({ 
    lead_id: leadId, 
    action,
    owner_assigned: !!owner_user_id,
    stakeholders_processed: body.stakeholders?.length || 0,
  });
}

// POST /deals/upsert
async function handleDealsUpsert(body: any): Promise<Response> {
  console.log('Processing deals/upsert:', JSON.stringify(body, null, 2));

  // Validate required fields
  const { account_id, deal_name, deal_type, owner_user_id } = body;
  
  if (!account_id) return errorResponse('account_id is required');
  if (!deal_name) return errorResponse('deal_name is required');
  if (!deal_type) return errorResponse('deal_type is required');
  if (!owner_user_id) return errorResponse('owner_user_id is required');

  // Get workspace_id from account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('workspace_id')
    .eq('id', account_id)
    .single();

  if (accountError || !account) {
    return errorResponse(`Account not found: ${account_id}`, 404);
  }

  // Prepare deal data
  const dealData: any = {
    account_id,
    deal_name,
    deal_type,
    owner_user_id,
    workspace_id: account.workspace_id,
    updated_at: new Date().toISOString(),
  };

  // Optional fields
  if (body.external_id) dealData.external_id = body.external_id;
  if (body.stage) dealData.stage = body.stage;
  if (body.playbook_id) dealData.playbook_id = body.playbook_id;
  if (body.primary_stakeholder_contact_id) dealData.primary_contact_id = body.primary_stakeholder_contact_id;
  if (body.deal_size_range) dealData.deal_size_range = body.deal_size_range;
  if (body.probability !== undefined) dealData.probability = body.probability;
  if (body.next_action) dealData.next_action = body.next_action;
  if (body.next_action_date) dealData.next_action_date = body.next_action_date;
  if (body.trigger_signal) dealData.trigger_signal = body.trigger_signal;
  if (body.buying_motive) dealData.buying_motive = body.buying_motive;
  if (body.primary_buyer_role) dealData.primary_buyer_role = body.primary_buyer_role;
  if (body.primary_objection) dealData.primary_objection = body.primary_objection;
  if (body.proposal_requested_date) dealData.proposal_requested_date = body.proposal_requested_date;
  if (body.proposal_submitted_date) {
    dealData.proposal_submitted_date = body.proposal_submitted_date;
    // Auto-set stage to 'proposal' if not explicitly provided
    if (!body.stage) {
      dealData.stage = 'proposal';
    }
    // Update last meaningful activity
    dealData.last_meaningful_activity_date = new Date().toISOString().split('T')[0];
  }

  let action = 'inserted';
  let dealId: string;

  // Try to find existing deal
  let existingDeal = null;

  // Priority 1: Match by deal_id if provided
  if (body.deal_id) {
    const { data } = await supabase
      .from('deals')
      .select('id')
      .eq('id', body.deal_id)
      .single();
    existingDeal = data;
  }

  // Priority 2: Match by external_id
  if (!existingDeal && body.external_id) {
    const { data } = await supabase
      .from('deals')
      .select('id')
      .eq('external_id', body.external_id)
      .single();
    existingDeal = data;
  }

  // Priority 3: Match by normalized (account_id + deal_name)
  if (!existingDeal) {
    const { data } = await supabase
      .from('deals')
      .select('id')
      .eq('account_id', account_id)
      .ilike('deal_name', deal_name)
      .is('external_id', null)
      .single();
    existingDeal = data;
  }

  if (existingDeal) {
    // Update existing deal
    const { error } = await supabase
      .from('deals')
      .update(dealData)
      .eq('id', existingDeal.id);

    if (error) {
      console.error('Error updating deal:', error);
      return errorResponse(`Failed to update deal: ${error.message}`, 500);
    }

    dealId = existingDeal.id;
    action = 'updated';
  } else {
    // Insert new deal
    dealData.created_at = new Date().toISOString();
    if (!dealData.stage) dealData.stage = 'signal_target';
    if (!dealData.status) dealData.status = 'open';
    
    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting deal:', error);
      return errorResponse(`Failed to insert deal: ${error.message}`, 500);
    }

    dealId = data.id;
  }

  console.log(`Deal ${action}: ${dealId}`);
  return jsonResponse({ deal_id: dealId, action });
}

// POST /interactions/create
async function handleInteractionsCreate(body: any): Promise<Response> {
  console.log('Processing interactions/create:', JSON.stringify(body, null, 2));

  // Validate required fields
  const { deal_id, interaction_type, interaction_date, summary } = body;
  
  if (!deal_id) return errorResponse('deal_id is required');
  if (!interaction_type) return errorResponse('interaction_type is required');
  if (!interaction_date) return errorResponse('interaction_date is required');
  if (!summary) return errorResponse('summary is required');

  // Validate interaction_type
  const validTypes = ['Email', 'Call', 'Meeting'];
  if (!validTypes.includes(interaction_type)) {
    return errorResponse(`interaction_type must be one of: ${validTypes.join(', ')}`);
  }

  // Get deal to retrieve workspace_id
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('workspace_id')
    .eq('id', deal_id)
    .single();

  if (dealError || !deal) {
    return errorResponse(`Deal not found: ${deal_id}`, 404);
  }

  // Prepare interaction data (map to existing schema)
  const interactionData: any = {
    deal_id,
    workspace_id: deal.workspace_id,
    type: interaction_type,  // Map interaction_type to type
    occurred_at: interaction_date,  // Map interaction_date to occurred_at
    summary,
    created_at: new Date().toISOString(),
  };

  // Optional fields
  if (body.participants) interactionData.participants = body.participants;
  if (body.key_points) interactionData.key_points = body.key_points;
  if (body.objections) {
    // Handle both array and text format
    interactionData.objections = Array.isArray(body.objections) 
      ? body.objections.join('; ') 
      : body.objections;
  }
  if (body.commitments) {
    // Handle both array and text format
    interactionData.commitments = Array.isArray(body.commitments) 
      ? body.commitments.join('; ') 
      : body.commitments;
  }
  if (body.next_action) interactionData.next_action = body.next_action;
  if (body.next_action_date) interactionData.next_action_date = body.next_action_date;
  if (body.created_by_user_id) interactionData.created_by_user_id = body.created_by_user_id;

  // Insert interaction
  const { data: interaction, error: insertError } = await supabase
    .from('interactions')
    .insert(interactionData)
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting interaction:', insertError);
    return errorResponse(`Failed to insert interaction: ${insertError.message}`, 500);
  }

  // Update related deal
  const dealUpdate: any = {
    last_meaningful_activity_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  };

  let calendarUpdated = false;
  const warnings: string[] = [];

  if (body.next_action) {
    dealUpdate.next_action = body.next_action;
  }

  if (body.next_action_date) {
    dealUpdate.next_action_date = body.next_action_date;
    calendarUpdated = true;
  } else if (body.next_action) {
    // next_action provided but no date
    warnings.push('next_action_date missing; calendar not updated');
  }

  const { error: updateError } = await supabase
    .from('deals')
    .update(dealUpdate)
    .eq('id', deal_id);

  if (updateError) {
    console.error('Error updating deal:', updateError);
    // Don't fail the request, just log the error
    warnings.push(`Failed to update deal: ${updateError.message}`);
  }

  console.log(`Interaction created: ${interaction.id}, Deal updated: ${!updateError}`);
  
  const response: any = {
    interaction_id: interaction.id,
    deal_updated: !updateError,
    calendar_updated: calendarUpdated,
  };

  if (warnings.length > 0) {
    response.warnings = warnings;
  }

  return jsonResponse(response);
}

// =============================================
// MAIN REQUEST HANDLER
// =============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API key (except for health check)
  const path = getPath(req);
  
  if (path !== '/health' && !validateApiKey(req)) {
    console.log('Unauthorized request - invalid API key');
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  console.log(`CRM Bridge - ${req.method} ${path}`);

  try {
    // Route requests
    if (req.method === 'GET' && path === '/health') {
      return await handleHealth();
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (path === '/leads/upsert') {
        return await handleLeadsUpsert(body);
      }

      if (path === '/deals/upsert') {
        return await handleDealsUpsert(body);
      }

      if (path === '/interactions/create') {
        return await handleInteractionsCreate(body);
      }
    }

    return errorResponse(`Not found: ${req.method} ${path}`, 404);
  } catch (error: unknown) {
    console.error('CRM Bridge error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Internal server error: ${message}`, 500);
  }
});
