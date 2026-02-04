const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MultifamilyComp {
  name: string;
  address: string;
  distance: number;
  inferredClass: string;
  classConfidence: string;
  amenitySignals: string[];
  lat?: number;
  lng?: number;
}

interface FitnessComp {
  name: string;
  address: string;
  distance: number;
  type: string;
  focusTags: string[];
  complementGuidance: string[];
  lat?: number;
  lng?: number;
}

interface MapboxFeature {
  properties: {
    name: string;
    full_address?: string;
    address?: string;
    place_formatted?: string;
    category?: string;
    maki?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

// Geocode address using Mapbox Geocoding API
async function geocodeAddress(address: string, mapboxToken: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&limit=1`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Haversine distance calculation in miles
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Normalize name for deduplication
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/apartments?|community|residences?|at\s+|the\s+|&|and/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Check if two coordinates are within proximity (in miles)
function isWithinProximity(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }, thresholdMiles: number = 0.031): boolean {
  return calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng) < thresholdMiles;
}

// Search Mapbox for POIs using category search
async function searchMapboxCategory(
  query: string,
  center: { lat: number; lng: number },
  radiusMiles: number,
  mapboxToken: string,
  limit: number = 25
): Promise<MapboxFeature[]> {
  try {
    // Use Mapbox Search Box API (v1) for POI search
    const bbox = getBoundingBox(center.lat, center.lng, radiusMiles);
    const encoded = encodeURIComponent(query);
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?` +
      `access_token=${mapboxToken}` +
      `&proximity=${center.lng},${center.lat}` +
      `&bbox=${bbox.join(',')}` +
      `&types=poi` +
      `&limit=${limit}`
    );

    if (!response.ok) {
      console.error('Mapbox search failed:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    
    if (!data.features) {
      return [];
    }

    // Transform to our format
    return data.features.map((f: { properties?: { category?: string }; text?: string; place_name?: string; center?: [number, number] }) => ({
      properties: {
        name: f.text || 'Unknown',
        full_address: f.place_name || '',
        category: f.properties?.category || ''
      },
      geometry: {
        coordinates: f.center || [0, 0]
      }
    }));
  } catch (error) {
    console.error('Mapbox search error:', error);
    return [];
  }
}

// Get bounding box for radius search
function getBoundingBox(lat: number, lng: number, radiusMiles: number): [number, number, number, number] {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));
  
  return [
    lng - lngDelta, // min lng (west)
    lat - latDelta, // min lat (south)
    lng + lngDelta, // max lng (east)
    lat + latDelta  // max lat (north)
  ];
}

// Deduplicate results by name and proximity
function deduplicateResults<T extends { name: string; lat?: number; lng?: number }>(results: T[]): T[] {
  const seen = new Map<string, boolean>();
  const seenCoords: { lat: number; lng: number }[] = [];
  
  return results.filter(place => {
    const normName = normalizeName(place.name);
    
    // Skip if we've seen a very similar name
    if (seen.has(normName)) {
      console.log(`Dedup: Skipping "${place.name}" - name match`);
      return false;
    }
    
    // Skip if coordinates are too close to an existing result
    if (place.lat && place.lng) {
      const tooClose = seenCoords.some(coord => 
        isWithinProximity(coord, { lat: place.lat!, lng: place.lng! })
      );
      if (tooClose) {
        console.log(`Dedup: Skipping "${place.name}" - coordinate proximity`);
        return false;
      }
      seenCoords.push({ lat: place.lat, lng: place.lng });
    }
    
    seen.set(normName, true);
    return true;
  });
}

// Infer property class from name
function inferPropertyClass(name: string): { inferredClass: string; classConfidence: string } {
  const text = name.toLowerCase();
  
  if (text.includes('luxury') || text.includes('upscale') || text.includes('premium') || 
      text.includes('grand') || text.includes('plaza') || text.includes('tower')) {
    return { inferredClass: 'Likely Class A', classConfidence: 'high' };
  }
  if (text.includes('affordable') || text.includes('budget') || text.includes('garden') ||
      text.includes('village') || text.includes('court')) {
    return { inferredClass: 'Likely Class C', classConfidence: 'medium' };
  }
  return { inferredClass: 'Likely Class B', classConfidence: 'medium' };
}

// Extract amenity signals from name
function extractAmenitySignals(name: string, category?: string): string[] {
  const signals: string[] = [];
  const text = `${name} ${category || ''}`.toLowerCase();
  
  if (text.includes('fitness') || text.includes('gym')) signals.push('Fitness Center');
  if (text.includes('pool') || text.includes('aqua')) signals.push('Pool');
  if (text.includes('club')) signals.push('Clubhouse');
  if (text.includes('pet') || text.includes('dog')) signals.push('Pet Friendly');
  if (text.includes('garage') || text.includes('parking')) signals.push('Covered Parking');
  if (text.includes('spa') || text.includes('wellness')) signals.push('Spa/Wellness');
  if (text.includes('loft') || text.includes('studio')) signals.push('Modern Units');
  
  return signals.length > 0 ? signals : ['Standard Amenities'];
}

// Infer fitness facility type
function inferFacilityType(name: string): string {
  const text = name.toLowerCase();
  
  if (text.includes('planet fitness') || text.includes('la fitness') || 
      text.includes('anytime fitness') || text.includes('24 hour fitness') ||
      text.includes('gold') || text.includes('world gym')) {
    return 'Big Box Gym';
  }
  if (text.includes('crossfit')) return 'CrossFit Box';
  if (text.includes('yoga') || text.includes('pilates') || text.includes('barre')) return 'Boutique Studio';
  if (text.includes('orangetheory') || text.includes('orange theory') || 
      text.includes('f45') || text.includes('barry')) return 'Boutique Fitness';
  if (text.includes('equinox') || text.includes('lifetime') || text.includes('life time')) return 'Premium Club';
  if (text.includes('ymca') || text.includes('rec') || text.includes('community')) return 'Community Center';
  if (text.includes('martial') || text.includes('boxing') || text.includes('mma')) return 'Combat Sports';
  if (text.includes('spin') || text.includes('cycle') || text.includes('soul')) return 'Cycling Studio';
  
  return 'Fitness Facility';
}

// Extract focus tags
function extractFocusTags(name: string, facilityType: string): string[] {
  const tags: string[] = [];
  const text = name.toLowerCase();
  
  if (facilityType === 'Big Box Gym') {
    tags.push('cardio-heavy', 'strength-focused');
  }
  if (text.includes('crossfit') || text.includes('functional')) tags.push('functional');
  if (text.includes('yoga')) tags.push('flexibility', 'mind-body');
  if (text.includes('pilates')) tags.push('core-strength', 'low-impact');
  if (text.includes('spin') || text.includes('cycle')) tags.push('cardio', 'endurance');
  if (text.includes('boxing') || text.includes('mma')) tags.push('combat', 'conditioning');
  if (facilityType === 'Boutique Fitness') tags.push('HIIT', 'group-classes');
  if (facilityType === 'Community Center') tags.push('family-friendly', 'pool');
  
  return tags.length > 0 ? tags : ['general-fitness'];
}

// Generate complement guidance
function generateComplementGuidance(facilityType: string): string[] {
  const guidance: string[] = [];
  
  switch (facilityType) {
    case 'Big Box Gym':
      guidance.push('Focus on convenience and premium equipment to differentiate');
      guidance.push('Emphasize 24/7 access without additional membership fees');
      break;
    case 'CrossFit Box':
      guidance.push('Offer functional training alternatives with lower intensity options');
      guidance.push('Target residents who want HIIT without the box commitment');
      break;
    case 'Boutique Studio':
      guidance.push('Provide broader equipment variety than specialized studios');
      guidance.push('Offer complementary recovery options');
      break;
    case 'Boutique Fitness':
      guidance.push('Position as unlimited access vs per-class pricing');
      break;
    case 'Premium Club':
      guidance.push('Match amenity quality with competitive membership convenience');
      guidance.push('Highlight no additional cost for residents');
      break;
    case 'Community Center':
      guidance.push('Emphasize modern equipment and extended hours');
      break;
    default:
      guidance.push('Highlight 24/7 accessibility and resident-exclusive benefits');
  }
  
  return guidance;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, radiusMiles } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');

    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching comps for address: ${address}, radius: ${radiusMiles} miles`);

    // Geocode the subject address
    const mapCenter = await geocodeAddress(address, mapboxToken);
    if (!mapCenter) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not geocode the address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Geocoded to: ${mapCenter.lat}, ${mapCenter.lng}`);

    // Search for multifamily communities using multiple queries
    const multifamilyQueries = ['apartments', 'apartment complex', 'multifamily'];
    const allMultifamilyResults: MapboxFeature[] = [];
    
    for (const query of multifamilyQueries) {
      const results = await searchMapboxCategory(query, mapCenter, radiusMiles, mapboxToken, 20);
      allMultifamilyResults.push(...results);
      console.log(`Multifamily query "${query}": ${results.length} results`);
    }

    // Search for fitness facilities using multiple queries
    const fitnessQueries = ['gym', 'fitness center', 'fitness'];
    const allFitnessResults: MapboxFeature[] = [];
    
    for (const query of fitnessQueries) {
      const results = await searchMapboxCategory(query, mapCenter, radiusMiles, mapboxToken, 20);
      allFitnessResults.push(...results);
      console.log(`Fitness query "${query}": ${results.length} results`);
    }

    // Process multifamily results
    const multifamilyComps: MultifamilyComp[] = [];
    for (const feature of allMultifamilyResults) {
      const [lng, lat] = feature.geometry.coordinates;
      const distance = calculateDistance(mapCenter.lat, mapCenter.lng, lat, lng);
      
      // Filter by radius
      if (distance > radiusMiles) continue;
      
      const { inferredClass, classConfidence } = inferPropertyClass(feature.properties.name);
      
      multifamilyComps.push({
        name: feature.properties.name,
        address: feature.properties.full_address || feature.properties.place_formatted || 'Address available on map',
        distance: Math.round(distance * 10) / 10,
        inferredClass,
        classConfidence,
        amenitySignals: extractAmenitySignals(feature.properties.name, feature.properties.category),
        lat,
        lng
      });
    }

    // Process fitness results
    const fitnessComps: FitnessComp[] = [];
    for (const feature of allFitnessResults) {
      const [lng, lat] = feature.geometry.coordinates;
      const distance = calculateDistance(mapCenter.lat, mapCenter.lng, lat, lng);
      
      // Filter by radius
      if (distance > radiusMiles) continue;
      
      const facilityType = inferFacilityType(feature.properties.name);
      
      fitnessComps.push({
        name: feature.properties.name,
        address: feature.properties.full_address || feature.properties.place_formatted || 'Address available on map',
        distance: Math.round(distance * 10) / 10,
        type: facilityType,
        focusTags: extractFocusTags(feature.properties.name, facilityType),
        complementGuidance: generateComplementGuidance(facilityType),
        lat,
        lng
      });
    }

    // Deduplicate results
    const dedupedMultifamily = deduplicateResults(multifamilyComps);
    const dedupedFitness = deduplicateResults(fitnessComps);

    console.log(`Multifamily: ${multifamilyComps.length} raw -> ${dedupedMultifamily.length} deduped`);
    console.log(`Fitness: ${fitnessComps.length} raw -> ${dedupedFitness.length} deduped`);

    // Sort by distance
    dedupedMultifamily.sort((a, b) => a.distance - b.distance);
    dedupedFitness.sort((a, b) => a.distance - b.distance);

    return new Response(
      JSON.stringify({
        success: true,
        mapCenter,
        multifamilyComps: dedupedMultifamily.slice(0, 15),
        fitnessComps: dedupedFitness.slice(0, 15)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching comps:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch competitive analysis' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
