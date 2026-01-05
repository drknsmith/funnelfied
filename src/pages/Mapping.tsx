import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Building2, User, RefreshCw, Crosshair, AlertCircle, MapPin } from 'lucide-react';
import { useAccountsForMap, useTrainersForMap, useLeadsForMap, MapLead } from '@/hooks/useMapData';
import { getHealthHexColor } from '@/components/ui/HealthScoreDot';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { canUseMapping, TRENEUR_WORKSPACE_ID } from '@/lib/workspaceFeatures';
import { toast } from 'sonner';

type ViewMode = 'lead' | 'facility' | 'trainer';

const STORAGE_KEY_PREFIX = 'mapping';

function getStorageKey(workspaceId: string, key: string): string {
  return `${STORAGE_KEY_PREFIX}:${key}:${workspaceId}`;
}

function MappingContent() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const hasAutoFitted = useRef(false);
  
  // Load persisted view mode from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (!activeWorkspaceId) return 'lead';
    const saved = localStorage.getItem(getStorageKey(activeWorkspaceId, 'viewMode'));
    if (saved === 'trainer') return 'trainer';
    if (saved === 'facility') return 'facility';
    return 'lead';
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeadsForMap();
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useAccountsForMap();
  const { data: trainers, isLoading: trainersLoading, refetch: refetchTrainers } = useTrainersForMap();

  // Redirect if not in Treneur workspace
  useEffect(() => {
    if (activeWorkspaceId && !canUseMapping(activeWorkspaceId)) {
      toast.error('Mapping is only available in the Treneur workspace.');
      navigate('/deals', { replace: true });
    }
  }, [activeWorkspaceId, navigate]);

  // Persist viewMode changes
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem(getStorageKey(activeWorkspaceId, 'viewMode'), viewMode);
    }
  }, [viewMode, activeWorkspaceId]);

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

  // Load saved viewport from localStorage
  const getSavedViewport = useCallback(() => {
    if (!activeWorkspaceId) return null;
    const saved = localStorage.getItem(getStorageKey(activeWorkspaceId, 'viewport'));
    if (saved) {
      try {
        return JSON.parse(saved) as { center: [number, number]; zoom: number };
      } catch {
        return null;
      }
    }
    return null;
  }, [activeWorkspaceId]);

  // Save viewport to localStorage
  const saveViewport = useCallback(() => {
    if (!map.current || !activeWorkspaceId) return;
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    const viewport = { center: [center.lng, center.lat] as [number, number], zoom };
    localStorage.setItem(getStorageKey(activeWorkspaceId, 'viewport'), JSON.stringify(viewport));
  }, [activeWorkspaceId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Use saved viewport or default to US center
    const savedViewport = getSavedViewport();
    const initialCenter = savedViewport?.center || [-98.5795, 39.8283];
    const initialZoom = savedViewport?.zoom || 3.5;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter as [number, number],
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Save viewport on move end
    map.current.on('moveend', saveViewport);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, getSavedViewport, saveViewport]);

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Fit map to markers
  const fitToMarkers = useCallback(() => {
    if (!map.current || markersRef.current.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    markersRef.current.forEach(marker => {
      bounds.extend(marker.getLngLat());
    });
    
    map.current.fitBounds(bounds, {
      padding: 80,
      maxZoom: 11,
      duration: 1000,
    });
  }, []);

  // Group items by coordinate key to handle stacking
  const groupByCoords = useCallback(<T extends { lat: number | null; lng: number | null }>(items: T[] | undefined): Map<string, T[]> => {
    const groups = new Map<string, T[]>();
    items?.forEach(item => {
      if (item.lat && item.lng) {
        const key = `${item.lat.toFixed(6)},${item.lng.toFixed(6)}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(item);
      }
    });
    return groups;
  }, []);

  // Check if there are stacked facilities
  const stackedFacilityCount = accounts ? (() => {
    const groups = groupByCoords(accounts);
    let stacked = 0;
    groups.forEach(group => {
      if (group.length > 1) stacked += group.length;
    });
    return stacked;
  })() : 0;

  // Add markers based on view mode
  useEffect(() => {
    if (!map.current) return;

    clearMarkers();

    if (viewMode === 'lead') {
      // Lead view - render lead markers (diamond shape)
      const leadGroups = groupByCoords(leads);
      
      leadGroups.forEach((group, key) => {
        const [lat, lng] = key.split(',').map(Number);
        
        if (group.length === 1) {
          const lead = group[0];
          const color = lead.health_score ? getHealthHexColor(lead.health_score) : '#6b7280';
          
          const el = document.createElement('div');
          el.className = 'map-marker lead';
          el.style.cssText = `
            width: 20px;
            height: 20px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 4px;
            transform: rotate(45deg);
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${lead.project_name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${lead.company}</p>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${lead.location}</p>
              ${lead.health_score ? `<p style="font-size: 12px;"><strong>Health Score:</strong> ${lead.health_score}/10</p>` : ''}
              ${lead.facility_type ? `<p style="font-size: 12px;"><strong>Type:</strong> ${lead.facility_type}</p>` : ''}
              <span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background: #e5e7eb; border-radius: 3px; font-size: 11px; text-transform: capitalize;">${lead.status}</span>
              <button 
                onclick="window.location.href='/leads/${lead.id}'"
                style="margin-top: 8px; display: block; padding: 4px 12px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                View Lead
              </button>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        } else {
          // Multiple leads cluster
          const el = document.createElement('div');
          el.className = 'map-marker lead-cluster';
          el.style.cssText = `
            width: 28px;
            height: 28px;
            background-color: #8b5cf6;
            border: 2px solid white;
            border-radius: 4px;
            transform: rotate(45deg);
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          
          const innerText = document.createElement('span');
          innerText.style.cssText = `
            transform: rotate(-45deg);
            font-weight: 700;
            font-size: 12px;
            color: white;
          `;
          innerText.textContent = String(group.length);
          el.appendChild(innerText);

          const leadsList = group.map(lead => `
            <div style="padding: 4px 0; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 2px; transform: rotate(45deg); background-color: ${lead.health_score ? getHealthHexColor(lead.health_score) : '#6b7280'};"></span>
                <strong style="font-size: 12px;">${lead.project_name}</strong>
              </div>
              <p style="font-size: 11px; color: #666; margin: 2px 0;">${lead.company}</p>
              <button 
                onclick="window.location.href='/leads/${lead.id}'"
                style="margin-top: 4px; padding: 2px 8px; background: #8b5cf6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;"
              >
                View
              </button>
            </div>
          `).join('');

          const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`
            <div style="padding: 8px; max-height: 250px; overflow-y: auto;">
              <h3 style="font-weight: 600; margin-bottom: 8px;">${group.length} Leads at Same Location</h3>
              ${leadsList}
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });
    } else if (viewMode === 'facility') {
      // Group accounts by coordinates to handle stacking
      const accountGroups = groupByCoords(accounts);
      
      accountGroups.forEach((group, key) => {
        const [lat, lng] = key.split(',').map(Number);
        
        if (group.length === 1) {
          // Single account - render normal marker
          const account = group[0];
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
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${account.location || account.segment || 'No location'}</p>
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
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        } else {
          // Multiple accounts at same location - render cluster marker
          const el = document.createElement('div');
          el.className = 'map-marker account-cluster';
          el.style.cssText = `
            width: 32px;
            height: 32px;
            background-color: #3b82f6;
            border: 3px solid white;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            color: white;
          `;
          el.textContent = String(group.length);

          // Build popup content listing all accounts
          const accountsList = group.map(account => `
            <div style="padding: 6px 0; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 2px; background-color: ${account.health_score ? getHealthHexColor(account.health_score) : '#6b7280'};"></span>
                <strong style="font-size: 13px;">${account.name}</strong>
                ${account.health_score ? `<span style="font-size: 11px; color: #666;">(${account.health_score}/10)</span>` : ''}
              </div>
              <div style="margin-top: 4px; display: flex; gap: 4px;">
                <button 
                  onclick="window.location.href='/accounts/${account.id}'"
                  style="padding: 2px 8px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;"
                >
                  View
                </button>
              </div>
            </div>
          `).join('');

          const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(`
            <div style="padding: 8px; max-height: 300px; overflow-y: auto;">
              <h3 style="font-weight: 600; margin-bottom: 8px; color: #ef4444;">${group.length} Facilities at Same Location</h3>
              <p style="font-size: 11px; color: #666; margin-bottom: 12px;">These facilities share city-level coordinates. Consider re-geocoding for precise locations.</p>
              ${accountsList}
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });
    } else {
      // Trainer view - group by coordinates too
      const trainerGroups = groupByCoords(trainers);
      
      trainerGroups.forEach((group, key) => {
        const [lat, lng] = key.split(',').map(Number);
        
        if (group.length === 1) {
          const trainer = group[0];
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
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        } else {
          // Multiple trainers cluster
          const el = document.createElement('div');
          el.className = 'map-marker trainer-cluster';
          el.style.cssText = `
            width: 28px;
            height: 28px;
            background-color: #8b5cf6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 12px;
            color: white;
          `;
          el.textContent = String(group.length);

          const trainersList = group.map(trainer => `
            <div style="padding: 4px 0; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${trainer.career_health_score ? getHealthHexColor(trainer.career_health_score) : '#6b7280'};"></span>
                <strong style="font-size: 12px;">${trainer.name}</strong>
                ${trainer.career_health_score ? `<span style="font-size: 10px; color: #666;">(${trainer.career_health_score}/10)</span>` : ''}
              </div>
            </div>
          `).join('');

          const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`
            <div style="padding: 8px; max-height: 250px; overflow-y: auto;">
              <h3 style="font-weight: 600; margin-bottom: 8px;">${group.length} Trainers at Same Location</h3>
              ${trainersList}
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        }
      });
    }

    // Auto-fit to markers on first load if no saved viewport
    if (!hasAutoFitted.current && markersRef.current.length > 0) {
      const savedViewport = getSavedViewport();
      if (!savedViewport) {
        fitToMarkers();
      }
      hasAutoFitted.current = true;
    }
  }, [viewMode, leads, accounts, trainers, clearMarkers, fitToMarkers, getSavedViewport, groupByCoords]);

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

  const leadCount = leads?.length || 0;
  const facilityCount = accounts?.length || 0;
  const trainerCount = trainers?.length || 0;
  const currentCount = viewMode === 'lead' ? leadCount : viewMode === 'facility' ? facilityCount : trainerCount;

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
              Visualize accounts and trainers on the map
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fitToMarkers}
              disabled={isLoading || currentCount === 0}
              className="gap-2"
            >
              <Crosshair className="h-4 w-4" />
              Fit to Data
            </Button>
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
              <TabsTrigger value="lead" className="gap-2">
                <MapPin className="h-4 w-4" />
                Lead ({leadCount})
              </TabsTrigger>
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

        {/* Stacking warning */}
        {viewMode === 'facility' && stackedFacilityCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>{stackedFacilityCount} facilities</strong> share the same coordinates (city-level geocoding). 
              Click the numbered marker to see all facilities at that location.
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state overlay */}
        {!isLoading && currentCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Card className="max-w-sm mx-4 pointer-events-auto">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">
                      No {viewMode === 'lead' ? 'leads' : viewMode === 'facility' ? 'facilities' : 'trainers'} on the map
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === 'lead'
                        ? 'Leads appear when they have location coordinates. Pull new leads to see them on the map.'
                        : viewMode === 'facility' 
                          ? 'Facilities appear when accounts have location coordinates (lat/lng).'
                          : 'Trainers appear when they have location coordinates (lat/lng).'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
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
