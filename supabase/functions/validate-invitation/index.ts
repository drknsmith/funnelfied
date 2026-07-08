import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invite_code, email } = await req.json();
    if (!invite_code || !email) {
      return new Response(
        JSON.stringify({ error: "invite_code and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const normalizedCode = String(invite_code).toUpperCase().trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    const { data, error } = await supabase
      .from("pending_invitations")
      .select("id, workspace_id, email, role, expires_at, used_at")
      .eq("invite_code", normalizedCode)
      .eq("email", normalizedEmail)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("validate-invitation query error:", error);
      return new Response(
        JSON.stringify({ error: "Error validating invite code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ invitation: data ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("validate-invitation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});