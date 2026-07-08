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

    const { quoteId, workspaceId, currentMilestones } = await req.json();
    if (!quoteId || !workspaceId) {
      return new Response(JSON.stringify({ error: "Missing quoteId or workspaceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();
    if (qErr || !quote) throw new Error(qErr?.message ?? "Quote not found");

    const { data: pb } = await supabase
      .from("playbooks")
      .select("eng_one_time,eng_retainer,eng_phased,design_details,programming_details,policy_details")
      .eq("workspace_id", workspaceId)
      .eq("kind", "service_knowledge")
      .maybeSingle();

    const playbookBlock = pb
      ? Object.entries(pb)
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => `## ${k}\n${v}`)
          .join("\n\n")
      : "(no playbook content available)";

    const milestonesIn = Array.isArray(currentMilestones)
      ? currentMilestones
      : Array.isArray(quote.sow_milestones)
      ? quote.sow_milestones
      : [];

    const today = new Date().toISOString().slice(0, 10);

    const payload = {
      today,
      engagement_type: quote.engagement_type,
      timeline_urgency: quote.timeline_urgency,
      active_components: quote.service_category ?? [],
      component_details: quote.service_details ?? {},
      salesperson_notes: {
        executive_summary: quote.sow_executive_summary ?? "",
        problem_statement: quote.sow_problem_statement ?? "",
        proposed_approach: quote.sow_proposed_approach ?? "",
      },
      current_milestones: milestonesIn,
    };

    const systemPrompt = `You refine a project milestone list for a Red Loft Consulting Statement of Work.

PLAYBOOK (phase structure reference — do not copy verbatim):
${playbookBlock}

RULES:
- Preserve the salesperson's existing milestone names whenever present. Fill in blank names/descriptions and set realistic target_date values.
- Anchor all target_date values off "today" (${today}) working forward, respecting Timeline/Urgency. Never invent dates outside the stated urgency window.
- Base the phase structure on Engagement Type (one-time / retainer / phased) and the active components.
- If current_milestones is empty, generate a suggested set from active components + engagement type.
- Do NOT touch executive summary, problem statement, proposed approach, deliverables, or terms — milestones only.
- Never invent client-specific facts, names, or dollar amounts.

OUTPUT: Return ONLY valid JSON, no prose, no code fences, matching:
{
  "milestones": [{ "name": string, "description": string, "target_date": string }],
  "warnings": [string]
}
target_date must be YYYY-MM-DD. Keep warnings [] when nothing is atypical.`;

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
          { role: "user", content: JSON.stringify(payload, null, 2) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      const msg =
        response.status === 429
          ? "Rate limit exceeded. Try again shortly."
          : response.status === 402
          ? "AI credits exhausted. Add credits to continue."
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

    const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : milestonesIn;
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    return new Response(
      JSON.stringify({ ok: true, milestones, warnings }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("suggest-milestones error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});