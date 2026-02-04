
# Fix SPA Routing, Add Save Button, and Improve Comp Results

## Overview

This plan addresses three issues:
1. **404 errors on published site** - Add SPA routing configuration
2. **Save button on standalone Research** - Only show when a deal is attached
3. **Poor comp results** - Replace Firecrawl with Google Places API for reliable, deduplicated data

---

## Part 1: Fix Published Site 404 Errors

### Problem
Direct navigation to `/research` (or any route) on the published site returns a 404 error because the hosting server doesn't know how to handle client-side routes.

### Solution
Create a `_redirects` file in the `public` folder:

| File | Action |
|------|--------|
| `public/_redirects` | Create |

**Content:**
```text
/*    /index.html   200
```

This tells the server to serve `index.html` for all paths, letting React Router handle routing.

---

## Part 2: Save Button for Standalone Research

### Current Behavior
- Standalone Research page (`/research`) has "Print PDF" and "Share Research" buttons
- No explicit "Save" button that links research to a deal

### New Behavior
- Add a **"Save to Deal"** button that only appears when a deal is selected
- When clicked, it saves the research and links it to the selected deal
- After saving, show a success message and optionally navigate to the deal's Research tab

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Research.tsx` | Add "Save to Deal" button conditionally rendered when `selectedDealId` is set |

### UI Changes
```text
Header buttons (when no deal selected):
[Print PDF] [Share Research]

Header buttons (when deal selected):
[Print PDF] [Share Research] [Save to Deal]
```

The "Save to Deal" button will:
1. Call `saveReport()` with the `dealId`
2. Show success toast: "Research saved to deal"
3. Optionally offer to navigate to the deal page

---

## Part 3: Improve Comp Results with Google Places API

### Current Problems
The current Firecrawl-based approach has issues:
- Pulls duplicate locations (same place appearing multiple times)
- Returns unreliable/fake addresses ("Address not available")
- Uses generic web search results instead of actual business data
- Falls back to mock data that clutters real results
- No deduplication logic

### Solution: Switch to Google Places API

Replace Firecrawl web search with Google Places API (Text Search), which provides:
- Accurate, verified business locations
- Precise coordinates
- Business types and categories
- Real addresses

### API Requirements

A new secret will be needed:

| Secret | Purpose |
|--------|---------|
| `GOOGLE_PLACES_API_KEY` | Access to Google Places Text Search API |

### Changes to Edge Function

**File:** `supabase/functions/proposal-comps/index.ts`

**Key Improvements:**

1. **Use Google Places Text Search API**
   - Query: `"apartments multifamily" near {address}` for communities
   - Query: `"gym OR fitness center" near {address}` for fitness

2. **Add Deduplication Logic**
   - Normalize names (lowercase, remove common suffixes)
   - Track seen place IDs to prevent duplicates
   - Use coordinate proximity check (within 50m = same location)

3. **Remove Mock Data Fallback**
   - Only return real, verified data
   - Empty results are better than fake data

4. **Better Distance Filtering**
   - Use actual haversine distance calculation
   - Strict radius enforcement

### New Edge Function Flow

```text
1. Geocode input address (Mapbox)
2. Search Google Places for apartments/multifamily
   - Text Search: "apartments multifamily near {address}"
   - Filter by radius
   - Deduplicate by name + coordinates
3. Search Google Places for fitness facilities
   - Text Search: "gym fitness center near {address}"  
   - Filter by radius
   - Deduplicate by name + coordinates
4. Enrich results with:
   - Distance calculation
   - Property class inference (from name/types)
   - Amenity signals (from types)
   - Facility type classification
5. Return sorted, deduplicated results
```

### Google Places API Response Mapping

**Multifamily:**
```typescript
{
  name: place.displayName.text,
  address: place.formattedAddress,
  distance: calculateDistance(...),
  lat: place.location.latitude,
  lng: place.location.longitude,
  inferredClass: inferFromTypes(place.types),
  classConfidence: 'high',
  amenitySignals: extractFromTypes(place.types)
}
```

**Fitness:**
```typescript
{
  name: place.displayName.text,
  address: place.formattedAddress,
  distance: calculateDistance(...),
  lat: place.location.latitude,
  lng: place.location.longitude,
  type: classifyFacility(place.displayName.text, place.types),
  focusTags: extractFocusTags(place.types),
  complementGuidance: generateGuidance(type)
}
```

### Deduplication Strategy

```typescript
function deduplicateResults(results) {
  const seen = new Map(); // key: normalized name
  const seenCoords = []; // [{lat, lng}]
  
  return results.filter(place => {
    const normName = normalize(place.name);
    
    // Check name similarity
    if (seen.has(normName)) return false;
    
    // Check coordinate proximity (within 50m)
    const isDuplicate = seenCoords.some(coord => 
      haversineDistance(coord, place) < 0.05 // 50 meters
    );
    if (isDuplicate) return false;
    
    seen.set(normName, true);
    seenCoords.push({lat: place.lat, lng: place.lng});
    return true;
  });
}
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `public/_redirects` | Create | SPA routing for published site |
| `src/pages/Research.tsx` | Modify | Add conditional "Save to Deal" button |
| `supabase/functions/proposal-comps/index.ts` | Rewrite | Replace Firecrawl with Google Places API, add deduplication |

---

## Technical Details

### Google Places Text Search Request

```typescript
const response = await fetch(
  'https://places.googleapis.com/v1/places:searchText',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types'
    },
    body: JSON.stringify({
      textQuery: `apartments multifamily near ${address}`,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMiles * 1609.34 // meters
        }
      },
      maxResultCount: 20
    })
  }
);
```

### Name Normalization for Deduplication

```typescript
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/apartments?|community|residences?|at\s+|the\s+/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
```

---

## Before/After Comparison

| Aspect | Before (Firecrawl) | After (Google Places) |
|--------|-------------------|----------------------|
| Data Source | Web search results | Verified business database |
| Addresses | Often "Address not available" | Real, formatted addresses |
| Duplicates | Common | Eliminated via deduplication |
| Coordinates | Unreliable/missing | Precise lat/lng |
| Mock Data | Falls back to fake data | Only real results |
| Cost | Firecrawl credits | Google Places API credits |

---

## Implementation Order

1. Create `public/_redirects` (1 line)
2. Add "Save to Deal" button to Research.tsx
3. Request Google Places API key from user
4. Rewrite proposal-comps edge function
5. Test end-to-end with real addresses
