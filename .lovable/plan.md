
# Fix: Switch to Mapbox Search Box API for Comp Results

## Problem Identified

The `proposal-comps` edge function is returning 0 results because:
- **Mapbox removed POI data from the Geocoding v5 API** on December 20, 2024
- The current code uses `https://api.mapbox.com/geocoding/v5/mapbox.places/...?types=poi`
- This deprecated endpoint no longer returns points of interest like apartments and gyms

## Solution

Switch from the deprecated Geocoding v5 API to the **Mapbox Search Box API v1**, which has dedicated category search endpoints that still return POI data.

---

## API Changes

| Aspect | Current (Broken) | New (Working) |
|--------|------------------|---------------|
| Endpoint | `geocoding/v5/mapbox.places` | `search/searchbox/v1/category` |
| POI Support | Removed Dec 2024 | Active |
| Search Type | Text query with `types=poi` | Category-based canonical names |

---

## New API Endpoints

**Category Search:**
```text
https://api.mapbox.com/search/searchbox/v1/category/{category_id}
  ?access_token={token}
  &proximity={lng},{lat}
  &radius={meters}
  &limit=25
```

**Categories to use:**
- **Multifamily**: `apartment`, `residential`
- **Fitness**: `gym`, `fitness_center`, `health_club`

---

## File to Modify

| File | Changes |
|------|---------|
| `supabase/functions/proposal-comps/index.ts` | Update `searchMapboxCategory` function to use Search Box API v1 category endpoint |

---

## Implementation Details

### Updated Search Function

Replace the current `searchMapboxCategory` function to use the new endpoint:

```typescript
async function searchMapboxCategory(
  category: string,  // Now a category ID, not a search query
  center: { lat: number; lng: number },
  radiusMiles: number,
  mapboxToken: string,
  limit: number = 25
): Promise<MapboxFeature[]> {
  try {
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/category/${category}?` +
      `access_token=${mapboxToken}` +
      `&proximity=${center.lng},${center.lat}` +
      `&radius=${radiusMeters}` +
      `&limit=${limit}`
    );

    if (!response.ok) {
      console.error(`Category search "${category}" failed:`, response.status);
      return [];
    }

    const data = await response.json();
    
    // Transform Search Box response format
    return (data.results || []).map((r: any) => ({
      properties: {
        name: r.name || 'Unknown',
        full_address: r.full_address || r.address || '',
        category: r.poi_category || ''
      },
      geometry: {
        coordinates: [r.coordinates?.longitude || 0, r.coordinates?.latitude || 0]
      }
    }));
  } catch (error) {
    console.error(`Category search error for "${category}":`, error);
    return [];
  }
}
```

### Updated Query Categories

Replace text queries with Mapbox category IDs:

```typescript
// Before (broken)
const multifamilyQueries = ['apartments', 'apartment complex', 'multifamily'];
const fitnessQueries = ['gym', 'fitness center', 'fitness'];

// After (working)
const multifamilyCategories = ['apartment', 'residential'];
const fitnessCategories = ['gym', 'fitness_center', 'health_club'];
```

---

## Search Box API Response Format

The Search Box API returns a different structure than the Geocoding API:

```json
{
  "results": [
    {
      "name": "The Ponce City Market Flats",
      "full_address": "675 Ponce De Leon Ave NE, Atlanta, GA 30308",
      "coordinates": {
        "latitude": 33.7729,
        "longitude": -84.3634
      },
      "poi_category": "apartment"
    }
  ]
}
```

The code will transform this to match the existing `MapboxFeature` interface.

---

## Verification

After deployment:
1. Test with a real address in Atlanta
2. Confirm multifamily results include actual apartment complexes
3. Confirm fitness results include gyms and fitness centers
4. Verify coordinates are accurate on the map

---

## Summary

This is a single-file fix that:
1. Switches from deprecated Geocoding v5 POI endpoint to Search Box API v1
2. Uses category-based searches instead of text queries
3. Adapts to the new response format
4. Maintains all existing deduplication and enrichment logic
