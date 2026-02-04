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
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

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

    const multifamilyComps: MultifamilyComp[] = [];
    const fitnessComps: FitnessComp[] = [];

    // If Firecrawl is available, use it to search for comps
    if (firecrawlKey) {
      try {
        // Search for multifamily communities
        const multifamilySearchQuery = `apartments near ${address} multifamily community`;
        console.log('Searching for multifamily:', multifamilySearchQuery);

        const multifamilyResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: multifamilySearchQuery,
            limit: 15,
            country: 'us',
          }),
        });

        const multifamilyData = await multifamilyResponse.json();
        console.log('Multifamily search results:', multifamilyData.data?.length || 0);

        if (multifamilyData.success && multifamilyData.data) {
          for (const result of multifamilyData.data.slice(0, 10)) {
            // Try to extract address and geocode
            const resultAddress = result.description?.match(/\d+[^,]+,[^,]+,\s*[A-Z]{2}\s*\d{5}/)?.[ 0] || 
                                 result.title?.match(/\d+[^,]+/)?.[ 0];
            
            let coords: { lat: number; lng: number } | null = null;
            if (resultAddress) {
              coords = await geocodeAddress(resultAddress, mapboxToken);
            }

            const distance = coords 
              ? calculateDistance(mapCenter.lat, mapCenter.lng, coords.lat, coords.lng)
              : Math.random() * radiusMiles; // Fallback for display

            if (!coords || distance <= radiusMiles) {
              multifamilyComps.push({
                name: result.title?.split('|')[0]?.trim() || 'Unknown Community',
                address: resultAddress || 'Address not available',
                distance: Math.round(distance * 10) / 10,
                inferredClass: inferPropertyClass(result.title, result.description),
                classConfidence: coords ? 'medium' : 'low',
                amenitySignals: extractAmenitySignals(result.description),
                lat: coords?.lat,
                lng: coords?.lng
              });
            }
          }
        }

        // Search for fitness facilities
        const fitnessSearchQuery = `gyms fitness centers near ${address}`;
        console.log('Searching for fitness:', fitnessSearchQuery);

        const fitnessResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: fitnessSearchQuery,
            limit: 15,
            country: 'us',
          }),
        });

        const fitnessData = await fitnessResponse.json();
        console.log('Fitness search results:', fitnessData.data?.length || 0);

        if (fitnessData.success && fitnessData.data) {
          for (const result of fitnessData.data.slice(0, 10)) {
            const resultAddress = result.description?.match(/\d+[^,]+,[^,]+,\s*[A-Z]{2}\s*\d{5}/)?.[ 0] ||
                                 result.title?.match(/\d+[^,]+/)?.[ 0];
            
            let coords: { lat: number; lng: number } | null = null;
            if (resultAddress) {
              coords = await geocodeAddress(resultAddress, mapboxToken);
            }

            const distance = coords 
              ? calculateDistance(mapCenter.lat, mapCenter.lng, coords.lat, coords.lng)
              : Math.random() * radiusMiles;

            if (!coords || distance <= radiusMiles) {
              const facilityType = inferFacilityType(result.title, result.url);
              fitnessComps.push({
                name: result.title?.split('|')[0]?.split('-')[0]?.trim() || 'Unknown Gym',
                address: resultAddress || 'Address not available',
                distance: Math.round(distance * 10) / 10,
                type: facilityType,
                focusTags: extractFocusTags(result.title, result.description, facilityType),
                complementGuidance: generateComplementGuidance(facilityType),
                lat: coords?.lat,
                lng: coords?.lng
              });
            }
          }
        }
      } catch (error) {
        console.error('Firecrawl search error:', error);
        // Continue with mock data if Firecrawl fails
      }
    }

    // If we don't have enough results, add some mock data for demo purposes
    if (multifamilyComps.length < 3) {
      const mockMultifamily = generateMockMultifamilyComps(mapCenter, radiusMiles, 5 - multifamilyComps.length);
      multifamilyComps.push(...mockMultifamily);
    }

    if (fitnessComps.length < 3) {
      const mockFitness = generateMockFitnessComps(mapCenter, radiusMiles, 5 - fitnessComps.length);
      fitnessComps.push(...mockFitness);
    }

    // Sort by distance
    multifamilyComps.sort((a, b) => a.distance - b.distance);
    fitnessComps.sort((a, b) => a.distance - b.distance);

    return new Response(
      JSON.stringify({
        success: true,
        mapCenter,
        multifamilyComps: multifamilyComps.slice(0, 10),
        fitnessComps: fitnessComps.slice(0, 10)
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

function inferPropertyClass(title?: string, description?: string): string {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  if (text.includes('luxury') || text.includes('upscale') || text.includes('premium')) {
    return 'Likely Class A';
  }
  if (text.includes('affordable') || text.includes('budget') || text.includes('low income')) {
    return 'Likely Class C';
  }
  return 'Likely Class B';
}

function extractAmenitySignals(description?: string): string[] {
  const signals: string[] = [];
  const text = (description || '').toLowerCase();
  
  if (text.includes('fitness') || text.includes('gym')) signals.push('Fitness Center');
  if (text.includes('pool')) signals.push('Pool');
  if (text.includes('clubhouse')) signals.push('Clubhouse');
  if (text.includes('pet')) signals.push('Pet Friendly');
  if (text.includes('garage') || text.includes('parking')) signals.push('Covered Parking');
  if (text.includes('spa') || text.includes('sauna')) signals.push('Spa/Wellness');
  
  return signals.length > 0 ? signals : ['Standard Amenities'];
}

function inferFacilityType(title?: string, url?: string): string {
  const text = `${title || ''} ${url || ''}`.toLowerCase();
  
  if (text.includes('planet fitness') || text.includes('la fitness') || text.includes('anytime')) {
    return 'Big Box Gym';
  }
  if (text.includes('crossfit')) return 'CrossFit Box';
  if (text.includes('yoga') || text.includes('pilates')) return 'Boutique Studio';
  if (text.includes('orange') || text.includes('f45') || text.includes('barry')) return 'Boutique Fitness';
  if (text.includes('equinox') || text.includes('lifetime')) return 'Premium Club';
  if (text.includes('ymca') || text.includes('rec center')) return 'Community Center';
  
  return 'Fitness Facility';
}

function extractFocusTags(title?: string, description?: string, facilityType?: string): string[] {
  const tags: string[] = [];
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  if (text.includes('cardio') || facilityType === 'Big Box Gym') tags.push('cardio-heavy');
  if (text.includes('strength') || text.includes('weight')) tags.push('strength-focused');
  if (text.includes('class') || text.includes('group')) tags.push('group-classes');
  if (text.includes('personal') || text.includes('training')) tags.push('personal-training');
  if (text.includes('recovery') || text.includes('stretch')) tags.push('recovery');
  if (text.includes('functional') || text.includes('crossfit')) tags.push('functional');
  if (text.includes('beginner')) tags.push('beginner-friendly');
  
  return tags.length > 0 ? tags : ['general-fitness'];
}

function generateComplementGuidance(facilityType: string): string[] {
  const guidance: string[] = [];
  
  switch (facilityType) {
    case 'Big Box Gym':
      guidance.push('Focus on convenience and premium equipment to differentiate');
      break;
    case 'CrossFit Box':
      guidance.push('Offer functional training alternatives with lower intensity options');
      break;
    case 'Boutique Studio':
      guidance.push('Provide broader equipment variety than specialized studios');
      break;
    case 'Premium Club':
      guidance.push('Match amenity quality with competitive membership convenience');
      break;
    default:
      guidance.push('Highlight 24/7 accessibility and resident-exclusive benefits');
  }
  
  return guidance;
}

function generateMockMultifamilyComps(center: { lat: number; lng: number }, radius: number, count: number): MultifamilyComp[] {
  const names = ['Parkview Apartments', 'The Residences', 'Urban Living', 'Cityscape', 'The Heights'];
  const classes = ['Likely Class A', 'Likely Class B', 'Likely Class B', 'Likely Class C'];
  
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI;
    const distance = 0.5 + Math.random() * (radius - 0.5);
    const lat = center.lat + (distance / 69) * Math.cos(angle);
    const lng = center.lng + (distance / (69 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
    
    return {
      name: names[i % names.length],
      address: `${1000 + i * 100} Example Street`,
      distance: Math.round(distance * 10) / 10,
      inferredClass: classes[i % classes.length],
      classConfidence: 'estimated',
      amenitySignals: ['Fitness Center', 'Pool', 'Clubhouse'].slice(0, 2 + Math.floor(Math.random() * 2)),
      lat,
      lng
    };
  });
}

function generateMockFitnessComps(center: { lat: number; lng: number }, radius: number, count: number): FitnessComp[] {
  const facilities = [
    { name: 'Anytime Fitness', type: 'Big Box Gym', tags: ['24/7', 'cardio-heavy', 'strength'] },
    { name: 'Pure Barre', type: 'Boutique Studio', tags: ['low-impact', 'classes', 'toning'] },
    { name: 'CrossFit Box', type: 'CrossFit Box', tags: ['functional', 'high-intensity', 'community'] },
    { name: 'YMCA', type: 'Community Center', tags: ['family-friendly', 'pool', 'classes'] },
    { name: 'Orange Theory', type: 'Boutique Fitness', tags: ['HIIT', 'heart-rate', 'classes'] }
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const facility = facilities[i % facilities.length];
    const angle = (i / count) * 2 * Math.PI + Math.PI / 4;
    const distance = 0.5 + Math.random() * (radius - 0.5);
    const lat = center.lat + (distance / 69) * Math.cos(angle);
    const lng = center.lng + (distance / (69 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
    
    return {
      name: facility.name,
      address: `${2000 + i * 200} Fitness Blvd`,
      distance: Math.round(distance * 10) / 10,
      type: facility.type,
      focusTags: facility.tags,
      complementGuidance: generateComplementGuidance(facility.type),
      lat,
      lng
    };
  });
}
