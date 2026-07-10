import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quoteId, workspaceId } = await req.json();
    if (!quoteId || !workspaceId) {
      return new Response(JSON.stringify({ error: "Missing quoteId or workspaceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load quote
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();
    if (qErr || !quote) throw new Error(qErr?.message ?? "Quote not found");

    // Load Service Knowledge Playbook
    const { data: pb } = await supabase
      .from("playbooks")
      .select(
        "opp_programming,opp_design,opp_policy,eng_one_time,eng_retainer,eng_phased,dtype_new_construction,dtype_retrofit,design_details,programming_details,policy_details,terms_and_conditions",
      )
      .eq("workspace_id", workspaceId)
      .eq("kind", "service_knowledge")
      .maybeSingle();

    const playbookBlock = pb
      ? Object.entries(pb)
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => `## ${k}\n${v}`)
          .join("\n\n")
      : "(no playbook content available)";

    const categories: string[] = Array.isArray(quote.service_category) ? quote.service_category : [];
    const details = quote.service_details ?? {};
    const existingDeliverables = Array.isArray(quote.sow_deliverables) ? quote.sow_deliverables : [];
    const pillars: string[] = Array.isArray(quote.sow_approach_pillars) ? quote.sow_approach_pillars : [];

    const formState = {
      project: {
        project_name: quote.snapshot_project_name,
        project_address: quote.snapshot_project_address,
        client_contact: quote.snapshot_contact_name,
      },
      engagement: {
        active_components: categories,
        engagement_type: quote.engagement_type,
        timeline_urgency: quote.timeline_urgency,
        decision_maker_count: quote.decision_maker_count,
      },
      component_details: details,
      four_ps_emphasis_tags: pillars,
      salesperson_notes: {
        executive_summary: quote.sow_executive_summary ?? "",
        problem_statement: quote.sow_problem_statement ?? "",
        proposed_approach: quote.sow_proposed_approach ?? "",
      },
      existing_deliverables: existingDeliverables,
    };

    const systemPrompt = `You are drafting a Statement of Work (SOW) for Red Loft Consulting. You are given the ENTIRE form state at once and must produce the complete SOW body in ONE cross-referenced pass.

SERVICE KNOWLEDGE PLAYBOOK (structural + consistency backstop — never copy verbatim into client-facing prose):
${playbookBlock}

MERGE RULES:
- Salesperson notes are PRIMARY content. Rewrite into polished client-facing prose, expanding where thin.
- Structured fields are primary when notes are blank — draft the section from them.
- Existing Deliverables rows are primary; refine and complete them. If empty, generate suggested rows from the active component(s)' typical deliverables and the engagement type's phase structure.
- Milestones are owned by a separate step and MUST NOT be generated here. Do not include a "milestones" field in the output.
- Use the playbook only to (a) catch standard scope components the notes missed, (b) apply correct disclaimers, (c) keep terminology consistent. Never output playbook language verbatim.

CROSS-SECTION CONSISTENCY (resolve these in one pass, do not generate sections independently):
- Funding Source Status "grant pending" → recommend Phased engagement framing in Proposed Approach AND urgency framing in Problem Statement.
- Compliance drivers (ADA, local code, licensing, Fitwel) → trigger the non-architectural disclaimer worded around the SPECIFIC driver named, sitting with the client's architect.
- Multiple active components → Proposed Approach must address each so the reader can tell them apart. Group Deliverables by component.
- 4 P's emphasis tags (Policy/People/Process/Product) are a separate axis from Opportunity Type — apply them as emphasis in Proposed Approach even when they don't match the component types.
- Decision-Maker Count > 1 → Proposed Approach names a stakeholder alignment/review step, do NOT fabricate named roles.
- Timeline/Urgency modifies phase compression and Kickoff date only — do not invent scope.
- Desired outcome metric flows into Proposed Approach's Product-pillar language AND appears in Deliverables as the named measurement framework.

TERMS AND CONDITIONS:
- Use the playbook's terms_and_conditions as the source. Only lightly adapt scope-specific references. Do NOT rewrite legal language.
- If the playbook has no terms_and_conditions, return an empty string.

STRICT RULES:
- Never include a total dollar amount, hourly-rate math, or labor/contractor pricing. Rate & Billing Terms is handled separately.
- Never invent facts, names, dates, or numbers not present in the input.
- If an atypical pairing appears (e.g., Design + Retainer without a rolling-pipeline justification in notes), do NOT silently generate scope for it — add a plain-English string to "warnings" flagging it back.

OUTPUT: Return ONLY valid JSON matching this exact shape, no prose, no code fences:
{
  "executive_summary": string,
  "problem_statement": string,
  "proposed_approach": string,
  "deliverables": [{ "name": string, "description": string }],
  "terms_and_conditions": string,
  "warnings": [string]
}
Keep warnings [] when nothing is atypical.`;

    const userPrompt = `FORM STATE:\n${JSON.stringify(formState, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const isCredit = response.status === 402 || response.status === 403;
      const status = response.status === 429 ? 429 : isCredit ? 402 : 500;
      const msg =
        response.status === 429
          ? "Rate limit exceeded. Try again shortly."
          : isCredit
          ? "Workspace AI credit limit reached. Ask your workspace owner to add credits or raise the limit."
          : "AI service unavailable";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
      }
    }

    const patch: Record<string, any> = {
      sow_executive_summary: parsed.executive_summary ?? quote.sow_executive_summary ?? "",
      sow_problem_statement: parsed.problem_statement ?? quote.sow_problem_statement ?? "",
      sow_proposed_approach: parsed.proposed_approach ?? quote.sow_proposed_approach ?? "",
      sow_deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : existingDeliverables,
      sow_terms_and_conditions: parsed.terms_and_conditions ?? "",
    };

    const { error: uErr } = await supabase.from("quotes").update(patch).eq("id", quoteId);
    if (uErr) throw new Error(uErr.message);

    return new Response(
      JSON.stringify({ ok: true, warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-sow error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});