
# Proposal Creator for Superior Sales Pipeline

## Overview
Create a "Proposal Creator" page exclusive to the Superior Sales Pipeline workspace that generates presentation-ready fitness center recommendations with budget calculations, equipment focus, and competitive analysis using AI-powered comps retrieval.

---

## Implementation Scope

### What This Feature Does
1. Input panel for community details (name, address, units, property class, demographics)
2. Five output sections: Budget, Square Footage, Equipment Focus, Multifamily Comps, Fitness Facility Comps
3. Interactive Mapbox map with community (star), multifamily (red), and fitness (blue) markers
4. Print to PDF (outputs + map only, excludes input form)
5. Shareable tokenized public links for email-ready reports

---

## Technical Implementation

### 1. Workspace Feature Flag

Add Superior workspace constants to `src/lib/workspaceFeatures.ts`:

```typescript
export const SUPERIOR_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export function isSuperiorWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === SUPERIOR_WORKSPACE_ID;
}

export function canUseProposalCreator(workspaceId?: string | null): boolean {
  return isSuperiorWorkspace(workspaceId);
}
```

### 2. Navigation Menu Update

Modify `src/components/layout/AppLayout.tsx` to add "Proposal Creator" nav item:
- Import `FileBarChart` icon from lucide-react
- Add conditional nav item after Assets for Superior workspace users

### 3. Algorithm Module

Create `src/lib/superiorProposalAlgorithm.ts` with the provided algorithm code:
- Square footage calculation function
- Budget calculation with demographic adjustments
- Equipment focus scoring with demographic weights
- All constants (DEFAULTS, demographicData, EQUIPMENT_TYPES)

### 4. Database Tables

Create two new tables via migration:

```text
proposal_reports
+--------------------+------------------+-----------+
| Column             | Type             | Notes     |
+--------------------+------------------+-----------+
| id                 | uuid             | PK        |
| workspace_id       | uuid             | FK        |
| owner_user_id      | uuid             | FK        |
| token              | text             | Unique    |
| community_name     | text             |           |
| community_address  | text             |           |
| units              | integer          | nullable  |
| sf_override        | integer          | nullable  |
| property_class     | text             | A/B/C     |
| demographics       | jsonb            |           |
| comps_radius       | integer          |           |
| advanced_overrides | jsonb            |           |
| outputs            | jsonb            | Computed  |
| multifamily_comps  | jsonb            |           |
| fitness_comps      | jsonb            |           |
| map_center         | jsonb            |           |
| expires_at         | timestamptz      | nullable  |
| created_at         | timestamptz      |           |
+--------------------+------------------+-----------+
```

RLS policies:
- SELECT: owner or super_admin
- INSERT: authenticated users in Superior workspace
- UPDATE: owner only
- Public SELECT via token (for shareable links)

### 5. Edge Function: `proposal-comps`

Create `supabase/functions/proposal-comps/index.ts`:

**Purpose**: Fetch multifamily and fitness facility comps using Firecrawl + AI extraction

**Flow**:
1. Receive address + radius from frontend
2. Geocode address using Mapbox
3. Use Firecrawl to search for:
   - Multifamily communities within radius
   - Gyms/fitness facilities within radius
4. Use Lovable AI to extract structured data:
   - Name, address, distance, inferred class
   - Amenity/fitness signals
   - Focus tags and market gap analysis
5. Geocode each comp for map plotting
6. Return structured comps with coordinates

### 6. Frontend Components

#### `src/pages/ProposalCreator.tsx`
Main page component with:
- Input panel (top section)
- Print button
- Output sections (conditionally rendered)
- Interactive map (bottom)
- Share button

#### `src/components/proposal/ProposalInputPanel.tsx`
Form inputs:
- Community Name (text)
- Community Address (text, required)
- Units (number)
- Property Class (A/B/C select)
- Demographics (multi-select checkboxes)
- SF Override (number, optional)
- Comps Radius (slider 1-20 miles)
- Advanced section (collapsed): adults per unit, residents %, peak %, etc.

#### `src/components/proposal/ProposalOutputs.tsx`
Five sections with conditional rendering:
- Section 1: Budget (needs units/SF + class)
- Section 2: Square Footage (needs units or SF override)
- Section 3: Equipment Focus (always shows, better with demographics)
- Section 4: Multifamily Comps (needs address + radius)
- Section 5: Fitness Comps (needs address + radius)

#### `src/components/proposal/ProposalMap.tsx`
Mapbox map component:
- Community address as star marker (gold)
- Multifamily comps as red square markers
- Fitness comps as blue circle markers
- Click tooltips with details
- Legend component

#### `src/pages/SuperiorReport.tsx`
Public shareable report page at `/superior/reports/:token`:
- No authentication required
- Displays outputs + map from saved report
- Shows expiration notice if applicable
- Mobile-responsive layout

### 7. Print/PDF Implementation

Use `react-to-print` library approach:
- Create a hidden printable component containing outputs + static map
- For map snapshot: use Mapbox Static Images API to generate a static map image
- CSS print styles to exclude input panel
- Clean page breaks between sections

### 8. Shareable Link Implementation

**Generate Report Flow**:
1. User clicks "Generate Shareable Link"
2. Frontend calls save endpoint with all computed data
3. Backend generates crypto-random token
4. Saves report to `proposal_reports` table
5. Returns public URL: `/superior/reports/{token}`
6. User can copy link to share via email

**Expiration Options**:
- 7 days (default)
- 14 days
- 30 days
- Never

### 9. Routing

Add to `src/App.tsx`:
```typescript
<Route path="/proposal-creator" element={<ProtectedRoute><ProposalCreator /></ProtectedRoute>} />
<Route path="/superior/reports/:token" element={<SuperiorReport />} />
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/superiorProposalAlgorithm.ts` | Core calculation logic |
| `src/pages/ProposalCreator.tsx` | Main page component |
| `src/pages/SuperiorReport.tsx` | Public shareable report view |
| `src/components/proposal/ProposalInputPanel.tsx` | Input form |
| `src/components/proposal/ProposalOutputs.tsx` | Output sections |
| `src/components/proposal/ProposalMap.tsx` | Interactive map |
| `src/components/proposal/ProposalPrintView.tsx` | Print-optimized layout |
| `src/hooks/useProposalComps.ts` | Hook for comps fetching |
| `src/hooks/useProposalReport.ts` | Hook for saving/loading reports |
| `supabase/functions/proposal-comps/index.ts` | Comps retrieval edge function |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/workspaceFeatures.ts` | Add Superior workspace ID and helper functions |
| `src/components/layout/AppLayout.tsx` | Add "Proposal Creator" nav item for Superior |
| `src/App.tsx` | Add routes for proposal creator and public reports |

---

## Dependencies

Install `react-to-print` for PDF/print functionality:
- Already have Mapbox GL JS for map rendering
- Will use Mapbox Static Images API for print-friendly map snapshots

---

## Conditional Update Logic

```text
Input Change -> Recompute affected sections only

Dependencies:
- Section 1 (Budget): needs (Units OR SF Override) + Property Class
- Section 2 (SF): needs Units (unless SF Override provided)
- Section 3 (Equipment): demographics optional, uses defaults if none
- Section 4 (Multifamily): needs Address + Radius
- Section 5 (Fitness): needs Address + Radius + Address geocoded
```

---

## Security Considerations

1. Proposal Creator page protected by workspace check
2. RLS policies restrict report access to owners
3. Public reports use unguessable tokens (crypto-random)
4. Optional expiration for shared links
5. No sensitive data exposed in public view

---

## User Experience Flow

1. User navigates to Proposal Creator from sidebar
2. Enters community details in input panel
3. Sections auto-populate as requirements are met
4. Comps fetch when address + radius provided
5. Map updates with all markers
6. Click "Print" for PDF output (outputs + map only)
7. Click "Share" to generate tokenized link
8. Copy link to email to stakeholders
