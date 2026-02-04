
# Fix SPA Routing, Add Save Button, and Improve Comp Results (No New API Key Required)

## Overview

This plan addresses three issues using **only your existing Mapbox token** - no new API keys needed:

1. **404 errors on published site** - Add SPA routing configuration
2. **Save button on standalone Research** - Only show when a deal is selected
3. **Poor comp results** - Switch from Firecrawl to Mapbox Search Box API for verified POI data

---

## Part 1: Fix Published Site 404 Errors

### Problem
Direct navigation to `/research` on the published site returns a 404 because the hosting server doesn't handle client-side routes.

### Solution
Create a `_redirects` file in the `public` folder.

| File | Action |
|------|--------|
| `public/_redirects` | Create |

**Content:**
```text
/*    /index.html   200
```

---

## Part 2: Add "Save to Deal" Button

### Current Behavior
- Standalone Research page has "Print PDF" and "Share Research" buttons
- No way to explicitly save and link research to a deal

### New Behavior
- Add a **"Save to Deal"** button that only appears when a deal is selected from the dropdown
- When clicked, saves the research and links it to the selected deal
- Shows success toast with option to navigate to the deal

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Research.tsx` | Add "Save to Deal" button conditionally rendered when `selectedDealId` is set |

### UI Changes
```text
Header buttons (no deal selected):
[Print PDF] [Share Research]

Header buttons (deal selected):
[Save to Deal] [Print PDF] [Share Research]
```

The "Save to Deal" button will:
1. Call `saveReport()` with the `dealId`
2. Show success toast: "Research saved to deal"
3. Offer toast action to navigate to the deal page

---

## Part 3: Improve Comp Results with Mapbox Search Box API

### Current Problems
The Firecrawl-based approach has issues:
- Pulls duplicate locations
- Returns unreliable addresses ("Address not available")
- Uses web search results instead of verified business data
- Falls back to mock data with fake addresses
- No deduplication logic

### Solution: Use Mapbox Search Box API (Already Have the Token!)

Replace Firecrawl with **Mapbox Search Box API**, which:
- Uses your existing `MAPBOX_PUBLIC_TOKEN`
- Provides verified POI (Point of Interest) data
- Returns precise coordinates and real addresses
- Supports category filtering for apartments and fitness centers

### Changes to Edge Function

**File:** `supabase/functions/proposal-comps/index.ts`

**Key Improvements:**

1. **Use Mapbox Search Box API**
   - Search for "apartment" POIs within radius
   - Search for "gym" / "fitness" POIs within radius

2. **Add Deduplication Logic**
   - Normalize names (lowercase, remove common suffixes)
   - Check coordinate proximity (within 50m = same location)
   - Track seen place IDs

3. **Remove Mock Data Fallback**
   - Only return real, verified data
   - Empty results are honest and don't confuse users

4. **Proper Distance Filtering**
   - Use haversine distance calculation
   - Strict radius enforcement

### New Edge Function Flow

```text
1. Geocode input address (Mapbox Geocoding v5)
2. Search Mapbox Search Box for apartments
   - Category: "apartment", "residential"
   - Filter by radius
   - Deduplicate by name + coordinates
3. Search Mapbox Search Box for fitness
   - Category: "gym", "fitness"
   - Filter by radius
   - Deduplicate by name + coordinates
4. Enrich results with:
   - Distance calculation
   - Property class inference (from name/properties)
   - Amenity signals
   - Facility type classification
5. Return sorted, deduplicated results
```

### Mapbox Search Box API Request

```typescript
// Example for apartments
const response = await fetch(
  `https://api.mapbox.com/search/searchbox/v1/category/${category}?` +
  `access_token=${mapboxToken}` +
  `&proximity=${lng},${lat}` +
  `&limit=25`
);

// Categories to use:
// Apartments: "apartment", "residential_area" 
// Fitness: "gym", "fitness_center", "sports_center"
```

### Deduplication Strategy

```typescript
function deduplicateResults(results) {
  const seen = new Map(); // key: normalized name
  const seenCoords = []; // [{lat, lng}]
  
  return results.filter(place => {
    const normName = normalizeName(place.name);
    
    // Check if we've seen this name
    if (seen.has(normName)) return false;
    
    // Check if coordinates are within 50m of an existing result
    const tooClose = seenCoords.some(coord => 
      haversineDistance(coord, place) < 0.031 // ~50 meters
    );
    if (tooClose) return false;
    
    seen.set(normName, true);
    seenCoords.push({lat: place.lat, lng: place.lng});
    return true;
  });
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/apartments?|community|residences?|at\s+|the\s+/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `public/_redirects` | Create | SPA routing for published site |
| `src/pages/Research.tsx` | Modify | Add conditional "Save to Deal" button |
| `supabase/functions/proposal-comps/index.ts` | Rewrite | Replace Firecrawl with Mapbox Search Box API, add deduplication |

---

## Before/After Comparison

| Aspect | Before (Firecrawl) | After (Mapbox Search Box) |
|--------|-------------------|---------------------------|
| API Key | Firecrawl key | Existing Mapbox token |
| Data Source | Web search results | Verified POI database |
| Addresses | Often missing | Real, formatted addresses |
| Duplicates | Common | Eliminated via deduplication |
| Coordinates | Unreliable/missing | Precise lat/lng |
| Mock Data | Falls back to fake data | Only real results |
| Cost | Firecrawl credits | Included with Mapbox |

---

## Implementation Order

1. Create `public/_redirects` (fixes 404 on publish)
2. Add "Save to Deal" button to Research.tsx
3. Rewrite proposal-comps edge function to use Mapbox Search Box
4. Test end-to-end with real addresses
