import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, title, campaign } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating caption for:", { platform, title, campaignName: campaign?.name });

    // Build prompt from campaign rules
    let systemPrompt = `You are a social media expert generating captions for ${platform}.
Write engaging, platform-appropriate captions.
Keep captions concise and impactful.
Do not include hashtags unless specifically asked.
Just return the caption text, nothing else.`;

    if (campaign?.description_brief) {
      systemPrompt += `\n\nCampaign Description:\n${campaign.description_brief}`;
    }

    if (campaign?.do_dont_guidance) {
      systemPrompt += `\n\nDo's and Don'ts:\n${campaign.do_dont_guidance}`;
    }

    if (campaign?.default_cta_style) {
      systemPrompt += `\n\nDefault CTA Style: ${campaign.default_cta_style}`;
    }

    if (campaign?.keyword_tags?.length > 0) {
      systemPrompt += `\n\nKeywords to incorporate: ${campaign.keyword_tags.join(', ')}`;
    }

    const userPrompt = title
      ? `Generate a caption for: "${title}"`
      : `Generate a caption for this ${campaign?.name || ''} campaign post`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Usage limit reached");
        return new Response(
          JSON.stringify({ error: "Usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content || '';

    console.log("Generated caption successfully");

    return new Response(
      JSON.stringify({ caption }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Caption generator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
