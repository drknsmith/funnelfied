import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, MapPin, Building2, User, RefreshCw } from 'lucide-react';
import { useLeadsForMap, useAccountsForMap, useTrainersForMap } from '@/hooks/useMapData';
import { getHealthHexColor } from '@/components/ui/HealthScoreDot';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

type ViewMode = 'facility' | 'trainer';

function MappingContent() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('facility');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeadsForMap();
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useAccountsForMap();
  const { data: trainers, isLoading: trainersLoading, refetch: refetchTrainers } = useTrainersForMap();

  // Fetch Mapbox token from edge function
  useEffect(() => {
    async function fetchToken() {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      } finally {
        setIsLoadingToken(false);
      }
    }
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Add markers based on view mode
  useEffect(() => {
    if (!map.current) return;

    clearMarkers();

    if (viewMode === 'facility') {
      // Add leads as markers
      leads?.forEach(lead => {
        if (lead.lat && lead.lng) {
          const color = lead.health_score ? getHealthHexColor(lead.health_score) : '#6b7280';
          
          const el = document.createElement('div');
          el.className = 'map-marker';
          el.style.cssText = `
            width: 20px;
            height: 20px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${lead.company}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${lead.project_name}</p>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${lead.location}</p>
              ${lead.health_score ? `<p style="font-size: 12px;"><strong>Health Score:</strong> ${lead.health_score}/10</p>` : ''}
              <button 
                onclick="window.location.href='/leads/${lead.id}'"
                style="margin-top: 8px; padding: 4px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                View Lead
              </button>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lead.lng, lead.lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });

      // Add accounts as markers (slightly different style)
      accounts?.forEach(account => {
        if (account.lat && account.lng) {
          const color = account.health_score ? getHealthHexColor(account.health_score) : '#6b7280';
          
          const el = document.createElement('div');
          el.className = 'map-marker account';
          el.style.cssText = `
            width: 24px;
            height: 24px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${account.name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${account.segment || 'No segment'}</p>
              ${account.health_score ? `<p style="font-size: 12px;"><strong>Health Score:</strong> ${account.health_score}/10</p>` : ''}
              <button 
                onclick="window.location.href='/accounts/${account.id}'"
                style="margin-top: 8px; padding: 4px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                View Account
              </button>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([account.lng, account.lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });
    } else {
      // Trainer view
      trainers?.forEach(trainer => {
        if (trainer.lat && trainer.lng) {
          const color = trainer.career_health_score ? getHealthHexColor(trainer.career_health_score) : '#6b7280';
          
          const el = document.createElement('div');
          el.className = 'map-marker trainer';
          el.style.cssText = `
            width: 18px;
            height: 18px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${trainer.name}</h3>
              ${trainer.career_health_score ? `<p style="font-size: 12px;"><strong>Career Score:</strong> ${trainer.career_health_score}/10</p>` : ''}
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([trainer.lng, trainer.lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });
    }
  }, [viewMode, leads, accounts, trainers, clearMarkers]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current || !mapboxToken) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=us&types=place,region`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current.flyTo({
          center: [lng, lat],
          zoom: 10,
          essential: true,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = () => {
    refetchLeads();
    refetchAccounts();
    refetchTrainers();
  };

  const isLoading = leadsLoading || accountsLoading || trainersLoading || isLoadingToken;

  const facilityCount = (leads?.length || 0) + (accounts?.length || 0);
  const trainerCount = trainers?.length || 0;

  if (isLoadingToken) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mapbox Not Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please configure your Mapbox token to use the mapping feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mapping</h1>
            <p className="text-sm text-muted-foreground">
              Visualize leads, accounts, and trainers on the map
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search city or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="facility" className="gap-2">
                <Building2 className="h-4 w-4" />
                Facility ({facilityCount})
              </TabsTrigger>
              <TabsTrigger value="trainer" className="gap-2">
                <User className="h-4 w-4" />
                Trainer ({trainerCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">High Pain (1-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Moderate (4-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Healthy (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-500" />
            <span className="text-muted-foreground">Not Scored</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Mapping() {
  return (
    <AppLayout>
      <MappingContent />
    </AppLayout>
  );
}
