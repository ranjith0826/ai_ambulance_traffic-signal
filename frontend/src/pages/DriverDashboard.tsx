import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService, hospitalService, ambulanceService, signalService } from '../services/api';
import { Trip, Hospital, Ambulance, TrafficSignal, EmergencyType, SeverityLevel, Location } from '../types';
import { MapComponent } from '../components/MapComponent';
import confetti from 'canvas-confetti';
import {
  Siren,
  Play,
  Square,
  Pause,
  RotateCcw,
  Navigation,
  Activity,
  Hospital as HospIcon,
  Clock,
  Gauge,
  Compass,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Zap,
  Radio,
  Sliders,
  ShieldAlert,
  ChevronRight,
  Search,
  MapPin,
  X,
  Loader2
} from 'lucide-react';

interface LandmarkLocation {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

const PRESET_LANDMARKS: LandmarkLocation[] = [
  { name: 'Residency Road / Richmond Circle', category: 'Central Corridor', latitude: 12.9650, longitude: 77.5850 },
  { name: 'MG Road Metro Station', category: 'Metro Hub', latitude: 12.9756, longitude: 77.6066 },
  { name: 'Indiranagar 100ft Road', category: 'East Hub', latitude: 12.9719, longitude: 77.6412 },
  { name: 'Koramangala 5th Block Junction', category: 'South Hub', latitude: 12.9352, longitude: 77.6245 },
  { name: 'Majestic Central Railway Station', category: 'Transit Hub', latitude: 12.9774, longitude: 77.5708 },
  { name: 'Brigade Road / Church Street', category: 'Commercial', latitude: 12.9733, longitude: 77.6074 },
  { name: 'Whitefield ITPL Main Road', category: 'Tech Park', latitude: 12.9866, longitude: 77.7381 },
  { name: 'Jayanagar 4th Block Complex', category: 'South Zone', latitude: 12.9298, longitude: 77.5824 },
  { name: 'Electronic City Toll Plaza', category: 'Highway Zone', latitude: 12.8452, longitude: 77.6602 },
  { name: 'Hebbal Flyover Junction', category: 'North Corridor', latitude: 13.0358, longitude: 77.5970 }
];

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();

  // State
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [myAmbulance, setMyAmbulance] = useState<Ambulance | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);

  // Modals
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [lastCompletedTrip, setLastCompletedTrip] = useState<Trip | null>(null);

  // Start Emergency Form
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('Cardiac');
  const [severity, setSeverity] = useState<SeverityLevel>('Critical');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [recommendedHospitals, setRecommendedHospitals] = useState<Hospital[]>([]);
  const [useGps, setUseGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Location>({ latitude: 12.9650, longitude: 77.5850 });
  const [simulationSpeed, setSimulationSpeed] = useState<number>(65);

  // Location Search State
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>('Residency Road / Richmond Circle');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('Residency Road / Richmond Circle');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<LandmarkLocation[]>(PRESET_LANDMARKS);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Simulation playback state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStepIndex, setSimStepIndex] = useState<number>(0);
  const simTimerRef = useRef<any>(null);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        const [hosps, sigs, ambs, activeTrips] = await Promise.all([
          hospitalService.list(),
          signalService.list(),
          ambulanceService.list(),
          tripService.getActive()
        ]);
        setHospitals(hosps);
        setSignals(sigs);
        setAmbulances(ambs);

        const ambNum = user?.ambulance_number || 'KA-01-EA-1001';
        const found = ambs.find((a) => a.ambulance_number === ambNum) || ambs[0];
        setMyAmbulance(found);

        const myActive = activeTrips.find(
          (t) => t.ambulance_id === found?.id || t.ambulance_number === found?.ambulance_number
        );
        if (myActive) {
          setActiveTrip(myActive);
          setCurrentCoords(myActive.current_location);
        }
      } catch (e) {
        console.error('Error fetching driver dashboard data', e);
      }
    };
    initData();
  }, [user]);

  // Query hospital recommendations whenever starting coords, emergency type, or severity changes
  useEffect(() => {
    if (showStartModal) {
      hospitalService.recommend({
        current_location: currentCoords,
        emergency_type: emergencyType,
        severity: severity
      }).then((res) => {
        setRecommendedHospitals(res.all_ranked || []);
        if (res.recommended_hospital) {
          setSelectedHospitalId(res.recommended_hospital.id);
        }
      }).catch(() => {});
    }
  }, [showStartModal, emergencyType, severity, currentCoords]);

  // Handle Location Search Input & Online Geocoding Lookup
  useEffect(() => {
    if (!locationSearchQuery.trim()) {
      setSearchResults(PRESET_LANDMARKS);
      return;
    }

    const query = locationSearchQuery.toLowerCase();
    const matchedPresets = PRESET_LANDMARKS.filter(
      p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );

    // If matches preset, update immediately
    setSearchResults(matchedPresets);

    // If query has enough characters and fewer preset matches, query Nominatim OSM geocoding
    if (locationSearchQuery.trim().length >= 3) {
      const timer = setTimeout(async () => {
        setIsSearchingLocation(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              locationSearchQuery
            )}&limit=5`
          );
          if (res.ok) {
            const data = await res.json();
            const geoResults: LandmarkLocation[] = data.map((item: any) => ({
              name: item.display_name.split(',').slice(0, 3).join(','),
              category: 'Map Search',
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon)
            }));

            // Merge unique results
            const combined = [...matchedPresets];
            geoResults.forEach(gr => {
              if (!combined.some(c => Math.abs(c.latitude - gr.latitude) < 0.001 && Math.abs(c.longitude - gr.longitude) < 0.001)) {
                combined.push(gr);
              }
            });
            setSearchResults(combined.length > 0 ? combined : matchedPresets);
          }
        } catch (e) {
          // fallback to presets
        } finally {
          setIsSearchingLocation(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [locationSearchQuery]);

  // Select a location from search results
  const handleSelectLocation = (loc: LandmarkLocation) => {
    setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude });
    setSelectedLocationName(loc.name);
    setLocationSearchQuery(loc.name);
    setShowLocationSuggestions(false);
    setUseGps(false);
    setGpsError(null);
  };

  // Browser GPS detection
  const handleDetectGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          setCurrentCoords(coords);
          setSelectedLocationName('Current Browser GPS Location');
          setLocationSearchQuery('Current Browser GPS Location');
          setShowLocationSuggestions(false);
          setUseGps(true);
          setGpsError(null);
        },
        (err) => {
          setGpsError('GPS location unavailable. Using Simulation Mode coordinates.');
          setUseGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsError('Geolocation is not supported by your browser. Using Simulation Mode.');
      setUseGps(false);
    }
  };

  // --- Sound Helpers (Web Audio API — no external files needed) ---
  const playSiren = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 2.5;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      // Wailing effect: frequency sweeps up and down
      osc1.frequency.setValueAtTime(600, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.5);
      osc1.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.0);
      osc1.frequency.linearRampToValueAtTime(900, ctx.currentTime + 1.5);
      osc1.frequency.linearRampToValueAtTime(600, ctx.currentTime + 2.0);

      osc2.frequency.setValueAtTime(400, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.5);
      osc2.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.0);
      osc2.frequency.linearRampToValueAtTime(700, ctx.currentTime + 1.5);
      osc2.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.0);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch (e) { /* Audio not supported */ }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* Audio not supported */ }
  };

  // Start Emergency
  const handleStartEmergency = async () => {
    const amb = myAmbulance || (ambulances.length > 0 ? ambulances[0] : null);
    if (!amb) {
      alert('Ambulance data is loading. Please ensure backend is active.');
      return;
    }
    const hospId = selectedHospitalId || recommendedHospitals[0]?.id || (hospitals.length > 0 ? hospitals[0]?.id : '');
    if (!hospId) {
      alert('Please select a destination hospital before initiating the run.');
      return;
    }
    try {
      const res = await tripService.start({
        ambulance_id: amb.id,
        emergency_type: emergencyType,
        severity: severity,
        hospital_id: hospId,
        current_location: currentCoords,
        simulation_mode: !useGps,
        speed_kmh: simulationSpeed
      });
      setActiveTrip(res.trip);
      setShowStartModal(false);
      setShowLocationSuggestions(false);
      setSimStepIndex(0);
      setIsSimulating(true);
      playSiren(); // 🚨 Play siren when emergency starts
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start emergency trip');
    }
  };

  // Simulation Stepper along coordinates
  useEffect(() => {
    if (isSimulating && activeTrip && activeTrip.route_coordinates && activeTrip.route_coordinates.length > 0) {
      simTimerRef.current = setInterval(async () => {
        setSimStepIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          const coords = activeTrip.route_coordinates;

          if (nextIndex >= coords.length) {
            clearInterval(simTimerRef.current);
            setIsSimulating(false);
            return coords.length - 1;
          }

          const nextCoord = coords[nextIndex];
          const newLoc = { latitude: nextCoord[0], longitude: nextCoord[1] };
          setCurrentCoords(newLoc);

          tripService.updateLocation(activeTrip.id, {
            latitude: nextCoord[0],
            longitude: nextCoord[1],
            speed: simulationSpeed,
            heading: 90
          }).catch(() => {});

          return nextIndex;
        });
      }, 1200);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, activeTrip, simulationSpeed]);

  // End Emergency
  const handleEndEmergency = async () => {
    if (!activeTrip) return;
    try {
      const res = await tripService.end(activeTrip.id);
      setIsSimulating(false);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setLastCompletedTrip(res.trip_summary);
      setActiveTrip(null);
      setShowSummaryModal(true);

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to end emergency');
    }
  };

  const loadHistory = async () => {
    const history = await tripService.getHistory();
    setTripHistory(history);
    setShowHistoryModal(true);
  };

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header Bar with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-lane-green font-extrabold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Driver Emergency Tactical Cockpit</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
            Welcome, {user?.name || 'Emergency Driver'}
          </h1>
          <div className="flex flex-wrap items-center gap-5 text-xs text-cream-muted mt-3">
            <div className="flex items-center gap-1.5">
              <span>Unit:</span>
              <span className="font-mono font-bold text-cream-text bg-cream-bg px-2.5 py-1 rounded-lg border border-cream-border">
                {myAmbulance?.ambulance_number || user?.ambulance_number || 'KA-01-EA-1001'}
              </span>
            </div>
            <div>
              Status:{' '}
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                activeTrip ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {activeTrip ? '🚨 IN ACTIVE EMERGENCY RUN' : '🟢 READY FOR DISPATCH'}
              </span>
            </div>
            <div>
              Mode: <span className="font-bold text-lane-dark">{useGps ? 'Live Browser GPS' : 'Simulation Engine'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {!activeTrip ? (
            <button
              onClick={() => setShowStartModal(true)}
              className="px-6 py-3.5 bg-lane-danger hover:bg-red-700 text-white rounded-2xl font-heading text-xs font-black tracking-wider uppercase shadow-cream-md flex items-center gap-2.5 transition-all hover:scale-105"
            >
              <Siren className="w-5 h-5 animate-bounce" />
              <span>START EMERGENCY</span>
            </button>
          ) : (
            <button
              onClick={handleEndEmergency}
              className="px-6 py-3.5 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl font-heading text-xs font-black tracking-wider uppercase shadow-cream-md flex items-center gap-2.5 transition-all"
            >
              <Square className="w-4 h-4" />
              <span>END EMERGENCY</span>
            </button>
          )}

          <button
            onClick={loadHistory}
            className="px-5 py-3.5 bg-cream-bg text-cream-text border border-cream-border rounded-2xl text-xs font-bold hover:bg-slate-100 flex items-center gap-2 transition-colors shadow-cream-sm"
          >
            <FileText className="w-4 h-4" />
            <span>TRIP HISTORY</span>
          </button>
        </div>
      </div>

      {/* Active Trip Telemetry Strip with spacious cards */}
      {activeTrip && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Condition</div>
            <div className="font-heading text-base font-black text-cream-text">
              {activeTrip.emergency_type}
            </div>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              {activeTrip.severity}
            </span>
          </div>

          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Destination</div>
            <div className="font-heading text-xs font-black text-cream-text truncate" title={activeTrip.hospital_name}>
              {activeTrip.hospital_name}
            </div>
            <div className="text-[10px] text-cream-muted">Priority Trauma Center</div>
          </div>

          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Speed</div>
            <div className="font-heading text-2xl font-black text-lane-dark font-mono">
              {simulationSpeed} <span className="text-xs font-normal text-cream-muted font-sans">km/h</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">Priority Transit</div>
          </div>

          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Remaining ETA</div>
            <div className="font-heading text-2xl font-black text-lane-danger font-mono">
              {activeTrip.eta_minutes} <span className="text-xs font-normal text-cream-muted font-sans">min</span>
            </div>
            <div className="text-[10px] text-cream-muted">Dynamic Update</div>
          </div>

          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Distance Left</div>
            <div className="font-heading text-2xl font-black text-cream-text font-mono">
              {activeTrip.distance_remaining_km} <span className="text-xs font-normal text-cream-muted font-sans">km</span>
            </div>
            <div className="text-[10px] text-cream-muted">Total: {activeTrip.total_distance_km} km</div>
          </div>

          <div className="bg-cream-card p-5 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Priority Score</div>
            <div className="font-heading text-2xl font-black text-lane-green font-mono">
              {activeTrip.priority_score}
            </div>
            <div className="text-[10px] text-lane-green font-semibold">Preempts Red Signals</div>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map + Simulation Controls with generous gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-cream-card rounded-3xl p-6 border border-cream-border shadow-cream-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-bold text-cream-text">
                <Navigation className="w-4 h-4 text-lane-green" />
                <span className="font-heading text-sm">Live Navigation Corridor View</span>
              </div>
              {activeTrip && (
                <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full font-bold animate-pulse">
                  🟢 500m Green Wave Preemption Active
                </span>
              )}
            </div>

            <MapComponent
              ambulances={myAmbulance ? [{
                ...myAmbulance,
                current_location: currentCoords,
                speed: simulationSpeed,
                status: activeTrip ? 'busy' : 'available'
              }] : ambulances}
              signals={signals}
              hospitals={hospitals}
              activeTrip={activeTrip}
              center={[currentCoords.latitude, currentCoords.longitude]}
              height="540px"
            />
          </div>
        </div>

        {/* Sidebar: Simulation Stepper & Telemetry Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Simulation Cockpit Card with generous padding */}
          <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
            <div className="flex items-center justify-between border-b border-cream-border pb-4">
              <span className="font-heading text-sm font-bold text-cream-text flex items-center gap-2">
                <Sliders className="w-4 h-4 text-lane-gold" />
                SIMULATION COCKPIT
              </span>
              <span className="text-[10px] font-mono bg-cream-bg px-2.5 py-1 rounded-lg text-cream-muted border border-cream-border">
                Virtual Telemetry
              </span>
            </div>

            {activeTrip ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cream-muted">Transit State:</span>
                  <span className={`text-xs font-bold ${isSimulating ? 'text-emerald-700 animate-pulse' : 'text-amber-700'}`}>
                    {isSimulating ? '▶ Cruising along route' : '⏸ Paused'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      isSimulating
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-lane-green text-cream-card hover:bg-lane-dark'
                    }`}
                  >
                    {isSimulating ? <><Pause className="w-4 h-4" /> Pause Run</> : <><Play className="w-4 h-4 fill-current" /> Resume Run</>}
                  </button>
                  <button
                    onClick={() => {
                      setSimStepIndex(0);
                      if (activeTrip.route_coordinates.length > 0) {
                        const start = activeTrip.route_coordinates[0];
                        setCurrentCoords({ latitude: start[0], longitude: start[1] });
                      }
                    }}
                    className="px-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-cream-muted" />
                    Reset
                  </button>
                </div>

                {/* Speed Slider with spacious styling */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-cream-text">
                    <span>Simulated Transit Speed</span>
                    <span className="font-mono text-lane-green">{simulationSpeed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    step="5"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                    className="w-full accent-lane-green cursor-pointer h-2 bg-cream-bg rounded-lg"
                  />
                </div>

                {/* Waypoint Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-cream-muted">
                    <span>Corridor Progress</span>
                    <span className="font-mono font-bold text-cream-text">
                      {Math.round((simStepIndex / Math.max(1, (activeTrip.route_coordinates?.length || 1) - 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-cream-bg rounded-full overflow-hidden border border-cream-border">
                    <div
                      className="h-full bg-gradient-to-r from-lane-green to-emerald-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((simStepIndex / Math.max(1, (activeTrip.route_coordinates?.length || 1) - 1)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cream-bg border border-cream-border flex items-center justify-center mx-auto text-3xl shadow-sm">
                  🚑
                </div>
                <p className="text-xs text-cream-muted leading-relaxed">
                  No active emergency corridor. Click "START EMERGENCY" to begin automated route calculation and virtual traffic preemption.
                </p>
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-6 py-3 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl text-xs font-bold shadow-sm transition-all"
                >
                  Start New Emergency
                </button>
              </div>
            )}
          </div>

          {/* Green Corridor Geofence Status Card */}
          <div className="bg-cream-card rounded-3xl p-6 border border-cream-border shadow-cream-md space-y-4">
            <span className="font-heading text-sm font-bold text-cream-text flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              GEOFENCE PREEMPTION STATUS
            </span>
            <div className="p-4 bg-cream-bg rounded-2xl border border-cream-border text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-cream-muted">Trigger Radius:</span>
                <span className="font-bold text-cream-text font-mono">500 meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Preemption Mode:</span>
                <span className="font-bold text-emerald-800">EMERGENCY GREEN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Post-Pass Action:</span>
                <span className="font-bold text-cream-text">Automatic Normal Cycle</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* START EMERGENCY MODAL with generous padding */}
      {showStartModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-cream-card rounded-3xl border border-cream-border max-w-xl w-full p-8 shadow-cream-lg space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cream-border pb-4">
              <div className="flex items-center gap-3 text-lane-danger font-black text-base uppercase">
                <Siren className="w-6 h-6 animate-pulse" />
                <span className="font-heading">Initialize Emergency Corridor</span>
              </div>
              <button
                onClick={() => setShowStartModal(false)}
                className="text-cream-muted hover:text-cream-text text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Emergency Type & Severity */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Emergency Type *
                </label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as EmergencyType)}
                  className="w-full px-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-lane-green"
                >
                  <option value="Cardiac">Cardiac Arrest</option>
                  <option value="Accident">Accident / Trauma</option>
                  <option value="Stroke">Acute Stroke</option>
                  <option value="Trauma">Major Trauma</option>
                  <option value="Other">General Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Severity Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full px-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs font-semibold outline-none text-lane-danger font-bold focus:ring-2 focus:ring-lane-danger"
                >
                  <option value="Critical">Critical (Score 100)</option>
                  <option value="High">High (Score 75)</option>
                  <option value="Moderate">Moderate (Score 50)</option>
                  <option value="Low">Low (Score 25)</option>
                </select>
              </div>
            </div>

            {/* Starting Location Searchbar & Selection */}
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-cream-text">
                  Starting Incident Location / Pickup Point *
                </label>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  className="text-xs font-bold text-lane-green hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Use Browser GPS
                </button>
              </div>

              {/* Searchbar Input Container */}
              <div className="relative" ref={searchContainerRef}>
                <div className="flex items-center bg-cream-bg border border-cream-border rounded-2xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-lane-green transition-all shadow-sm">
                  <Search className="w-4 h-4 text-cream-muted shrink-0 mr-2" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    placeholder="Search landmark, street, intersection or area..."
                    className="w-full bg-transparent text-xs font-semibold text-cream-text placeholder:text-cream-muted/70 outline-none"
                  />
                  {isSearchingLocation && (
                    <Loader2 className="w-4 h-4 text-lane-green animate-spin shrink-0 ml-2" />
                  )}
                  {locationSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSearchQuery('');
                        setShowLocationSuggestions(true);
                      }}
                      className="p-1 hover:bg-slate-100 rounded-lg text-cream-muted hover:text-cream-text transition-colors shrink-0 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete / Suggestions Dropdown */}
                {showLocationSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-cream-card border border-cream-border rounded-2xl shadow-cream-lg max-h-56 overflow-y-auto divide-y divide-cream-border/60 animate-in fade-in">
                      <div className="p-2.5 bg-cream-bg text-[10px] font-bold text-cream-muted uppercase tracking-wider flex items-center justify-between">
                        <span>Suggested Pickup Points</span>
                        <span className="font-mono text-[9px]">{searchResults.length} Results</span>
                      </div>
                      {searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-cream-muted">
                          No matching locations found. Try a different landmark or use GPS.
                        </div>
                      ) : (
                        searchResults.map((loc, idx) => (
                          <div
                            key={`${loc.name}-${idx}`}
                            onClick={() => handleSelectLocation(loc)}
                            className="p-3 hover:bg-cream-bg cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <MapPin className="w-4 h-4 text-lane-green shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-cream-text truncate">
                                  {loc.name}
                                </div>
                                <div className="text-[10px] text-cream-muted flex items-center gap-2">
                                  <span>{loc.category}</span>
                                  <span>•</span>
                                  <span className="font-mono">
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-lane-green bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 group-hover:bg-lane-green group-hover:text-white transition-colors">
                              Select
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                )}
              </div>

              {/* Resolved Location & Coordinate Feedback */}
              <div className="flex items-center justify-between text-[11px] bg-cream-bg/60 border border-cream-border/70 rounded-xl px-3 py-2 text-cream-muted">
                <span className="truncate flex items-center gap-1.5 font-medium text-cream-text">
                  <MapPin className="w-3.5 h-3.5 text-lane-green shrink-0" />
                  <span className="truncate">{selectedLocationName}</span>
                </span>
                <span className="font-mono text-[10px] bg-cream-card border border-cream-border px-2 py-0.5 rounded-md shrink-0 text-cream-muted">
                  Lat: {currentCoords.latitude.toFixed(4)}, Lon: {currentCoords.longitude.toFixed(4)}
                </span>
              </div>

              {gpsError && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  {gpsError}
                </div>
              )}
            </div>

            {/* Smart Hospital Recommendation Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-cream-text">
                Destination Hospital (AI Smart Match) *
              </label>
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {recommendedHospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    onClick={() => setSelectedHospitalId(hosp.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedHospitalId === hosp.id
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-cream-bg border-cream-border hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-extrabold text-xs text-cream-text flex items-center gap-2">
                        <HospIcon className="w-4 h-4 text-blue-700" />
                        {hosp.name}
                      </div>
                      {hosp.recommended && (
                        <span className="bg-lane-green text-cream-card text-[10px] font-black px-2.5 py-0.5 rounded-full">
                          TOP MATCH
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px] text-cream-muted mt-2">
                      <div>Distance: <b className="text-cream-text">{hosp.distance_km} km</b></div>
                      <div>ETA: <b className="text-cream-text">{hosp.eta_minutes} min</b></div>
                      <div>ICU Beds: <b className="text-[#10B981]">{hosp.icu_beds_available} Avail</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch CTA with spacious buttons */}
            <div className="pt-3 flex gap-4">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="flex-1 py-3.5 bg-cream-bg border border-cream-border rounded-2xl text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartEmergency}
                className="flex-1 py-3.5 bg-lane-danger hover:bg-red-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-cream-md flex items-center justify-center gap-2"
              >
                <Siren className="w-4 h-4" />
                INITIATE RUN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIP COMPLETION SUMMARY MODAL with generous padding */}
      {showSummaryModal && lastCompletedTrip && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-cream-card rounded-3xl border-2 border-lane-green max-w-lg w-full p-8 shadow-cream-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-sm">
                ✓
              </div>
              <h3 className="font-heading text-2xl font-black text-cream-text">Emergency Mission Complete</h3>
              <p className="text-xs text-cream-muted">All signals reverted to normal traffic cycle safely.</p>
            </div>

            <div className="bg-cream-bg rounded-2xl p-6 border border-cream-border space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-cream-muted">Hospital:</span>
                <span className="font-heading font-extrabold text-cream-text">{lastCompletedTrip.hospital_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Condition & Severity:</span>
                <span className="font-bold text-red-700">{lastCompletedTrip.emergency_type} ({lastCompletedTrip.severity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Total Distance:</span>
                <span className="font-bold font-mono">{lastCompletedTrip.total_distance_km} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Travel Duration:</span>
                <span className="font-bold font-mono">{Math.round(lastCompletedTrip.travel_time_seconds / 60)} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Signals Prioritized:</span>
                <span className="font-bold text-emerald-800">{lastCompletedTrip.signals_prioritized_count} Intersections</span>
              </div>
              <div className="flex justify-between border-t border-cream-border pt-3">
                <span className="font-heading font-extrabold text-lane-green text-sm">Estimated Time Saved:</span>
                <span className="font-black text-lane-green font-mono text-base">
                  {lastCompletedTrip.estimated_time_saved_minutes} Minutes Saved
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-3.5 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl text-xs font-black shadow-cream-sm"
            >
              CLOSE & RETURN TO COCKPIT
            </button>
          </div>
        </div>
      )}

      {/* TRIP HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-cream-card rounded-3xl border border-cream-border max-w-2xl w-full p-8 shadow-cream-lg space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cream-border pb-4">
              <span className="font-heading text-base font-extrabold text-cream-text flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-lane-green" />
                Completed Trip Archive
              </span>
              <button onClick={() => setShowHistoryModal(false)} className="text-cream-muted font-bold text-base p-1">✕</button>
            </div>

            <div className="space-y-4">
              {tripHistory.map((t) => (
                <div key={t.id} className="p-4 bg-cream-bg rounded-2xl border border-cream-border text-xs flex items-center justify-between shadow-cream-sm">
                  <div>
                    <div className="font-heading font-extrabold text-sm text-cream-text">{t.hospital_name}</div>
                    <div className="text-xs text-cream-muted mt-1">
                      {t.emergency_type} • {t.severity} • {t.total_distance_km} km
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading font-black text-lane-green text-sm">{t.estimated_time_saved_minutes}m Saved</div>
                    <div className="text-xs text-cream-muted font-mono">{t.ended_at ? new Date(t.ended_at).toLocaleDateString() : 'Recent'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
