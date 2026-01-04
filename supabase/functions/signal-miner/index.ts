import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignalMinerRequest {
  geography: string;
  verticals: string[];
  signalType: string;
  limit: number;
}

interface StructuredLead {
  company: string;
  project_name: string;
  location: string;
  facility_type: string | null;
  signal_reason: string | null;
  estimated_timeline: string | null;
  recommended_playbook: string | null;
  stakeholders: Array<{
    name: string;
    role_type: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  }>;
  first_touch_email: string | null;
  linkedin_dm: string | null;
  source_links: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user's profile for workspace_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("workspace_id, user_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { geography, verticals, signalType, limit = 5 }: SignalMinerRequest = await req.json();

    if (!geography || !verticals?.length || !signalType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: geography, verticals, signalType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API keys
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!firecrawlKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Lovable AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search queries based on verticals and signal type
    const searchQueries = buildSearchQueries(verticals, signalType, geography);
    console.log("Search queries:", searchQueries);

    // Execute Firecrawl searches
    const allSearchResults: any[] = [];
    for (const query of searchQueries) {
      try {
        console.log(`Searching: ${query}`);
        const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: Math.ceil(limit / searchQueries.length) + 2,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`Firecrawl search error for "${query}":`, errorText);
          continue;
        }

        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data) {
          allSearchResults.push(...searchData.data);
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    if (allSearchResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, leads: [], message: "No search results found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${allSearchResults.length} search results`);

    // Prepare content for AI extraction
    const searchContent = allSearchResults
      .map((r, i) => `--- Result ${i + 1} ---\nURL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\n\nContent:\n${r.markdown?.slice(0, 3000) || r.description || ""}`)
      .join("\n\n");

    // Call Lovable AI to extract structured lead data
    const systemPrompt = `You are a sales intelligence assistant for a premium fitness equipment company. Extract potential B2B leads from the provided search results.
Focus on companies that show signs of: ${signalType}.
Target verticals: ${verticals.join(", ")}.
Geographic focus: ${geography}.

For each valid lead, extract:
- company: The company name
- project_name: Specific project or initiative name (if mentioned)
- location: City, state or region
- facility_type: One of Multifamily, Boutique Studio, Gym, Country Club (or null if unclear)
- signal_reason: Why this appears to be a lead opportunity (2-3 sentences explaining the signal)
- estimated_timeline: When the project/need might be addressed
- recommended_playbook: Suggest PB2 (Portfolio/multi-site), PB3 (Design-Led/boutique), or PB4 (Retrofit/renovation) based on the signal type
- stakeholders: Array of people mentioned with their roles
- source_links: URLs where this information was found

IMPORTANT - Generate personalized outreach drafts for each lead:
- first_touch_email: Write a professional 3-4 paragraph sales email (under 200 words). Start with a hook referencing their specific project/signal. Introduce our premium fitness equipment solutions. Highlight relevant value props for their facility type (e.g., durability for high-traffic gyms, design aesthetics for boutique studios, resident experience for multifamily). End with a clear call-to-action for a discovery call.
- linkedin_dm: Write a concise 2-3 sentence LinkedIn connection request (under 50 words). Mention their project briefly and express interest in discussing how we can support their fitness equipment needs.

Be selective - only include results that genuinely match the criteria. Skip irrelevant results.`;

    const userPrompt = `Extract up to ${limit} qualified leads from these search results:\n\n${searchContent}`;

    console.log("Calling Lovable AI for lead extraction...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_leads",
              description: "Extract structured lead data from search results",
              parameters: {
                type: "object",
                properties: {
                  leads: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        project_name: { type: "string" },
                        location: { type: "string" },
                        facility_type: { type: "string", enum: ["Multifamily", "Boutique Studio", "Gym", "Country Club", "null"] },
                        signal_reason: { type: "string" },
                        estimated_timeline: { type: "string" },
                        recommended_playbook: { type: "string", enum: ["PB2", "PB3", "PB4"] },
                        stakeholders: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              role_type: { type: "string" },
                              title: { type: "string" },
                              email: { type: "string" },
                              phone: { type: "string" },
                              linkedin_url: { type: "string" },
                            },
                            required: ["name", "role_type"],
                          },
                        },
                        first_touch_email: { type: "string" },
                        linkedin_dm: { type: "string" },
                        source_links: { type: "array", items: { type: "string" } },
                      },
                      required: ["company", "project_name", "location", "signal_reason", "first_touch_email", "linkedin_dm"],
                    },
                  },
                },
                required: ["leads"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_leads" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Parse the tool call response
    let extractedLeads: StructuredLead[] = [];
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        extractedLeads = parsed.leads || [];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedLeads.length} leads`);

    if (extractedLeads.length === 0) {
      return new Response(
        JSON.stringify({ success: true, leads: [], message: "No qualified leads found in search results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert leads into database
    const createdLeads: string[] = [];
    for (const lead of extractedLeads) {
      try {
        // Check for existing lead with same company + project + location
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("workspace_id", profile.workspace_id)
          .eq("company", lead.company)
          .eq("project_name", lead.project_name)
          .eq("location", lead.location)
          .maybeSingle();

        if (existingLead) {
          console.log(`Skipping duplicate lead: ${lead.company} - ${lead.project_name}`);
          continue;
        }

        // Insert lead
        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert({
            workspace_id: profile.workspace_id,
            owner_user_id: profile.user_id,
            company: lead.company,
            project_name: lead.project_name,
            location: lead.location,
            facility_type: lead.facility_type === "null" ? null : lead.facility_type,
            signal_reason: lead.signal_reason,
            estimated_timeline: lead.estimated_timeline,
            recommended_playbook: lead.recommended_playbook,
            first_touch_email: lead.first_touch_email,
            linkedin_dm: lead.linkedin_dm,
            source_links: lead.source_links || [],
            status: "New",
          })
          .select("id")
          .single();

        if (leadError) {
          console.error("Error inserting lead:", leadError);
          continue;
        }

        createdLeads.push(newLead.id);

        // Insert stakeholders
        if (lead.stakeholders?.length > 0) {
          const stakeholderInserts = lead.stakeholders.map((s) => ({
            workspace_id: profile.workspace_id,
            lead_id: newLead.id,
            stakeholder_name: s.name,
            stakeholder_role_type: s.role_type || "Other",
            title: s.title,
            email: s.email,
            phone: s.phone,
            linkedin_url: s.linkedin_url,
            confidence: "UNCONFIRMED",
          }));

          const { error: stakeholderError } = await supabase
            .from("lead_stakeholders")
            .insert(stakeholderInserts);

          if (stakeholderError) {
            console.error("Error inserting stakeholders:", stakeholderError);
          }
        }

        console.log(`Created lead: ${lead.company} - ${lead.project_name}`);
      } catch (error) {
        console.error("Error processing lead:", error);
      }
    }

    console.log(`Successfully created ${createdLeads.length} leads`);

    return new Response(
      JSON.stringify({
        success: true,
        leads: createdLeads,
        message: `Created ${createdLeads.length} new leads`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Signal miner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSearchQueries(verticals: string[], signalType: string, geography: string): string[] {
  const signalKeywords: Record<string, string[]> = {
    "New Build": ["new construction", "groundbreaking", "development project", "new facility"],
    "Renovation": ["renovation project", "remodel", "upgrade", "modernization"],
    "RFP": ["RFP", "request for proposal", "bid", "procurement"],
    "Expansion": ["expansion", "growing", "new location", "opening"],
  };

  const verticalKeywords: Record<string, string[]> = {
    "Multifamily": ["multifamily", "apartment complex", "residential development", "amenity"],
    "Boutique Studio": ["boutique fitness", "fitness studio", "wellness studio"],
    "Gym": ["gym", "fitness center", "health club", "recreation center"],
    "Country Club": ["country club", "golf club", "private club", "resort"],
  };

  const queries: string[] = [];
  const signals = signalKeywords[signalType] || [signalType.toLowerCase()];

  for (const vertical of verticals) {
    const verticalTerms = verticalKeywords[vertical] || [vertical.toLowerCase()];
    const signal = signals[0];
    const verticalTerm = verticalTerms[0];

    // Build focused query
    const query = geography.toLowerCase() === "national"
      ? `"${signal}" "${verticalTerm}" fitness equipment 2025`
      : `"${signal}" "${verticalTerm}" fitness equipment ${geography} 2025`;

    queries.push(query);
  }

  return queries.slice(0, 4); // Max 4 queries
}
