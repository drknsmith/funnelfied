Funnelfied
Next-Generation Vertical B2B CRM, Market Intelligence & Automated SOW Engine
Built for boutique advisory firms, specialized consultancies, and multi-disciplinary development agencies.
[!TypeScript](https://www.typescriptlang.org/)
[!React](https://react.dev/)
[!Vite](https://vitejs.dev/)
[!Tailwind CSS](https://tailwindcss.com/)
[!Supabase](https://supabase.com/)
[!Mapbox GL](https://www.mapbox.com/)
[!PWA Ready](https://web.dev/progressive-web-apps/)

Executive Summary
Funnelfied is an enterprise-grade CRM and workflow operating system tailored to consulting, architectural programming, and facility launch agencies. Traditional CRMs manage pipeline stages but disconnect sales tracking from market feasibility analysis, scoping calculations, and legal document generation.
Funnelfied eliminates this fragmentation by combining:
Intelligent Lead & Signal Discovery: Proactive distress scoring, talent signals, and account enrichment.
Geospatial Demographics & Competitor Research: Real-time Mapbox radius clustering, competitive analysis, and automated sizing/budget estimation models.
Firm Knowledge Playbooks & Single-Trigger SOW Engine: A dynamic authoring pipeline that cross-references firm consulting doctrine, scope items, hours caps, and contractual terms to produce client-ready Statements of Work and Invoices with zero calculation leakage.
Hardened Multi-Tenant Architecture: Database-level isolation enforced via PostgreSQL Row-Level Security (RLS) policies, security-definer function guards, and audited invitation loops.

Architecture Overview
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (SPA / PWA)                        │
│   React 18 + TypeScript + Vite + Tailwind CSS + Radix UI (shadcn)      │
│   TanStack Query (Cache/Sync) + Mapbox GL JS + Dynamic Print/PDF       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS / JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│                        EDGE COMPUTE / API LAYER                        │
│                  Supabase Edge Functions (Deno / TS)                   │
│                                                                        │
│  ├─ generate-sow         ├─ process-deliverables ├─ scribe-chat        │
│  ├─ suggest-milestones   ├─ process-hours        ├─ crm-bridge         │
│  ├─ proposal-comps       ├─ process-work         ├─ validate-invitation│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     DATABASE & STORAGE LAYER (Supabase)                │
│                                                                        │
│  ├─ Multi-Tenant PostgreSQL Tables (Workspaces, Deals, Quotes, Comps)  │
│  ├─ Row-Level Security (RLS) & Workspace Scoping Functions             │
│  ├─ Private Object Storage (Bucket path isolation per tenant)          │
│  └─ LLM Orchestration via AI Gateway (Structured Prompts & Schemas)    │
└────────────────────────────────────────────────────────────────────────┘

Key Features & Functional Modules
1. Opportunity Pipeline & Multi-Disciplinary Tracking
Configurable 6-Stage Pipeline: Signal/Target ➔ Contacted ➔ Discovery ➔ SOW ➔ Under Contract ➔ Closed.
Multi-Service Categorization: Supports complex multi-service projects (e.g., Programming + Architecture + Policy) with stacked field requirements per discipline rather than single-choice drop-downs.
Interactive Deal Command Center: Tracks deal health, stakeholders, associated assets, key dates, and cross-linked account contacts.
2. Statement of Work (SOW) & Invoicing Engine
Single-Trigger AI Scoping: Consumes the entire form state (opportunity type, engagement type, design specifics, hourly billing, deliverables) plus workspace-level playbook knowledge to synthesize an executive-ready proposal in one pass.
Granular AI Accelerators:
Process Scope of Services with AI: Dissects unstructured notes into concrete work phases.
Process Deliverables with AI: Generates standardized, measurable deliverables.
Process Estimated Hours with AI: Reasons over complexity to calculate realistic min/max hourly windows without exposing unauthorized total formulas.
Suggest Milestones with AI: Builds realistic chronological delivery schedules.
Strict Scope-and-Rate Separation: Enforces corporate compliance by strictly segregating SOW deliverables and hourly rates from billing invoices, preventing premature fixed-total liability.
Dynamic Legal Integration: Ingests firm Terms & Conditions, injects dynamic merge variables ({{hourly_rate}}, {{cadence}}, {{terms}}), and positions signature blocks immediately following acceptance clauses.
Export Formats: Generates clean, printer-optimized PDFs and client-facing Markdown packages.
3. Location Research & Market Feasibility Engine
Geocoding & Proximity Deduplication: Evaluates target sites against competitor clusters via Mapbox POI search within custom radius thresholds.
Heuristic Sizing & Budgeting: Automated formulas that compute Recommended Fitness Center Square Footage and Recommended Equipment Budgets based on unit density, property category, and resident demographics.
Appendix Attachment: Allows one-click sharing of demographic studies directly into SOW appendices complete with high-resolution, color-coded static satellite/street maps.
4. Service Knowledge Playbooks (Firm IP Repository)
Centralized Knowledge Base: Repository for firm methodologies, engagement types (One-Time, Retainer, Phased), and sector guidelines (Programming, Design, Policy).
Context Injection: Serves as the ground-truth context injected into edge compute pipelines to eliminate AI hallucination and align proposals with firm standards.
5. Multi-Tenant Administration & Enterprise Security
Workspace Isolation: Every database operation is strictly scoped to the active workspace using session-authenticated claims and PostgreSQL RLS.
Tamper-Proof Super Admin Overrides: Verified via server-side security triggers and database functions to prevent tenant-hopping.
Audited Token Invitations: 8-character invitation codes with cryptographic validation, automatic role provisioning, and time-bounded expiration.
Private Storage Isolation: File assets and deal attachments are locked behind path-evaluated workspace checks with short-lived signed URLs.

Technology Stack
Layer
Technologies
Frontend Framework
React 18, TypeScript, Vite
Styling & Design System
Tailwind CSS v3, Radix UI Primitives (shadcn/ui), Class Variance Authority
State & Cache Management
TanStack Query v5 (React Query), Context API
Geospatial & Mapping
Mapbox GL JS v3, Mapbox Geocoding & Static Image APIs
Data Visualization
Recharts, Lucide Icons
Forms & Validation
React Hook Form, Zod
Backend & Database
Supabase (PostgreSQL 15), PL/pgSQL Triggers & Functions
Serverless Compute
Deno-based Supabase Edge Functions
AI / LLM Integration
Google Gemini / Lovable AI Gateway (structured JSON completions)
PWA & Offline
vite-plugin-pwa, Cache-First Asset Routing, Web App Manifest
Delivery & Tooling
Git, Lovable (rapid engineering & continuous staging), Supabase CLI

Database Design & Security Principles
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   workspaces    │◄──────┤    profiles     │◄──────┤   user_roles    │
└────────┬────────┘       └────────┬────────┘       └─────────────────┘
         │                         │
         ├─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      deals      │       │     quotes      │       │proposal_reports │
│(Pipeline/Stages)│       │  (SOW/Invoice)  │       │(Market Research)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
Defense-in-Depth RLS: Tables possess granular SELECT, INSERT, UPDATE, and DELETE policies querying current_workspace() session identity.
Zero Client Trust: Calculations for hours, milestone suggestions, and invitation validations run in isolated serverless functions rather than vulnerable browser runtimes.
No Unchecked Cascades: Deletions require verification of entity dependencies to maintain historical financial and audit consistency.

Local Development & Setup
Prerequisites
Node.js (v18.0 or higher)
npm or bun
Supabase CLI (optional for local edge function emulation)
1. Clone & Install
git clone https://github.com/drknsmith/funnelfied.git
cd funnelfied
npm install
2. Environment Variables
Create a .env file in the project root:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAPBOX_PUBLIC_TOKEN=your-mapbox-token
Security note: never commit your .env file — keep it in .gitignore. The Supabase publishable (anon) key is public by design and safe to expose in the browser; Row-Level Security policies govern data access. Private keys — the service_role key, database password, private API keys — must never be committed; if one ever is, rotate it before making the repository public.
3. Run Development Server
npm run dev
The application will launch at http://localhost:8080.
4. Build for Production
npm run build
Type checks the application via tsc and bundles optimized production assets via Vite.

Engineering Highlights & Problem-Solving
Strict Tone & Formatting Engine: Built a single-pass edge pipeline (generate-sow) that ingests complex multi-nested forms, detects non-standard proposal combinations (e.g., Retainer + Construction without pipeline justification), and warns the operator instead of hallucinating terms.
Spatial Clustering & Deduplication: Designed a 50-meter radius spatial deduplication algorithm to prevent centroid stacking and false duplicate counting when ingesting local competitive comps.
Dual-View Financial Segregation: Resolved a critical enterprise compliance issue by re-engineering the proposal system into two dedicated states: a scope-only legal SOW (no pricing totals) and a separate line-item Invoice with contractor markups and expense tracking.

Author & Project Background
Built & Engineered by: Dr. Karl Smith
Platform Status: Live Production Application
Primary Domain: funnelfied.com
Engineered with modern full-stack web standards, combining rapid iteration via Lovable with custom Supabase PostgreSQL architectures, serverless edge functions, and clean React/TypeScript design patterns.
