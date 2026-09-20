import React, { useState, useEffect } from 'react';
import {
  ambulanceService,
  signalService,
  hospitalService,
  tripService,
  conflictService
} from '../services/api';
import { socketService } from '../services/socket';
import { Ambulance, TrafficSignal, Hospital, Trip, ConflictResolution } from '../types';
import { MapComponent } from '../components/MapComponent';
import {
  Radio,
  Siren,
  GitMerge,
  Hospital as HospIcon,
  Shield,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  Zap,
  Activity
} from 'lucide-react';

export const TrafficCommandCenter: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [recentConflicts, setRecentConflicts] = useState<ConflictResolution[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<TrafficSignal | null>(null);
  const [overrideLoading, setOverrideLoading] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [ambs, sigs, hosps, trips, confs] = await Promise.all([
        ambulanceService.list(),
        signalService.list(),
        hospitalService.list(),
        tripService.getActive(),
        conflictService.getActive()
      ]);
      setAmbulances(ambs);
      setSignals(sigs);
      setHospitals(hosps);
      setActiveTrips(trips);
      setRecentConflicts(confs);
    } catch (err) {
      console.error('Error loading command center data', err);
    }
  };

  useEffect(() => {
    fetchData();

    socketService.connect();

    socketService.on('ambulance_location_updated', (data: any) => {
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === data.ambulance_id || a.ambulance_number === data.ambulance_number
            ? { ...a, current_location: data.current_location, speed: data.speed, heading: data.heading, status: 'busy' }
            : a
        )
      );
    });

    socketService.on('signal_changed', (updatedSig: TrafficSignal) => {
      setSignals((prev) =>
        prev.map((s) => (s.id === updatedSig.id ? { ...s, ...updatedSig } : s))
      );
    });

    socketService.on('emergency_started', () => {
      fetchData();
    });

    socketService.on('emergency_completed', () => {
      fetchData();
    });

    socketService.on('conflict_detected', (newConf: ConflictResolution) => {
      setRecentConflicts((prev) => [newConf, ...prev]);
    });

    return () => {
      socketService.off('ambulance_location_updated');
      socketService.off('signal_changed');
      socketService.off('emergency_started');
      socketService.off('emergency_completed');
      socketService.off('conflict_detected');
    };
  }, []);

  // Manual Signal Override
  const handleOverride = async (action: 'EMERGENCY_GREEN' | 'NORMAL' | 'HOLD') => {
    if (!selectedSignal) return;
    setOverrideLoading(true);
    try {
      const res = await signalService.override(
        selectedSignal.id,
        action,
        selectedSignal.approaching_ambulance_id,
        `Manual Officer Command: ${action}`
      );
      setSelectedSignal(res.signal);
      setSignals((prev) => prev.map((s) => (s.id === res.signal.id ? res.signal : s)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Override failed');
    } finally {
      setOverrideLoading(false);
    }
  };

  const activeCorridorCount = signals.filter((s) => s.emergency_corridor_active).length;

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-lane-green font-extrabold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Traffic Control Operations Command Center</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
            Metropolitan Signal Dispatch & Live Traffic Map
          </h1>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            Real-time virtual intersection management, green wave automation, and multi-vehicle conflict supervision.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="flex items-center gap-2 bg-[#0A0D0B] text-white px-4 py-2.5 rounded-2xl text-xs font-bold border border-[#10B981]/40 shadow-sm">
            <Radio className="w-4 h-4 text-[#10B981] animate-pulse" />
            <span>REAL-TIME DISPATCH FEED</span>
          </span>
          <button
            onClick={fetchData}
            className="p-3 bg-cream-bg text-cream-muted hover:text-cream-text border border-cream-border rounded-2xl hover:bg-slate-200 transition-all"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Status Strip with spacious padding and typography */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        <div className="bg-cream-card p-6 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
          <div className="text-[11px] uppercase font-bold text-cream-muted tracking-wider">Active Ambulances</div>
          <div className="font-heading text-3xl font-black text-cream-text font-mono">
            {ambulances.filter((a) => a.status === 'busy').length}{' '}
            <span className="text-xs font-normal text-cream-muted font-sans">/ {ambulances.length} fleet</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold pt-1">En Route Priority</div>
        </div>

        <div className="bg-cream-card p-6 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
          <div className="text-[11px] uppercase font-bold text-cream-muted tracking-wider">Active Emergencies</div>
          <div className="font-heading text-3xl font-black text-lane-danger font-mono">
            {activeTrips.length}
          </div>
          <div className="text-[11px] text-red-700 font-semibold pt-1">Live Corridors</div>
        </div>

        <div className="bg-cream-card p-6 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
          <div className="text-[11px] uppercase font-bold text-cream-muted tracking-wider">Green Corridors</div>
          <div className="font-heading text-3xl font-black text-lane-green font-mono">
            {activeCorridorCount}
          </div>
          <div className="text-[11px] text-[#10B981] font-semibold pt-1">500m Preempted</div>
        </div>

        <div className="bg-cream-card p-6 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
          <div className="text-[11px] uppercase font-bold text-cream-muted tracking-wider">Signal Conflicts</div>
          <div className="font-heading text-3xl font-black text-amber-700 font-mono">
            {recentConflicts.length}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold pt-1">Arbitrated Safely</div>
        </div>

        <div className="bg-cream-card p-6 rounded-2xl border border-cream-border shadow-cream-sm space-y-1">
          <div className="text-[11px] uppercase font-bold text-cream-muted tracking-wider">Hospital Readiness</div>
          <div className="font-heading text-3xl font-black text-blue-900 font-mono">
            {Math.round(hospitals.reduce((acc, h) => acc + h.emergency_readiness, 0) / Math.max(1, hospitals.length))}%
          </div>
          <div className="text-[11px] text-blue-800 font-semibold pt-1">Regional Average</div>
        </div>
      </div>

      {/* Main Command Map Area */}
      <div className="bg-cream-card rounded-3xl p-6 border border-cream-border shadow-cream-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <span className="font-heading text-sm font-bold text-cream-text flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-lane-green" />
            Live Tactical Grid (Click signals or ambulances to inspect & control)
          </span>
          <span className="text-xs text-cream-muted font-mono">
            10 Virtual Signals • 5 Trauma Centers • GPS Fleet Tracking
          </span>
        </div>

        <MapComponent
          ambulances={ambulances}
          signals={signals}
          hospitals={hospitals}
          activeTrip={activeTrips[0] || null}
          onSelectSignal={(sig) => setSelectedSignal(sig)}
          height="560px"
        />
      </div>

      {/* Signal Management & Manual Controls Panel with spacious gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Signal Roster Table with generous cell padding */}
        <div className="lg:col-span-8 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex items-center justify-between border-b border-cream-border pb-4">
            <span className="font-heading text-sm font-bold text-cream-text flex items-center gap-2">
              <Sliders className="w-4 h-4 text-lane-green" />
              VIRTUAL TRAFFIC SIGNALS ROSTER
            </span>
            <span className="text-xs text-cream-muted">
              Select an intersection for live command
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-bg text-cream-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Signal Name</th>
                  <th className="py-3.5 px-4">Node ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Approaching Vehicle</th>
                  <th className="py-3.5 px-4">Distance</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {signals.map((sig) => {
                  const isEmGreen = sig.status === 'EMERGENCY_GREEN';
                  const isRed = sig.status === 'RED' || sig.status === 'HOLD';
                  return (
                    <tr
                      key={sig.id}
                      onClick={() => setSelectedSignal(sig)}
                      className={`cursor-pointer transition-colors ${
                        selectedSignal?.id === sig.id
                          ? 'bg-emerald-50/80 font-semibold'
                          : 'hover:bg-cream-bg/60'
                      }`}
                    >
                      <td className="py-4 px-4 font-heading font-bold text-cream-text">{sig.name}</td>
                      <td className="py-4 px-4 font-mono text-[11px] text-cream-muted">{sig.intersection_id}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                            isEmGreen
                              ? 'bg-[#10B981] text-[#0A0D0B] animate-pulse'
                              : isRed
                              ? 'bg-red-700 text-white'
                              : sig.status === 'YELLOW'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {sig.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        {sig.approaching_ambulance_number ? (
                          <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            🚨 {sig.approaching_ambulance_number}
                          </span>
                        ) : (
                          <span className="text-cream-muted">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-cream-muted">
                        {sig.distance_to_signal ? `${Math.round(sig.distance_to_signal)} m` : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSignal(sig);
                          }}
                          className="text-xs font-bold text-lane-green underline hover:text-lane-dark"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Signal Manual Override Controller with spacious buttons */}
        <div className="lg:col-span-4 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-cream-border pb-4 mb-4">
              <span className="font-heading text-sm font-bold text-cream-text flex items-center gap-2">
                <Power className="w-4 h-4 text-lane-danger" />
                MANUAL CONTROLLER
              </span>
              <span className="text-[10px] font-mono bg-red-50 text-red-900 border border-red-200 px-2.5 py-0.5 rounded-full font-bold">
                AUDITED ACTION
              </span>
            </div>

            {selectedSignal ? (
              <div className="space-y-5 text-xs">
                <div>
                  <div className="text-[11px] text-cream-muted uppercase font-bold">Selected Intersection:</div>
                  <div className="font-heading text-base font-black text-cream-text mt-0.5">{selectedSignal.name}</div>
                  <div className="text-xs text-cream-muted font-mono">{selectedSignal.intersection_id}</div>
                </div>

                <div className="p-4 bg-cream-bg rounded-2xl border border-cream-border space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream-muted">Current Mode:</span>
                    <span className="font-extrabold text-cream-text">{selectedSignal.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-muted">Corridor Preemption:</span>
                    <span className="font-bold text-emerald-800">
                      {selectedSignal.emergency_corridor_active ? 'PREEMPTION ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-muted">Cycle Duration:</span>
                    <span className="font-mono text-cream-text">{selectedSignal.cycle_time_seconds}s Standard</span>
                  </div>
                </div>

                {/* Override Action Buttons with generous height and padding */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-cream-muted uppercase tracking-wider">Execute Manual Command:</div>

                  <button
                    onClick={() => handleOverride('EMERGENCY_GREEN')}
                    disabled={overrideLoading}
                    className="w-full py-3.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <span>🟢 FORCE EMERGENCY GREEN</span>
                  </button>

                  <button
                    onClick={() => handleOverride('HOLD')}
                    disabled={overrideLoading}
                    className="w-full py-3.5 bg-[#B94A48] hover:bg-red-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>🔴 COMMAND ALL-RED HOLD</span>
                  </button>

                  <button
                    onClick={() => handleOverride('NORMAL')}
                    disabled={overrideLoading}
                    className="w-full py-3.5 bg-cream-bg text-cream-text border border-cream-border hover:bg-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <span>🔄 RESTORE AUTOMATIC CYCLE</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-cream-muted leading-relaxed">
                Click any signal from the map or roster table to view status and execute manual corridor overrides.
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <b>Safety Notice:</b> All manual signal overrides are registered in the tamper-evident audit log with your Officer ID.
          </div>
        </div>
      </div>
    </div>
  );
};
