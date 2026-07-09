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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quoteId, workspaceId, currentItems } = await req.json();
    if (!quoteId || !workspaceId) {
      return new Response(JSON.stringify({ error: "Missing quoteId or workspaceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: quote, error: qErr } = await supabase
      .from("quotes").select("*").eq("id", quoteId).single();
    if (qErr || !quote) throw new Error(qErr?.message ?? "Quote not found");

    const categories: string[] = Array.isArray(quote.service_category) ? quote.service_category : [];
    const workItems = Array.isArray(quote.sow_work_items) ? quote.sow_work_items : [];

    const systemPrompt = `You suggest concrete DELIVERABLE ARTIFACTS for a Red Loft Consulting Statement of Work. Deliverables are the tangible items handed to the client (e.g. Invoice, Standard Operating Procedures document, Written Policies, Training Documents, Equipment List, Design Package, Space Plan, Program Curriculum, Vendor RFPs, Punch List).

Return ONLY valid JSON:
{ "items": [{ "name": string, "description": string }], "warnings": [string] }

Base the list on the active service categories, engagement type, service_details, and the WORK STREAMS below. Keep names short (2-5 words). Descriptions are one short sentence describing the artifact. Merge with currentItems: keep user-authored entries, refine and add missing ones. Do not include pricing.`;

    const userPrompt = `SERVICE_CATEGORIES: ${JSON.stringify(categories)}
ENGAGEMENT_TYPE: ${quote.engagement_type}
SERVICE_DETAILS: ${JSON.stringify(quote.service_details ?? {})}
WORK_ITEMS: ${JSON.stringify(workItems)}
CURRENT_ITEMS: ${JSON.stringify(currentItems ?? [])}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      const msg = response.status === 429
        ? "Rate limit exceeded. Try again shortly."
        : response.status === 402
        ? "AI credits exhausted. Add credits to continue."
        : "AI service unavailable";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    return new Response(JSON.stringify({ items, warnings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-deliverables error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});