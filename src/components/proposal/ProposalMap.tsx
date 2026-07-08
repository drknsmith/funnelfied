import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { MultifamilyComp, FitnessComp } from '@/hooks/useProposalComps';
import { escapeHtml } from '@/lib/escapeHtml';

interface ProposalMapProps {
  mapCenter?: { lat: number; lng: number };
  communityName: string;
  multifamilyComps: MultifamilyComp[];
  fitnessComps: FitnessComp[];
}

export function ProposalMap({
  mapCenter,
  communityName,
  multifamilyComps,
  fitnessComps
}: ProposalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      try {
        // Get Mapbox token from edge function
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fnError || !data?.token) {
          throw new Error('Failed to get Mapbox token');
        }

        mapboxgl.accessToken = data.token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: mapCenter ? [mapCenter.lng, mapCenter.lat] : [-98.5795, 39.8283],
          zoom: mapCenter ? 12 : 4
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          setIsLoading(false);
        });

        mapRef.current = map;
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      mapRef.current?.remove();
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add community center marker (gold star)
    if (mapCenter) {
      const el = document.createElement('div');
      el.className = 'proposal-marker-community';
      el.innerHTML = '⭐';
      el.style.fontSize = '24px';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2">
          <h3 class="font-bold">${escapeHtml(communityName || 'Community')}</h3>
          <p class="text-sm text-gray-600">Subject Property</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([mapCenter.lng, mapCenter.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    // Add multifamily comp markers (red squares)
    multifamilyComps.forEach(comp => {
      if (!comp.lat || !comp.lng) return;

      const el = document.createElement('div');
      el.className = 'proposal-marker-multifamily';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = '#ef4444';
      el.style.borderRadius = '2px';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2">
          <h3 class="font-bold">${escapeHtml(comp.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(comp.address)}</p>
          <p class="text-sm">${comp.distance.toFixed(1)} miles away</p>
          <p class="text-sm text-gray-500">${escapeHtml(comp.inferredClass)}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([comp.lng, comp.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add fitness comp markers (blue circles)
    fitnessComps.forEach(comp => {
      if (!comp.lat || !comp.lng) return;

      const el = document.createElement('div');
      el.className = 'proposal-marker-fitness';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = '#3b82f6';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div class="p-2">
          <h3 class="font-bold">${escapeHtml(comp.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(comp.address)}</p>
          <p class="text-sm">${comp.distance.toFixed(1)} miles away</p>
          <p class="text-sm text-gray-500">${escapeHtml(comp.type)}</p>
          <p class="text-xs mt-1">${escapeHtml(comp.focusTags.join(', '))}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([comp.lng, comp.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (mapCenter && (multifamilyComps.length > 0 || fitnessComps.length > 0)) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([mapCenter.lng, mapCenter.lat]);
      
      multifamilyComps.forEach(comp => {
        if (comp.lat && comp.lng) bounds.extend([comp.lng, comp.lat]);
      });
      fitnessComps.forEach(comp => {
        if (comp.lat && comp.lng) bounds.extend([comp.lng, comp.lat]);
      });

      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else if (mapCenter) {
      map.flyTo({ center: [mapCenter.lng, mapCenter.lat], zoom: 12 });
    }
  }, [mapCenter, communityName, multifamilyComps, fitnessComps]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          Market Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span>Subject Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm border-2 border-white shadow"></div>
            <span>Multifamily ({multifamilyComps.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            <span>Fitness Facilities ({fitnessComps.length})</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative rounded-lg overflow-hidden border" style={{ height: '400px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
              {error}
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
