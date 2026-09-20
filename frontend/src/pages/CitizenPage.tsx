import React, { useState, useEffect } from 'react';
import { tripService, signalService, hospitalService } from '../services/api';
import { Trip, TrafficSignal, Hospital } from '../types';
import { MapComponent } from '../components/MapComponent';
import { Siren, ShieldAlert, AlertTriangle, Radio, Navigation, CheckCircle2 } from 'lucide-react';

export const CitizenPage: React.FC = () => {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsData, sigsData, hospsData] = await Promise.all([
          tripService.getActive(),
          signalService.list(),
          hospitalService.list(),
        ]);
        setActiveTrips(tripsData);
        setSignals(sigsData);
        setHospitals(hospsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeTrip = activeTrips[0] || null;

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Title & Awareness Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-[#B94A48] font-black text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Public Roadway Emergency Awareness</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
              Active Emergency Corridor Broadcast
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-1">
              Live route broadcast for civilian motorists and pedestrians. Please yield right-of-way to emergency corridors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-amber-50 text-amber-900 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>PROTECTED PUBLIC BROADCAST</span>
          </div>
        </div>
      </div>

      {/* Live Warning Banner with generous padding */}
      {activeTrip ? (
        <div className="bg-gradient-to-r from-[#B94A48] to-[#963735] text-white rounded-3xl p-8 shadow-cream-lg border-2 border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-inner animate-bounce flex-shrink-0">
                🚨
              </div>
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-amber-200">
                  CRITICAL TRANSIT IN PROGRESS
                </div>
                <div className="font-heading text-2xl md:text-3xl font-black">
                  EMERGENCY VEHICLE APPROACHING — PLEASE GIVE WAY
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Motorists traveling on the designated corridor should safely pull over to the left and keep intersections clear.
                </p>
              </div>
            </div>

            <div className="bg-black/25 p-5 rounded-2xl border border-white/20 text-xs min-w-[280px] space-y-3">
              <div className="flex justify-between">
                <span className="text-white/75">Transit Route:</span>
                <span className="font-heading font-extrabold text-amber-200">
                  Corridor → {activeTrip.hospital_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/75">Estimated Arrival:</span>
                <span className="font-extrabold text-white font-mono text-sm">{activeTrip.eta_minutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/75">Distance Remaining:</span>
                <span className="font-extrabold text-white font-mono text-sm">{activeTrip.distance_remaining_km} km</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 text-emerald-950 rounded-3xl p-8 border border-emerald-300 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-200/80 flex items-center justify-center text-3xl flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-emerald-800" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-emerald-900">All Corridors Clear</h3>
            <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
              There are currently no active high-priority emergency corridors on this district grid. Traffic signals are operating under normal cycling.
            </p>
          </div>
        </div>
      )}

      {/* Map View with generous padding */}
      <div className="bg-cream-card rounded-3xl p-6 border border-cream-border shadow-cream-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs font-bold text-cream-text">
            <Navigation className="w-4 h-4 text-lane-green" />
            <span className="font-heading text-sm">Live Public Roadway Map (De-Identified)</span>
          </div>
          <div className="text-xs text-cream-muted">
            * Medical and patient details are de-identified for citizen privacy compliance
          </div>
        </div>

        <MapComponent
          ambulances={activeTrip ? [{
            id: activeTrip.ambulance_id,
            ambulance_number: 'EMERGENCY UNIT',
            status: 'busy',
            current_location: activeTrip.current_location,
            speed: activeTrip.speed_kmh || 55,
            heading: 90
          }] : []}
          signals={signals}
          hospitals={hospitals}
          activeTrip={activeTrip}
          height="500px"
        />
      </div>
    </div>
  );
};
