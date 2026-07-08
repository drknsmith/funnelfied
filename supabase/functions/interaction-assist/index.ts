import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DealContext {
  deal_name: string;
  account_name: string;
  stage: string;
  playbook_name?: string;
}

interface RequestBody {
  raw_text: string;
  deal_context: DealContext;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireUser(req, corsHeaders);
    if ("response" in authResult) return authResult.response;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { raw_text, deal_context }: RequestBody = await req.json();

    if (!raw_text || raw_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "raw_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a sales assistant helping to analyze and structure interaction notes for a CRM system.

Context about the deal:
- Deal: ${deal_context.deal_name || "Unknown"}
- Account: ${deal_context.account_name || "Unknown"}
- Stage: ${deal_context.stage || "Unknown"}
${deal_context.playbook_name ? `- Playbook: ${deal_context.playbook_name}` : ""}

Your task is to analyze the raw interaction notes (which could be meeting notes, email content, call summary, etc.) and extract structured information.

Guidelines:
- Summary: Write a concise 2-3 sentence summary of what happened in the interaction
- Objections: Extract any concerns, pushback, or objections raised by the prospect
- Commitments: Extract any agreements, promises, or commitments made by either party
- Next Action: Suggest the most important follow-up action based on the conversation
- Next Action Date: Suggest a reasonable date for the next action (format: YYYY-MM-DD). Consider urgency signals in the text. Default to 3-5 business days out if no timing mentioned.
- Key Points: Extract 3-5 bullet points of important information mentioned

If any field doesn't apply or can't be extracted, return null for that field.`;

    console.log("Calling Lovable AI for interaction analysis...");

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
          { role: "user", content: `Please analyze these interaction notes and extract structured information:\n\n${raw_text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_interaction_data",
              description: "Extract structured data from interaction notes",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Concise 2-3 sentence summary of the interaction",
                  },
                  objections: {
                    type: "string",
                    description: "Key concerns or objections raised, or null if none",
                  },
                  commitments: {
                    type: "string",
                    description: "Agreements or commitments made, or null if none",
                  },
                  next_action: {
                    type: "string",
                    description: "Recommended follow-up action",
                  },
                  next_action_date: {
                    type: "string",
                    description: "Suggested date for next action in YYYY-MM-DD format",
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key points from the interaction",
                  },
                },
                required: ["summary", "next_action", "next_action_date"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_interaction_data" } },
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
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received:", JSON.stringify(aiResponse).slice(0, 500));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_interaction_data") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted data:", extractedData);

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in interaction-assist:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
