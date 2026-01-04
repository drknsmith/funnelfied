import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Treneur workspace ID
const TRENEUR_WORKSPACE_ID = "14e69d30-13a2-45c0-bcea-0ebe6e638b47";

interface SignalMinerRequest {
  geography: string;
  verticals: string[];
  signalType: string;
  limit: number;
  searchContext?: string;
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
  // Treneur-specific fields
  health_score?: number;
  signal_details?: {
    staffing_instability: { detected: boolean; details: string | null };
    business_model_transition: { detected: boolean; details: string | null };
    expansion_contraction: { detected: boolean; details: string | null };
    digital_weakness: { detected: boolean; details: string | null };
    trainer_sentiment: { detected: boolean; details: string | null };
  };
}

// Geocode location to lat/lng using Mapbox
async function geocodeLocation(location: string, mapboxToken: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&country=us&limit=1`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
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

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("workspace_id, user_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for super_admin workspace override
    const { data: override } = await supabaseAdmin
      .from("super_admin_workspace_overrides")
      .select("active_workspace_id")
      .eq("user_id", user.id)
      .single();

    const workspaceId = override?.active_workspace_id || profile.workspace_id;
    const isTreneurWorkspace = workspaceId === TRENEUR_WORKSPACE_ID;
    
    console.log("Using workspace:", workspaceId, isTreneurWorkspace ? "(Treneur mode)" : "(Standard mode)");

    // Parse request body
    const { geography, verticals, signalType, limit = 5, searchContext }: SignalMinerRequest = await req.json();

    if (!geography || !verticals?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: geography, verticals" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For non-Treneur workspaces, signalType is required
    if (!isTreneurWorkspace && !signalType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: signalType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API keys
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "Lovable AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search queries
    const searchQueries = isTreneurWorkspace 
      ? buildTreneurSearchQueries(verticals, geography)
      : buildSearchQueries(verticals, signalType, geography);
    
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
            limit: 10, // Increased from dynamic calculation for better coverage
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

    // Build system prompt based on workspace
    const systemPrompt = isTreneurWorkspace 
      ? buildTreneurSystemPrompt(verticals, geography, searchContext)
      : buildStandardSystemPrompt(verticals, signalType, geography, searchContext);

    const userPrompt = `Extract up to ${limit} qualified leads from these search results:\n\n${searchContent}`;

    console.log("Calling Lovable AI for lead extraction...");

    // Build AI request with appropriate tool schema
    const aiBody = isTreneurWorkspace
      ? buildTreneurAIRequest(systemPrompt, userPrompt)
      : buildStandardAIRequest(systemPrompt, userPrompt);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
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
        // Check for existing lead
        const { data: existingLead } = await supabaseAdmin
          .from("leads")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("company", lead.company)
          .eq("project_name", lead.project_name)
          .eq("location", lead.location)
          .maybeSingle();

        if (existingLead) {
          console.log(`Skipping duplicate lead: ${lead.company} - ${lead.project_name}`);
          continue;
        }

        // Geocode location if Mapbox token is available
        let coordinates: { lat: number; lng: number } | null = null;
        if (mapboxToken) {
          coordinates = await geocodeLocation(lead.location, mapboxToken);
        }

        // Insert lead
        const insertData: any = {
          workspace_id: workspaceId,
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
        };

        // Add Treneur-specific fields
        if (isTreneurWorkspace) {
          insertData.health_score = lead.health_score || null;
          insertData.signal_details = lead.signal_details || null;
        }

        // Add coordinates if geocoded
        if (coordinates) {
          insertData.lat = coordinates.lat;
          insertData.lng = coordinates.lng;
        }

        const { data: newLead, error: leadError } = await supabaseAdmin
          .from("leads")
          .insert(insertData)
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
            workspace_id: workspaceId,
            lead_id: newLead.id,
            stakeholder_name: s.name,
            stakeholder_role_type: s.role_type || "Other",
            title: s.title,
            email: s.email,
            phone: s.phone,
            linkedin_url: s.linkedin_url,
            confidence: "UNCONFIRMED",
          }));

          const { error: stakeholderError } = await supabaseAdmin
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

// Treneur-specific search queries - BROADENED for better results
function buildTreneurSearchQueries(verticals: string[], geography: string): string[] {
  const queries: string[] = [];
  const isNational = geography.toLowerCase() === "national";
  const geo = isNational ? "" : geography;
  
  // Primary: Direct location-based gym searches (no restrictive phrases)
  queries.push(geo ? `gyms in ${geo}` : "gyms fitness centers");
  queries.push(geo ? `fitness studios ${geo}` : "fitness studios boutique");
  queries.push(geo ? `personal training gym ${geo}` : "personal training gym");
  
  // Secondary: Vertical-specific searches
  const verticalSearchTerms: Record<string, string> = {
    "Boutique Fitness Studio": "boutique fitness studio",
    "Personal Training Studio": "personal training studio", 
    "CrossFit Box": "CrossFit gym box",
    "Yoga Studio": "yoga studio classes",
    "Commercial Gym": "gym fitness center",
  };
  
  for (const vertical of verticals.slice(0, 2)) {
    const term = verticalSearchTerms[vertical] || vertical.toLowerCase();
    queries.push(geo ? `${term} ${geo}` : term);
  }
  
  // Tertiary: Hiring/staffing signals (without exact match quotes)
  queries.push(geo ? `gym hiring trainers ${geo}` : "gym hiring personal trainers");
  
  // Return up to 6 queries for better coverage
  return queries.slice(0, 6);
}

// Standard search queries for other workspaces
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

    const query = geography.toLowerCase() === "national"
      ? `"${signal}" "${verticalTerm}" fitness equipment 2025`
      : `"${signal}" "${verticalTerm}" fitness equipment ${geography} 2025`;

    queries.push(query);
  }

  return queries.slice(0, 4);
}

// Treneur system prompt with health scoring
function buildTreneurSystemPrompt(verticals: string[], geography: string, searchContext?: string): string {
  return `You are a sales intelligence assistant for Treneur, a platform connecting personal trainers with fitness facilities for on-demand space rental.

${searchContext || 'Target facilities that show signs of trainer supply problems, staffing instability, or openness to hybrid access models.'}

Analyze search results for fitness facilities showing these SIGNAL CATEGORIES:

1. STAFFING INSTABILITY SIGNALS (strongest indicator):
   - "Hiring personal trainers" repeated over months
   - High churn trainer postings on Indeed or LinkedIn
   - Language like "independent contractors welcome" or "bring your own clients"
   - Constant recruiting = bleeding trainers

2. BUSINESS MODEL TRANSITION SIGNALS:
   - Traditional gym adding "independent trainer" language
   - Studios converting to hybrid access models
   - Facilities adding hourly or session-based access

3. EXPANSION OR CONTRACTION SIGNALS:
   - New location announcements
   - Renovations, rebrands
   - Ownership changes, franchise resales

4. DIGITAL FOOTPRINT WEAKNESS:
   - No clear trainer onboarding page
   - Outdated scheduling or contact flows
   - Broken or generic "Careers" pages

5. TRAINER SENTIMENT BLEED-THROUGH:
   - Trainers tagging facilities in negative posts
   - Reddit threads naming specific gyms
   - Google reviews referencing trainer turnover

Target verticals: ${verticals.join(", ")}.
Geographic focus: ${geography}.

For each valid lead, you MUST provide:
- company: The facility/gym name
- project_name: Use the facility name or specific initiative if mentioned
- location: City, state
- facility_type: One of ${verticals.join(", ")}
- signal_reason: 2-3 sentences explaining which signals were detected
- health_score: INTEGER from 1-10 where:
  * 1-3 = RED (High pain, GREAT prospect - multiple strong signals)
  * 4-7 = YELLOW (Moderate signals - some indicators present)
  * 8-10 = GREEN (Healthy facility - few/no signals, lower priority)
- signal_details: Object with all 5 signal categories showing detected: true/false and details
- stakeholders: Any staff/owners mentioned
- first_touch_email: Professional 3-4 paragraph email introducing Treneur's trainer access solution
- linkedin_dm: 2-3 sentence LinkedIn message

Be selective - only include facilities that match the criteria. Lower health scores = better prospects.`;
}

// Standard system prompt for other workspaces
function buildStandardSystemPrompt(verticals: string[], signalType: string, geography: string, searchContext?: string): string {
  const businessContext = searchContext || 'Premium fitness equipment company targeting B2B sales for commercial fitness installations';
  
  return `You are a sales intelligence assistant. ${businessContext}

Extract potential B2B leads from the provided search results.
Focus on companies that show signs of: ${signalType}.
Target verticals: ${verticals.join(", ")}.
Geographic focus: ${geography}.

For each valid lead, extract:
- company: The company name
- project_name: Specific project or initiative name (if mentioned)
- location: City, state or region
- facility_type: One of ${verticals.join(", ")} (or null if unclear)
- signal_reason: Why this appears to be a lead opportunity (2-3 sentences explaining the signal)
- estimated_timeline: When the project/need might be addressed
- recommended_playbook: Suggest PB2 (Portfolio/multi-site), PB3 (Design-Led/boutique), or PB4 (Retrofit/renovation) based on the signal type
- stakeholders: Array of people mentioned with their roles
- source_links: URLs where this information was found

IMPORTANT - Generate personalized outreach drafts for each lead:
- first_touch_email: Write a professional 3-4 paragraph sales email (under 200 words). Start with a hook referencing their specific project/signal. Introduce our solutions. Highlight relevant value props for their facility type. End with a clear call-to-action for a discovery call.
- linkedin_dm: Write a concise 2-3 sentence LinkedIn connection request (under 50 words). Mention their project briefly and express interest in discussing how we can support their needs.

Be selective - only include results that genuinely match the criteria. Skip irrelevant results.`;
}

// Treneur AI request with health scoring tool
function buildTreneurAIRequest(systemPrompt: string, userPrompt: string) {
  return {
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
          description: "Extract structured lead data with health scoring for Treneur",
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
                    facility_type: { 
                      type: "string", 
                      enum: ["Boutique Fitness Studio", "Personal Training Studio", "CrossFit Box", "Yoga Studio", "Commercial Gym", "null"] 
                    },
                    signal_reason: { type: "string" },
                    health_score: { 
                      type: "integer", 
                      minimum: 1, 
                      maximum: 10,
                      description: "1-3=Red(high pain/great prospect), 4-7=Yellow(moderate), 8-10=Green(healthy/lower priority)" 
                    },
                    signal_details: {
                      type: "object",
                      properties: {
                        staffing_instability: {
                          type: "object",
                          properties: {
                            detected: { type: "boolean" },
                            details: { type: "string" }
                          },
                          required: ["detected"]
                        },
                        business_model_transition: {
                          type: "object",
                          properties: {
                            detected: { type: "boolean" },
                            details: { type: "string" }
                          },
                          required: ["detected"]
                        },
                        expansion_contraction: {
                          type: "object",
                          properties: {
                            detected: { type: "boolean" },
                            details: { type: "string" }
                          },
                          required: ["detected"]
                        },
                        digital_weakness: {
                          type: "object",
                          properties: {
                            detected: { type: "boolean" },
                            details: { type: "string" }
                          },
                          required: ["detected"]
                        },
                        trainer_sentiment: {
                          type: "object",
                          properties: {
                            detected: { type: "boolean" },
                            details: { type: "string" }
                          },
                          required: ["detected"]
                        }
                      }
                    },
                    estimated_timeline: { type: "string" },
                    recommended_playbook: { type: "string" },
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
                  required: ["company", "project_name", "location", "signal_reason", "health_score", "first_touch_email", "linkedin_dm"],
                },
              },
            },
            required: ["leads"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "extract_leads" } },
  };
}

// Standard AI request for other workspaces
function buildStandardAIRequest(systemPrompt: string, userPrompt: string) {
  return {
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
  };
}
