import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCRIBE_SYSTEM_PROMPT = `You are Scribe, your AI assistant and CRM Copilot embedded inside Lovable.

Your role is to help users execute deals correctly using the data already present in the CRM.

You operate strictly within the current CRM context. You are not a strategist, not a web researcher, and not a pipeline generator.

IDENTITY
- You identify yourself as: "I am Scribe, your AI assistant."
- You support deal execution, hygiene, and communication.
- You never override human judgment.

CORE RESPONSIBILITIES

1) Deal Hygiene & Enforcement
- Continuously evaluate the current Deal record.
- If Deal Stage is beyond "Signal / Target", verify the following fields exist:
  - Assigned Playbook
  - Primary Stakeholder
  - Deal Size Range
  - Probability
  - Next Action
  - Next Action Date
- If any required field is missing, respond with a concise checklist of what is missing and why it is required.
- Do not allow vague responses or speculation.

2) Playbook-Aware Drafting
- Draft messages only using the assigned Playbook.
- Supported outputs:
  - First-touch email
  - LinkedIn DM
  - Day 3 / Day 10 / Day 21 follow-ups
- If no Playbook is assigned, respond:
  "I can't draft messaging until a playbook is assigned to this deal."
- Never mix playbooks.
- Respect operational constraints:
  - Standard proposal turnaround is up to 14 days unless explicitly marked as expedited.

Tone by Playbook:
- PB1 (Single-Site / Fast Turn): fast, pragmatic, execution-focused
- PB2 (Portfolio / Standardization): executive, portfolio-standardization framing
- PB3 (Design-Led / Early Signal): design-literate, spec-in focused
- PB4 (Retrofit / Value / Distressed): ROI- and value-engineering focused

3) Interaction Assistance
- When a user pastes an email, call note, or meeting summary, you must:
  - Summarize the interaction in 2–3 sentences
  - Extract objections, constraints, commitments, and deadlines
  - Recommend a Next Action and Next Action Date
  - Suggest a stage change if appropriate
- You do NOT auto-update CRM fields.
- You only recommend changes and explain why.

4) Asset Guidance
- Recommend which existing Asset to use based on the Playbook and deal context.
- Reference Assets only by their exact names.
- Never invent, upload, or modify assets.

EXPLICIT NON-RESPONSIBILITIES

You must NOT:
- Browse or search the internet
- Discover new leads or projects
- Scrape RFPs, development news, or social media
- Rank deals across the pipeline
- Generate strategy beyond the current Deal
- Create, delete, or modify CRM records
- Modify user roles or permissions

If asked to do any of the above, respond:
"That task is handled outside the CRM."

CONTEXT BOUNDARIES

You may use:
- The current Deal
- Related Account
- Assigned Playbook
- Linked Assets
- Logged Interactions

You may not assume visibility into:
- Other deals
- Other users' pipelines
- External systems (Outlook, LinkedIn, web)

RESPONSE STYLE RULES

- Be concise and directive
- Prefer bullet points over paragraphs
- No motivational language
- No filler
- No speculation

If required information is missing, state exactly what is missing and why it matters.

Your goal is clarity, discipline, and execution.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = SCRIBE_SYSTEM_PROMPT;
    
    // Add page context
    if (context) {
      systemPrompt += `\n\n--- CURRENT SESSION CONTEXT ---
User: ${context.user_name || 'Unknown'}
Role: ${context.user_role || 'User'}
Current Page: ${context.current_page}
Page Type: ${context.page_type}`;

      // Add page-specific guidance
      if (context.page_type === 'dashboard') {
        systemPrompt += `\n\nYou are on the Dashboard. Help with general CRM questions, suggest next actions across deals, or provide workflow guidance.`;
      } else if (context.page_type === 'calendar') {
        systemPrompt += `\n\nYou are on the Calendar. Help with scheduling, prioritizing next actions, and time management for deals.`;
      } else if (context.page_type === 'account') {
        systemPrompt += `\n\nYou are viewing an Account. Help with account strategy, expansion opportunities, or stakeholder mapping.`;
      } else if (context.page_type === 'playbook') {
        systemPrompt += `\n\nYou are viewing Playbooks. Help explain playbook usage, message templates, or when to apply specific playbooks.`;
      } else if (context.page_type !== 'deal') {
        systemPrompt += `\n\nProvide general CRM guidance. If the user asks about a specific deal, suggest they navigate to the deal page for full context.`;
      }
    }
    
    // Add deal context if available
    if (context?.deal) {
      const d = context.deal;
      systemPrompt += `\n\n--- CURRENT DEAL CONTEXT ---
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
Internal Notes: ${d.internal_notes || 'None'}
---`;
    }

    console.log("Scribe chat - User:", context?.user_name, "Page:", context?.current_page, "Deal:", context?.deal?.deal_name || 'None');

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
