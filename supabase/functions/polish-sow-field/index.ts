import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIELD_GUIDE: Record<string, string> = {
  executive_summary:
    "A crisp 3-6 sentence executive summary of the engagement in Red Loft's voice. Confident, practical, no fluff.",
  problem_statement:
    "A clear 3-6 sentence problem statement that names the client's operational or design gaps without prescribing solutions.",
  proposed_approach:
    "A 4-8 sentence proposed approach describing HOW Red Loft will engage, referencing which of the 4 P's pillars (Policy, People, Process, Product) apply where relevant. No dollar amounts.",
  deliverable:
    "A single deliverable description, 1-3 sentences, concrete and outcome-oriented.",
  milestone:
    "A single milestone description, 1-2 sentences, focused on what will be true when the milestone is met.",
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

    const { field, text, workspaceId } = await req.json();
    const guide = FIELD_GUIDE[field] ?? "Polish this text for clarity and professionalism.";

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Empty text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load Service Knowledge Playbook (singleton per workspace)
    let playbookContext = "";
    if (workspaceId) {
      const { data: pb } = await supabase
        .from("playbooks")
        .select(
          "opp_programming,opp_design,opp_policy,eng_one_time,eng_retainer,eng_phased,dtype_new_construction,dtype_retrofit,design_details,programming_details,policy_details",
        )
        .eq("workspace_id", workspaceId)
        .eq("kind", "service_knowledge")
        .maybeSingle();
      if (pb) {
        const parts: string[] = [];
        const push = (label: string, v?: string | null) => {
          if (v && v.trim()) parts.push(`${label}: ${v.trim()}`);
        };
        push("Programming opportunities", pb.opp_programming);
        push("Design opportunities", pb.opp_design);
        push("Policy opportunities", pb.opp_policy);
        push("One-time engagements", pb.eng_one_time);
        push("Retainer engagements", pb.eng_retainer);
        push("Phased engagements", pb.eng_phased);
        push("New construction design", pb.dtype_new_construction);
        push("Retrofit design", pb.dtype_retrofit);
        push("Design details", pb.design_details);
        push("Programming details", pb.programming_details);
        push("Policy details", pb.policy_details);
        if (parts.length) playbookContext = `\n\nSERVICE KNOWLEDGE PLAYBOOK (use for voice and scope alignment):\n${parts.join("\n")}`;
      }
    }

    const systemPrompt = `You polish Statement of Work text for Red Loft Consulting.
${guide}

STRICT RULES:
- Stay within scope-and-rate language only.
- Never mention legal terms, liability, IP ownership, warranties, or indemnification.
- Never include a total dollar amount or hours-times-rate math.
- Never invent facts, names, dates, or numbers not present in the input.
- Preserve the author's meaning; improve clarity, structure, and tone.
- Return only the polished text — no preamble, no markdown fences, no commentary.${playbookContext}`;

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
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const polished = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ polished }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("polish-sow-field error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});