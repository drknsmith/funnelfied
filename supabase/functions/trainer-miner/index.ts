import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrainerMinerRequest {
  accountId: string;
}

interface StructuredTrainer {
  name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  career_mentions: string | null;
  career_health_score: number;
  source_links: string[];
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { accountId }: TrainerMinerRequest = await req.json();

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: accountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the account to find its location
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id, name, workspace_id, lat, lng, segment")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API keys
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!firecrawlKey || !lovableKey) {
      return new Response(
        JSON.stringify({ error: "Required API keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the account's location for the search
    let searchLocation = account.segment || "";
    
    // If account has lat/lng, use reverse geocoding to get city name
    if (account.lat && account.lng && mapboxToken) {
      try {
        const reverseResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${account.lng},${account.lat}.json?access_token=${mapboxToken}&types=place&limit=1`
        );
        const reverseData = await reverseResponse.json();
        if (reverseData.features && reverseData.features.length > 0) {
          searchLocation = reverseData.features[0].place_name;
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    }

    if (!searchLocation) {
      // Try to extract location from account name or use a default
      searchLocation = "nearby";
    }

    console.log(`Searching for trainers near: ${searchLocation}`);

    // Build search queries for trainers
    const searchQueries = [
      `personal trainer "${searchLocation}" fitness professional`,
      `certified fitness coach "${searchLocation}" independent`,
      `personal training services "${searchLocation}"`,
    ];

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
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`Firecrawl search error:`, errorText);
          continue;
        }

        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data) {
          allSearchResults.push(...searchData.data);
        }
      } catch (error) {
        console.error(`Error searching:`, error);
      }
    }

    if (allSearchResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, trainers: [], message: "No trainers found in the area" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${allSearchResults.length} search results`);

    // Prepare content for AI extraction
    const searchContent = allSearchResults
      .map((r, i) => `--- Result ${i + 1} ---\nURL: ${r.url}\nTitle: ${r.title || "N/A"}\n\nContent:\n${r.markdown?.slice(0, 2000) || r.description || ""}`)
      .join("\n\n");

    const systemPrompt = `You are an assistant extracting personal trainer information from search results.

Extract individual personal trainers who work in or near: ${searchLocation}

For each trainer found, provide:
- name: Full name of the trainer
- email: Email address if found
- phone: Phone number if found
- linkedin_url: LinkedIn profile URL if found
- career_mentions: Any mentions about their career, experience, reviews, or sentiment (2-3 sentences)
- career_health_score: INTEGER from 1-10 based on career stability:
  * 1-3 = RED (Career instability - job hunting, negative reviews, frequent job changes)
  * 4-7 = YELLOW (Moderate stability - some movement signals, mixed reviews)
  * 8-10 = GREEN (Stable career - established, positive reviews, loyal clients)
- source_links: URLs where this trainer was found

Focus on finding trainers who might be looking for new opportunities or flexible arrangements.
Only extract real individual trainers, not gyms or training companies.`;

    const userPrompt = `Extract up to 10 personal trainers from these search results:\n\n${searchContent}`;

    console.log("Calling Lovable AI for trainer extraction...");

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
              name: "extract_trainers",
              description: "Extract personal trainer information from search results",
              parameters: {
                type: "object",
                properties: {
                  trainers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        linkedin_url: { type: "string" },
                        career_mentions: { type: "string" },
                        career_health_score: { 
                          type: "integer", 
                          minimum: 1, 
                          maximum: 10,
                          description: "1-3=unstable, 4-7=moderate, 8-10=stable" 
                        },
                        source_links: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "career_health_score"],
                    },
                  },
                },
                required: ["trainers"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_trainers" } },
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
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    let extractedTrainers: StructuredTrainer[] = [];
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        extractedTrainers = parsed.trainers || [];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedTrainers.length} trainers`);

    if (extractedTrainers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, trainers: [], message: "No trainers found in search results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert trainers into database
    const createdTrainers: string[] = [];
    for (const trainer of extractedTrainers) {
      try {
        // Check for duplicate by name in same account
        const { data: existingTrainer } = await supabaseAdmin
          .from("trainers")
          .select("id")
          .eq("account_id", accountId)
          .eq("name", trainer.name)
          .maybeSingle();

        if (existingTrainer) {
          console.log(`Skipping duplicate trainer: ${trainer.name}`);
          continue;
        }

        // Use account coordinates with slight randomization for trainer location
        let trainerLat = account.lat;
        let trainerLng = account.lng;
        
        if (trainerLat && trainerLng) {
          // Add small random offset (within ~5 miles) for visual distinction
          trainerLat += (Math.random() - 0.5) * 0.1;
          trainerLng += (Math.random() - 0.5) * 0.1;
        }

        const { data: newTrainer, error: trainerError } = await supabaseAdmin
          .from("trainers")
          .insert({
            workspace_id: account.workspace_id,
            account_id: accountId,
            name: trainer.name,
            email: trainer.email || null,
            phone: trainer.phone || null,
            linkedin_url: trainer.linkedin_url || null,
            career_mentions: trainer.career_mentions || null,
            career_health_score: trainer.career_health_score,
            source_links: trainer.source_links || [],
            lat: trainerLat,
            lng: trainerLng,
          })
          .select("id")
          .single();

        if (trainerError) {
          console.error("Error inserting trainer:", trainerError);
          continue;
        }

        createdTrainers.push(newTrainer.id);
        console.log(`Created trainer: ${trainer.name}`);
      } catch (error) {
        console.error("Error processing trainer:", error);
      }
    }

    console.log(`Successfully created ${createdTrainers.length} trainers`);

    return new Response(
      JSON.stringify({
        success: true,
        trainers: createdTrainers,
        message: `Found ${createdTrainers.length} trainers near ${account.name}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trainer miner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
