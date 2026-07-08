import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCRIBE_SYSTEM_PROMPT = `You are Scribe, the AI CRM Copilot for Funnelfied.

Your role is to help users understand and execute on their CRM data. You have access to real-time CRM statistics and can answer questions about contacts, deals, accounts, and pipeline health.

IDENTITY
- You identify yourself as: "I'm Scribe, your AI CRM Copilot."
- You support deal execution, data insights, and communication.
- You never override human judgment.

WHAT YOU CAN DO

1) Answer CRM Data Questions
- Tell users how many contacts, accounts, or deals they have
- Identify stalled deals (no activity in 14+ days)
- Show deals by stage or pipeline health
- Highlight actions due today or overdue
- Recommend which accounts to nurture
- Provide statistics and summaries

2) Deal Hygiene & Enforcement
- Evaluate the current Deal record when on a deal page
- If Deal Stage is beyond "Signal / Target", check for required fields:
  - Assigned Playbook, Primary Stakeholder, Deal Size, Probability, Next Action, Next Action Date
- Point out what's missing and why it matters

3) Playbook-Aware Drafting
- Draft messages using the assigned Playbook
- Supported: First-touch email, LinkedIn DM, Day 3/10/21 follow-ups
- If no Playbook assigned: "Assign a playbook first so I can draft messaging."

Tone by Playbook:
- PB1 (Single-Site): fast, pragmatic, execution-focused
- PB2 (Portfolio): executive, portfolio-standardization framing
- PB3 (Design-Led): design-literate, spec-in focused
- PB4 (Retrofit/Value): ROI and value-engineering focused

4) Interaction Assistance
- When given an email/call note, summarize in 2-3 sentences
- Extract objections, commitments, deadlines
- Recommend Next Action and Next Action Date
- Suggest stage changes if appropriate

5) Asset Guidance
- Recommend which Asset to use based on context
- Reference Assets by exact names only

WHAT YOU CANNOT DO
- Browse the internet or access external data
- Create, update, or delete CRM records directly
- Access data from other workspaces or other users' private data (unless admin/super_admin viewing team)
- Modify system settings or permissions

RESPONSE STYLE
- Be concise and directive
- Use bullet points over paragraphs
- No filler, no speculation
- State exactly what's missing if data is incomplete`;

interface CRMStats {
  total_contacts: number;
  total_accounts: number;
  total_deals: number;
  open_deals: number;
  closed_won: number;
  closed_lost: number;
  stalled_deals: number;
  actions_today: number;
  deals_by_stage: Record<string, number>;
}

async function getCRMStats(supabase: any, workspaceId: string, userRole: string | null, userId?: string): Promise<CRMStats> {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  // Build base query filters
  const buildFilter = (query: any) => {
    let q = query.eq('workspace_id', workspaceId);
    if (!isAdmin && userId) {
      q = q.eq('owner_user_id', userId);
    }
    return q;
  };

  const today = new Date().toISOString().split('T')[0];
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // Get contacts count
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Get accounts count  
    const { count: accountCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Get all deals for detailed stats
    let dealsQuery = supabase
      .from('deals')
      .select('id, stage, status, next_action_date, last_meaningful_activity_date, owner_user_id')
      .eq('workspace_id', workspaceId);
    
    if (!isAdmin && userId) {
      dealsQuery = dealsQuery.eq('owner_user_id', userId);
    }

    const { data: deals } = await dealsQuery;
    const dealsList = deals || [];

    // Calculate deal stats
    const openDeals = dealsList.filter((d: any) => d.status === 'open');
    const closedWon = dealsList.filter((d: any) => d.status === 'closed_won').length;
    const closedLost = dealsList.filter((d: any) => d.status === 'closed_lost').length;

    // Stalled deals: open with no activity in 14 days
    const stalledDeals = openDeals.filter((d: any) => {
      if (!d.last_meaningful_activity_date) return true;
      return d.last_meaningful_activity_date < fourteenDaysAgo;
    }).length;

    // Actions today: open deals with next_action_date <= today
    const actionsToday = openDeals.filter((d: any) => {
      if (!d.next_action_date) return false;
      return d.next_action_date <= today;
    }).length;

    // Deals by stage
    const dealsByStage: Record<string, number> = {};
    for (const deal of openDeals) {
      const stage = deal.stage || 'unknown';
      dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
    }

    return {
      total_contacts: contactCount || 0,
      total_accounts: accountCount || 0,
      total_deals: dealsList.length,
      open_deals: openDeals.length,
      closed_won: closedWon,
      closed_lost: closedLost,
      stalled_deals: stalledDeals,
      actions_today: actionsToday,
      deals_by_stage: dealsByStage,
    };
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    return {
      total_contacts: 0,
      total_accounts: 0,
      total_deals: 0,
      open_deals: 0,
      closed_won: 0,
      closed_lost: 0,
      stalled_deals: 0,
      actions_today: 0,
      deals_by_stage: {},
    };
  }
}

function formatStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'signal_target': 'Signal/Target',
    'qualifying': 'Qualifying',
    'proposal': 'Proposal',
    'negotiating': 'Negotiating',
    'closing': 'Closing',
    'closed_won': 'Closed Won',
    'closed_lost': 'Closed Lost',
  };
  return labels[stage] || stage;
}

function formatAssetType(type: string): string {
  const labels: Record<string, string> = {
    'brand_overview': 'Brand Overview',
    'portfolio_standard': 'Portfolio Standard',
    'spec_package': 'Spec Package',
    'roi_framing': 'ROI Framing',
    'case_narrative': 'Case Narrative',
    'other': 'Other',
  };
  return labels[type] || type;
}

async function getWorkspaceAssets(supabase: any, workspaceId: string) {
  try {
    const { data: assets } = await supabase
      .from('assets')
      .select('id, name, asset_type, asset_url, asset_file_ref, description')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('asset_type');
    
    return assets || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireUser(req, corsHeaders);
    if ("response" in authResult) return authResult.response;
    const { userId } = authResult.user;

    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for data access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Derive workspace_id and role from the authenticated user's profile — never
    // trust a client-supplied workspace_id, which would allow cross-workspace exfiltration.
    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const verifiedWorkspaceId: string | null = profile?.workspace_id ?? null;
    const verifiedRole: string | null = roleRow?.role ?? null;

    // Build context-aware system prompt
    let systemPrompt = SCRIBE_SYSTEM_PROMPT;
    
    // Add page context
    if (context) {
      systemPrompt += `\n\n--- CURRENT SESSION ---
User: ${context.user_name || 'Unknown'}
Role: ${verifiedRole || 'User'}
Page: ${context.current_page}`;

      // Fetch and add CRM statistics if we have workspace_id
      if (verifiedWorkspaceId) {
        console.log("Fetching CRM stats for workspace:", verifiedWorkspaceId);
        const stats = await getCRMStats(supabase, verifiedWorkspaceId, verifiedRole, userId);
        
        systemPrompt += `\n\n--- YOUR CRM STATISTICS ---
Total Contacts: ${stats.total_contacts}
Total Accounts: ${stats.total_accounts}
Total Deals: ${stats.total_deals}
  - Open: ${stats.open_deals}
  - Closed Won: ${stats.closed_won}
  - Closed Lost: ${stats.closed_lost}
Stalled Deals (no activity 14+ days): ${stats.stalled_deals}
Actions Due Today: ${stats.actions_today}`;

        if (Object.keys(stats.deals_by_stage).length > 0) {
          systemPrompt += `\nPipeline by Stage:`;
          for (const [stage, count] of Object.entries(stats.deals_by_stage)) {
            systemPrompt += `\n  - ${formatStageLabel(stage)}: ${count}`;
          }
        }

        // Fetch and add available assets
        const assets = await getWorkspaceAssets(supabase, verifiedWorkspaceId);
        if (assets.length > 0) {
          systemPrompt += `\n\n--- AVAILABLE ASSETS ---`;
          for (const asset of assets) {
            const typeLabel = formatAssetType(asset.asset_type);
            const url = asset.asset_url || asset.asset_file_ref || 'No link available';
            systemPrompt += `\n• ${asset.name} (${typeLabel})`;
            if (asset.description) {
              systemPrompt += `: ${asset.description}`;
            }
            systemPrompt += `\n  Link: ${url}`;
          }
          systemPrompt += `\n\nWhen drafting messages, recommend inserting relevant asset links where they add value. Reference assets by their exact name.`;
        }
      }

      // Add page-specific guidance
      if (context.page_type === 'dashboard') {
        systemPrompt += `\n\nYou are on the Dashboard. Help with CRM insights, prioritization, and workflow guidance. You can answer questions about their data.`;
      } else if (context.page_type === 'calendar') {
        systemPrompt += `\n\nYou are on the Calendar. Help with scheduling, prioritizing next actions, and time management.`;
      } else if (context.page_type === 'account') {
        systemPrompt += `\n\nYou are viewing an Account. Help with account strategy, expansion opportunities, or stakeholder mapping.`;
      } else if (context.page_type === 'playbook') {
        systemPrompt += `\n\nYou are viewing Playbooks. Explain playbook usage, message templates, or when to apply specific playbooks.`;
      } else if (context.page_type !== 'deal') {
        systemPrompt += `\n\nProvide CRM guidance and answer data questions. If asked about a specific deal, suggest navigating to it for full context.`;
      }
    }
    
    // Add deal context if available
    if (context?.deal) {
      const d = context.deal;
      systemPrompt += `\n\n--- CURRENT DEAL ---
Deal Name: ${d.deal_name || d.account_name || 'Not set'}
Account: ${d.account_name || 'Unknown'}
Stage: ${d.stage || 'Unknown'}
Deal Type: ${d.deal_type || 'Not set'}
Playbook: ${d.playbook_name || 'None assigned'}
Primary Contact: ${d.contact_name || 'Not set'}
Deal Size: ${d.deal_size || 'Not set'}
Probability: ${d.probability || 'Not set'}%
Next Action: ${d.next_action || 'Not set'}
Next Action Date: ${d.next_action_date || 'Not set'}
Internal Notes: ${d.internal_notes || 'None'}`;
    }

    console.log("Scribe chat - User:", userId, "Page:", context?.current_page, "Workspace:", verifiedWorkspaceId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Scribe chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
