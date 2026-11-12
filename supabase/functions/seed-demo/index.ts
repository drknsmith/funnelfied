// One-off: creates the Demo workspace, a reviewer login, and fictional sample data.
// Only callable by a super_admin. Safe to re-run (skips if the workspace exists).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const WS = "00000000-0000-0000-0000-00000000d3a0";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = await requireUser(req, cors);
  if ("response" in auth) return auth.response;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: r } = await db.from("user_roles").select("role").eq("user_id", auth.user.userId).eq("role", "super_admin").maybeSingle();
  if (!r) return json({ error: "Forbidden" }, 403);
  const { email, password } = await req.json();
  const must = async (p: PromiseLike<{ error: unknown; data?: any }>) => { const x = await p; if (x.error) throw new Error(JSON.stringify(x.error)); return x.data; };
  try {
    const { data: existing } = await db.from("workspaces").select("id").eq("id", WS).maybeSingle();
    if (existing) return json({ ok: true, note: "already seeded" });
    await must(db.from("workspaces").insert({ id: WS, name: "Funnelfied Demo" }));
    const u = await must(db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Demo Reviewer" } }));
    const uid = u.user.id;
    await must(db.from("profiles").insert({ user_id: uid, workspace_id: WS, full_name: "Demo Reviewer", email, is_active: true }));
    await must(db.from("user_roles").insert({ user_id: uid, role: "admin" }));

    const accts = await must(db.from("accounts").insert([
      { workspace_id: WS, owner_user_id: uid, name: "Apex Living Communities", segment: "Multifamily", portfolio_size: "10-25", deal_type_default: "Design", status: "Active", location: "Austin, TX", phone: "(512) 555-0142", email: "info@apexliving.example" },
      { workspace_id: WS, owner_user_id: uid, name: "Vanguard Senior Residences", segment: "Senior Living", portfolio_size: "5-10", deal_type_default: "Programming", status: "Active", location: "Denver, CO", phone: "(303) 555-0187", email: "hello@vanguardsr.example" },
      { workspace_id: WS, owner_user_id: uid, name: "Harborview Housing Authority", segment: "Affordable Housing", portfolio_size: "25+", deal_type_default: "Policy", status: "Prospect", location: "Portland, OR", phone: "(503) 555-0110", email: "contact@harborview.example" },
      { workspace_id: WS, owner_user_id: uid, name: "Summit Corporate Campus", segment: "Corporate Wellness", portfolio_size: "1-4", deal_type_default: "Design", status: "Active", location: "Raleigh, NC", phone: "(919) 555-0163", email: "facilities@summitcc.example" },
    ]).select("id,name"));
    const A = Object.fromEntries(accts.map((a: any) => [a.name, a.id]));
    const cons = await must(db.from("contacts").insert([
      { workspace_id: WS, owner_user_id: uid, account_id: A["Apex Living Communities"], name: "Jordan Ellis", title: "VP of Asset Management", email: "jordan.ellis@apexliving.example", phone: "(512) 555-0198", role_type: "Decision Maker", referred_by: "Industry conference" },
      { workspace_id: WS, owner_user_id: uid, account_id: A["Vanguard Senior Residences"], name: "Priya Raman", title: "Director of Resident Experience", email: "priya.raman@vanguardsr.example", phone: "(303) 555-0121", role_type: "Champion" },
      { workspace_id: WS, owner_user_id: uid, account_id: A["Harborview Housing Authority"], name: "Marcus Bell", title: "Housing Programs Manager", email: "marcus.bell@harborview.example", phone: "(503) 555-0175", role_type: "Influencer" },
      { workspace_id: WS, owner_user_id: uid, account_id: A["Summit Corporate Campus"], name: "Elena Torres", title: "Head of Workplace Services", email: "elena.torres@summitcc.example", phone: "(919) 555-0139", role_type: "Decision Maker" },
    ]).select("id,account_id,name,email,phone"));
    const C = Object.fromEntries(cons.map((c: any) => [c.account_id, c]));
    const today = new Date(); const d = (n: number) => new Date(today.getTime() + n * 864e5).toISOString().slice(0, 10);
    const mk = (acct: string, name: string, types: string[], stage: string, street: string, city: string, state: string, zip: string, size: string, next: string, n: number) => ({
      workspace_id: WS, owner_user_id: uid, account_id: A[acct], primary_contact_id: C[A[acct]].id, deal_name: name, deal_type: types, stage, status: stage === "Closed" ? "Won" : "Active",
      deal_size_range: size, probability: { "Signal/Target": 10, Contacted: 20, Discovery: 40, SOW: 60, "Under Contract": 85, Closed: 100 }[stage], next_action: next, next_action_date: d(n),
      last_meaningful_activity_date: d(-n), project_street: street, project_city: city, project_state: state, project_zip: zip });
    const deals = await must(db.from("deals").insert([
      mk("Apex Living Communities", "Apex - The Meridian Fitness Center Redesign", ["Design", "Programming"], "SOW", "1200 Congress Ave", "Austin", "TX", "78701", "$50k-$100k", "Review SOW with VP", 3),
      mk("Apex Living Communities", "Apex - Lakeline Amenity Refresh", ["Design"], "Discovery", "11200 Lakeline Blvd", "Austin", "TX", "78717", "$25k-$50k", "Site walkthrough", 6),
      mk("Vanguard Senior Residences", "Vanguard - Active Aging Program", ["Programming"], "Under Contract", "1600 Glenarm Pl", "Denver", "CO", "80202", "$25k-$50k", "Kickoff meeting", 2),
      mk("Harborview Housing Authority", "Harborview - Smoke-Free & Fitness Policy", ["Policy"], "Contacted", "421 SW Oak St", "Portland", "OR", "97204", "$10k-$25k", "Send capabilities deck", 4),
      mk("Summit Corporate Campus", "Summit - Employee Wellness Center", ["Design", "Policy"], "Signal/Target", "4000 Centregreen Way", "Raleigh", "NC", "27606", "$100k+", "Intro call", 8),
      mk("Vanguard Senior Residences", "Vanguard - Staff Training Rollout", ["Programming", "Policy"], "Closed", "1600 Glenarm Pl", "Denver", "CO", "80202", "$10k-$25k", "Request testimonial", 10),
    ]).select("id,deal_name,account_id,primary_contact_id"));
    await must(db.from("interactions").insert(deals.slice(0, 4).map((dl: any, i: number) => ({
      workspace_id: WS, deal_id: dl.id, contact_id: dl.primary_contact_id, created_by_user_id: uid, type: ["meeting", "call", "email", "demo"][i],
      occurred_at: new Date(today.getTime() - (i + 2) * 864e5).toISOString(),
      summary: ["Discovery meeting: resident survey shows low gym usage; client wants a modern layout and group classes.", "Call to confirm program scope for 3 communities and staff training schedule.", "Sent intro email with policy case studies.", "Walked through sample SOW and timeline."][i],
      next_action: "Follow up", next_action_date: d(i + 2) }))));
    const meridian = deals[0]; const c0 = C[meridian.account_id];
    await must(db.from("quotes").insert({
      workspace_id: WS, owner_user_id: uid, deal_id: meridian.id, contact_id: c0.id, version_number: 1, status: "draft",
      service_category: ["Design", "Programming"], engagement_type: "Phased", timeline_urgency: "Within 3 months", decision_maker_count: 3,
      service_details: { design_type: "Retrofit", square_footage: "2400", unit_count: "310", programming_gaps: "No group classes; equipment outdated" },
      hourly_rate: 200, phase_consultation_hours: 6, phase_concept_hours: 20, phase_revisions_hours: 8, phase_revisions_rounds: 2, phase_sourcing_hours: 12, phase_pm_hours: 16, phase_handoff_hours: 4, phase_program_creation_hours: 14,
      snapshot_contact_name: c0.name, snapshot_contact_email: c0.email, snapshot_contact_phone: c0.phone, snapshot_project_name: meridian.deal_name, snapshot_project_address: "1200 Congress Ave, Austin, TX 78701",
      redloft_contact_name: "Demo Reviewer", redloft_contact_title: "Consultant", redloft_contact_email: email,
      sow_executive_summary: "Redesign The Meridian's 2,400 sq ft fitness center and launch a resident group-class program to lift usage and retention.",
      sow_problem_statement: "Resident surveys show under 15% monthly gym usage, outdated equipment, and no structured programming.",
      sow_proposed_approach: "A phased engagement: space planning and equipment sourcing, followed by a resident programming calendar and staff onboarding.",
      sow_approach_pillars: ["Process", "Product", "People"],
      sow_work_items: [{ name: "Interior Design", description: "Layout and finishes plan" }, { name: "Fitness Equipment", description: "Specification and sourcing" }, { name: "Program Creation", description: "12-week class calendar" }],
      sow_deliverables: [{ name: "Space Plan", description: "Scaled floor plan" }, { name: "Equipment Spec Sheet", description: "Itemized list" }, { name: "Program Guide", description: "Class schedule and SOPs" }],
      sow_milestones: [{ name: "Kickoff", description: "Stakeholder alignment", target_date: d(7) }, { name: "Concept Review", description: "Present layout", target_date: d(30) }, { name: "Handoff", description: "Walkthrough", target_date: d(75) }],
      sow_estimated_hours_min: 70, sow_estimated_hours_max: 95, sow_invoicing_cadence: "Monthly", sow_invoice_terms: "Net 30", sow_expense_threshold: 250,
      invoice_expenses: [{ name: "Site visit travel", amount: 380 }], invoice_date: d(0),
    }));
    return json({ ok: true, workspace_id: WS });
  } catch (e) { return json({ error: String(e) }, 500); }
});
