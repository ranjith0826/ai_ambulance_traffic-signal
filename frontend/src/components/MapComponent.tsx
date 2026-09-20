import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Ambulance, Hospital, TrafficSignal, Trip } from '../types';
import { getStoredApiKeys, getMapLayerOptions, MapLayerOption } from '../config/apiConfig';
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface MapComponentProps {
  ambulances?: Ambulance[];
  signals?: TrafficSignal[];
  hospitals?: Hospital[];
  activeTrip?: Trip | null;
  selectedAmbulanceId?: string | null;
  onSelectAmbulance?: (ambulance: Ambulance) => void;
  onSelectSignal?: (signal: TrafficSignal) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  ambulances = [],
  signals = [],
  hospitals = [],
  activeTrip = null,
  selectedAmbulanceId = null,
  onSelectAmbulance,
  onSelectSignal,
  center = [12.9716, 77.5946],
  zoom = 14,
  height = '540px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>(getStoredApiKeys().selectedTheme);

  // Helper to apply tile layer
  const applyTileLayer = (themeId: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const keys = getStoredApiKeys();
    const layerOptions = getMapLayerOptions(keys);
    const selected = layerOptions.find((l) => l.id === themeId) || layerOptions[0];

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileLayer = L.tileLayer(selected.url, {
      attribution: selected.attribution,
      maxZoom: selected.maxZoom,
      subdomains: selected.subdomains || ['a', 'b', 'c', 'd'],
    });

    tileLayer.addTo(map);
    currentTileLayerRef.current = tileLayer;
    setActiveThemeId(themeId);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      applyTileLayer(activeThemeId);
    }

    // Listen to global API key and theme changes
    const handleKeysUpdated = (e: any) => {
      if (e.detail?.selectedTheme) {
        applyTileLayer(e.detail.selectedTheme);
      }
    };
    window.addEventListener('lifelane:api-keys-updated', handleKeysUpdated);

    return () => {
      window.removeEventListener('lifelane:api-keys-updated', handleKeysUpdated);
    };
  }, []);

  // Recenter map
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.panTo(center, { animate: true, duration: 0.8 });
    }
  }, [center[0], center[1], zoom]);

  // Handle Fullscreen resize trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Render markers and corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Draw Route Polyline if active trip exists
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (activeTrip && activeTrip.route_coordinates && activeTrip.route_coordinates.length > 0) {
      const latLngs = activeTrip.route_coordinates.map((c) => [c[0], c[1]] as [number, number]);

      // Outer corridor glow
      L.polyline(latLngs, {
        color: '#10B981',
        weight: 12,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layer);

      // Inner core dashed line
      const corridorLine = L.polyline(latLngs, {
        color: '#34D399',
        weight: 4,
        opacity: 0.95,
        dashArray: '8, 8',
      }).addTo(layer);

      routeLayerRef.current = corridorLine;
    }

    // 2. Render Hospitals
    hospitals.forEach((hosp) => {
      const isTopMatch = hosp.recommended;
      const html = `
        <div style="cursor: pointer;" class="group relative flex flex-col items-center">
          <div style="background-color: ${isTopMatch ? '#10B981' : '#0A0D0B'}; border: 2.5px solid #FFFFFF;" class="w-9 h-9 rounded-2xl shadow-xl flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform">
            🏥
          </div>
          <div style="background: rgba(255,255,255,0.97); border: 1px solid #E2E8F0; color: #0A0D0B;" class="text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap mt-1 tracking-tight">
            ${hosp.name.split(' ')[0]} <span style="color: #10B981;">(ICU: ${hosp.icu_beds_available})</span>
          </div>
        </div>
      `;
      const icon = L.divIcon({
        className: 'custom-hosp-icon',
        html,
        iconSize: [40, 52],
        iconAnchor: [20, 26],
      });

      const marker = L.marker([hosp.location.latitude, hosp.location.longitude], { icon }).addTo(layer);
      marker.bindPopup(`
        <div style="font-family: inherit; color: #0A0D0B; min-width: 250px; padding: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 15px; margin: 0; color: #0A0D0B;">🏥 ${hosp.name}</h4>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: #ECFDF5; color: #10B981;">
              ${hosp.emergency_readiness}% READY
            </span>
          </div>
          <p style="font-size: 11px; color: #64748B; margin-bottom: 10px; line-height: 1.4;">${hosp.address}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <div style="font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: 700;">ER Beds</div>
              <div style="font-weight: 800; color: #0A0D0B;">${hosp.emergency_beds_available} / ${hosp.emergency_beds}</div>
            </div>
            <div style="background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <div style="font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: 700;">ICU Capacity</div>
              <div style="font-weight: 800; color: #10B981;">${hosp.icu_beds_available} / ${hosp.icu_beds}</div>
            </div>
            <div style="background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <div style="font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: 700;">Ventilators</div>
              <div style="font-weight: 800; color: #0A0D0B;">${hosp.ventilators_available} Available</div>
            </div>
            <div style="background: #F8FAFC; padding: 6px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <div style="font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: 700;">Ambulance Bay</div>
              <div style="font-weight: 800; color: #10B981;">Clear (Open)</div>
            </div>
          </div>
          <div style="font-size: 11px; color: #10B981; font-weight: 700; background: #ECFDF5; padding: 4px 6px; border-radius: 6px; border: 1px dashed #10B981;">
            <b>On-Duty Specialists:</b> ${hosp.specialists.slice(0, 3).join(', ')}
          </div>
        </div>
      `);
    });

    // 3. Render Virtual Traffic Signals
    signals.forEach((sig) => {
      const isEmergencyGreen = sig.status === 'EMERGENCY_GREEN';
      const isRed = sig.status === 'RED' || sig.status === 'HOLD';
      const isYellow = sig.status === 'YELLOW';

      let bgClass = 'bg-[#10B981]';
      let borderGlow = '';
      let statusLabel = 'NORMAL CYCLE';

      if (isEmergencyGreen) {
        bgClass = 'bg-[#10B981] beacon-pulse';
        borderGlow = 'ring-4 ring-emerald-400 ring-opacity-90';
        statusLabel = '⚡ EMERGENCY GREEN PREEMPTION';
      } else if (isRed) {
        bgClass = 'bg-[#DC2626]';
        statusLabel = sig.status;
      } else if (isYellow) {
        bgClass = 'bg-[#D97706]';
        statusLabel = 'YELLOW CAUTION';
      }

      const html = `
        <div style="cursor: pointer;" class="group relative flex flex-col items-center">
          <div class="w-8 h-8 rounded-full ${bgClass} ${borderGlow} flex items-center justify-center text-white text-xs font-black shadow-lg border-2 border-white hover:scale-125 transition-transform">
            ${isEmergencyGreen ? '⚡' : isRed ? '⛔' : '🚦'}
          </div>
          <div style="background: rgba(255,255,255,0.97); border: 1px solid #E2E8F0; color: #0A0D0B;" class="text-[9px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap mt-1">
            {sig.name.split(' ')[0]}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-sig-icon',
        html,
        iconSize: [36, 44],
        iconAnchor: [18, 22],
      });

      const marker = L.marker([sig.location.latitude, sig.location.longitude], { icon }).addTo(layer);
      marker.on('click', () => {
        onSelectSignal?.(sig);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; color: #0A0D0B; min-width: 240px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 14px; margin: 0; color: #0A0D0B;">🚦 ${sig.name}</h4>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${
              isEmergencyGreen
                ? 'background: #ECFDF5; color: #10B981;'
                : isRed
                ? 'background: #FEE2E2; color: #991B1B;'
                : 'background: #FEF3C7; color: #92400E;'
            }">
              ${sig.status}
            </span>
          </div>
          <div style="font-size: 11px; margin-bottom: 6px;">
            <b>Active Preemption:</b> ${sig.emergency_corridor_active ? '<span style="color: #10B981; font-weight: 800;">ACTIVE' + (sig.approaching_ambulance_number ? ' (AMB #' + sig.approaching_ambulance_number + ')' : '') + '</span>' : '<span style="color: #64748B;">None</span>'}
          </div>
          <div style="font-size: 11px; margin-bottom: 6px;">
            <b>Signal Loop:</b> ${sig.cycle_time_seconds || 60}s Standard Cycle
          </div>
          ${
            sig.approaching_ambulance_number
              ? `<div style="background: #F8FAFC; padding: 6px 8px; border-radius: 8px; font-size: 11px; margin-top: 6px; border: 1px solid #E2E8F0;">
                  <div style="font-weight: 800; color: #DC2626;">🚨 Approaching: ${sig.approaching_ambulance_number}</div>
                  <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Distance: <b>${sig.distance_to_signal ? Math.round(sig.distance_to_signal) + ' m' : 'In 500m geofence'}</b></div>
                </div>`
              : '<div style="font-size: 10px; color: #64748B; font-style: italic;">Normal automated signal cycle (60s loop)</div>'
          }
        </div>
      `);
    });

    // 4. Render Ambulances
    ambulances.forEach((amb) => {
      const isBusy = amb.status === 'busy' || (activeTrip && activeTrip.ambulance_id === amb.id);
      const isSelected = selectedAmbulanceId === amb.id;

      const html = `
        <div style="cursor: pointer;" class="flex flex-col items-center group">
          <div class="relative flex items-center justify-center">
            ${isBusy ? '<span class="absolute inline-flex h-10 w-10 rounded-full bg-red-400 opacity-80 animate-ping"></span>' : ''}
            <div style="background-color: ${isBusy ? '#DC2626' : '#10B981'}; border: 2.5px solid #FFFFFF;" class="w-9 h-9 rounded-2xl shadow-xl flex items-center justify-center text-white text-base font-black ${isSelected ? 'ring-4 ring-emerald-400' : ''} group-hover:scale-110 transition-transform">
              🚑
            </div>
          </div>
          <div style="background: #0A0D0B; color: #FFFFFF;" class="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-lg shadow-md mt-1 whitespace-nowrap border border-[#10B981]">
            ${amb.ambulance_number}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-amb-icon',
        html,
        iconSize: [40, 52],
        iconAnchor: [20, 26],
      });

      const marker = L.marker([amb.current_location.latitude, amb.current_location.longitude], { icon }).addTo(layer);
      marker.on('click', () => {
        onSelectAmbulance?.(amb);
      });

      const tripDetails = activeTrip && (activeTrip.ambulance_id === amb.id || activeTrip.ambulance_number === amb.ambulance_number) ? activeTrip : null;

      marker.bindPopup(`
        <div style="font-family: inherit; color: #0A0D0B; min-width: 260px; padding: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 15px; color: #0A0D0B; margin: 0;">🚑 ${amb.ambulance_number}</h4>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px; background: ${isBusy ? '#FEE2E2; color: #991B1B' : '#ECFDF5; color: #10B981'}">
              ${isBusy ? 'ACTIVE EMERGENCY' : 'AVAILABLE'}
            </span>
          </div>

          <div style="font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Driver</span><br/>
              <b>${amb.driver_name || 'Assigned Driver'}</b>
            </div>
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Live Speed</span><br/>
              <b style="font-family: 'JetBrains Mono', monospace;">${Math.round(amb.speed || (isBusy ? 58 : 0))} km/h</b>
            </div>
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Emergency</span><br/>
              <b>${tripDetails?.emergency_type || (isBusy ? 'Cardiac Arrest' : 'Standby')}</b>
            </div>
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Severity</span><br/>
              <b style="color: #DC2626;">${tripDetails?.severity || (isBusy ? 'Critical' : 'None')}</b>
            </div>
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Est. ETA</span><br/>
              <b style="font-family: 'JetBrains Mono', monospace; color: #10B981;">${tripDetails?.eta_minutes ? tripDetails.eta_minutes + ' min' : (isBusy ? '6.2 min' : 'Idle')}</b>
            </div>
            <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase;">Priority Score</span><br/>
              <b style="font-family: 'JetBrains Mono', monospace; color: #0A0D0B;">${tripDetails?.priority_score || (isBusy ? '92.4' : 'N/A')}</b>
            </div>
          </div>

          ${
            tripDetails?.hospital_name
              ? `<div style="background: #FFFFFF; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 6px; font-size: 11px; color: #0A0D0B;">
                  <span style="color: #64748B; font-size: 9px; text-transform: uppercase; font-weight: 700;">Target Trauma Facility:</span><br/>
                  <b>🏥 ${tripDetails.hospital_name}</b>
                </div>`
              : ''
          }
        </div>
      `);
    });

  }, [ambulances, signals, hospitals, activeTrip, selectedAmbulanceId]);

  const allLayers = getMapLayerOptions(getStoredApiKeys());
  const activeLayer = allLayers.find((l) => l.id === activeThemeId) || allLayers[0];

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white ${
        isFullscreen ? 'fixed inset-0 z-[800] rounded-none border-0' : 'isolate z-0'
      } ${className}`}
    >
      <div ref={mapContainerRef} className="isolate overflow-hidden rounded-3xl" style={{ height: isFullscreen ? '100vh' : height, width: '100%' }} />

      {/* Floating Top-Right Tactical Toolbar */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        {/* Layer Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 bg-white/95 hover:bg-white text-gray-900 px-3.5 py-2 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold transition-all backdrop-blur-md"
            title="Switch Map Tiles"
          >
            <Layers className="w-4 h-4 text-[#10B981]" />
            <span className="hidden sm:inline">{activeLayer.name.split(' ')[0]}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 space-y-1 animate-in fade-in z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-100">
                Map Provider Layers
              </div>
              {allLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    applyTileLayer(layer.id);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeThemeId === layer.id
                      ? 'bg-[#10B981] text-[#0A0D0B] font-bold'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span>{layer.name}</span>
                  {layer.requiresKey && activeThemeId !== layer.id && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">Key</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recenter Button */}
        <button
          onClick={() => {
            if (mapInstanceRef.current && center) {
              mapInstanceRef.current.setView(center, zoom, { animate: true });
            }
          }}
          className="p-2 bg-white/95 hover:bg-white text-gray-900 rounded-2xl border border-gray-200 shadow-sm transition-all backdrop-blur-md"
          title="Recenter Map"
        >
          <Navigation className="w-4 h-4 text-[#10B981]" />
        </button>

        {/* Fullscreen Expansion Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-white/95 hover:bg-white text-gray-900 rounded-2xl border border-gray-200 shadow-sm transition-all backdrop-blur-md"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Map Legend Overlay with generous padding */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200 shadow-md z-[400] text-xs text-gray-900 font-bold flex flex-wrap items-center gap-4 sm:gap-5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DC2626] ring-2 ring-red-200"></span>
          <span>Emergency Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10B981] ring-2 ring-emerald-200"></span>
          <span>Fleet Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-300"></span>
          <span>Preempted Green</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">🏥</span>
          <span>Trauma Center</span>
        </div>
      </div>
    </div>
  );
};
