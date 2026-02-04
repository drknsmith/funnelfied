

# Fix: Improve Multifamily Search Accuracy with Stricter Filtering

## Problem Identified

The current implementation has two issues:

1. **Proximity doesn't filter, only ranks**: Mapbox's `proximity` parameter suggests a preference but doesn't enforce a strict radius. Results from other counties can still appear if they're strong text matches.

2. **Generic search terms return wrong results**: Searching for "apartments" returns property management offices, apartment locators, and leasing companies rather than actual apartment communities.

3. **Only 10 results per query (API limit)**: With Mapbox returning mixed-quality results, we're not getting enough actual communities.

---

## Solution

### 1. Use More Specific Search Queries

Replace generic terms with queries that target actual communities:

| Current Query | Improved Queries |
|---------------|------------------|
| `apartments` | `apartment community`, `apartment homes` |
| `apartment complex` | `luxury apartments`, `lofts` |
| `multifamily housing` | `senior living apartments`, `affordable housing` |

### 2. Add Location Context to Queries

Include the city/area from the geocoded address in the search query to force locality:

```typescript
// Extract city from address for query context
const city = extractCityFromAddress(address);

// Build location-aware queries
const queries = [
  `apartment community near ${city}`,
  `apartments ${city}`,
  `luxury apartments ${city}`
];
```

### 3. Stricter Distance Filtering Post-Search

Apply strict distance filtering **before** processing (currently done after):

```typescript
// Immediately filter results by distance
const withinRadius = results.filter(r => {
  const [lng, lat] = r.geometry.coordinates;
  const dist = calculateDistance(center.lat, center.lng, lat, lng);
  return dist <= radiusMiles;
});
```

### 4. Filter Out Non-Community Results

Add a filter to exclude leasing offices, property management, and apartment locators:

```typescript
const excludePatterns = [
  /locator/i,
  /management/i,
  /leasing office/i,
  /real estate/i,
  /realty/i,
  /property group/i,
  /housing authority/i
];

const isActualCommunity = (name: string) => 
  !excludePatterns.some(pattern => pattern.test(name));
```

### 5. Log Results with Distance for Debugging

Add detailed logging to see what's being returned and filtered:

```typescript
console.log(`Result: "${name}" at ${distance.toFixed(2)} mi - ${included ? 'INCLUDED' : 'EXCLUDED'}`);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/proposal-comps/index.ts` | Update search queries, add name filtering, add distance logging |

---

## Updated Search Approach

```typescript
// More specific apartment community queries
const multifamilyQueries = [
  'apartment community',
  'apartment homes', 
  'luxury apartments',
  'lofts apartments',
  'senior living apartments'
];

// Filter function for actual communities
function isValidCommunity(name: string): boolean {
  const excludePatterns = [
    /locator/i, /management/i, /leasing/i, /real estate/i,
    /realty/i, /property group/i, /housing authority/i,
    /apartment finder/i, /rent\./i, /realtor/i
  ];
  return !excludePatterns.some(p => p.test(name));
}
```

---

## Expected Results

| Metric | Current | After Fix |
|--------|---------|-----------|
| Communities from other counties | Common | Filtered out |
| Property management offices | Included | Excluded |
| Actual communities found | ~3-4 | More (up to 15) |
| Distance accuracy | Approximate | Strict radius enforcement |

---

## Implementation

1. Update `multifamilyQueries` with more specific terms
2. Add `isValidCommunity()` filter function
3. Apply strict distance filtering immediately after API response
4. Add detailed logging for debugging
5. Deploy and test with the same address

