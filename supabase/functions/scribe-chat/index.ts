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
    const { messages, dealContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = SCRIBE_SYSTEM_PROMPT;
    
    if (dealContext) {
      systemPrompt += `\n\n--- CURRENT DEAL CONTEXT ---
Deal Name: ${dealContext.deal_name || dealContext.account_name || 'Not set'}
Account: ${dealContext.account_name || 'Unknown'}
Stage: ${dealContext.stage || 'Unknown'}
Deal Type: ${dealContext.deal_type || 'Not set'}
Playbook: ${dealContext.playbook_name || 'None assigned'}
Primary Contact: ${dealContext.contact_name || 'Not set'}
Deal Size: ${dealContext.deal_size || 'Not set'}
Probability: ${dealContext.probability || 'Not set'}%
Next Action: ${dealContext.next_action || 'Not set'}
Next Action Date: ${dealContext.next_action_date || 'Not set'}
Internal Notes: ${dealContext.internal_notes || 'None'}
---`;
    }

    console.log("Calling Lovable AI Gateway with deal context:", dealContext?.deal_name || 'No context');

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
