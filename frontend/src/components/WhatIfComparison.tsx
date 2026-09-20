import React, { useState } from 'react';
import { Sliders, Clock, TrendingUp, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface WhatIfProps {
  initialDistanceKm?: number;
  initialSignals?: number;
}

export const WhatIfComparison: React.FC<WhatIfProps> = ({
  initialDistanceKm = 7.5,
  initialSignals = 6,
}) => {
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm);
  const [signalsCount, setSignalsCount] = useState<number>(initialSignals);
  const [trafficLevel, setTrafficLevel] = useState<'MODERATE' | 'HIGH' | 'SEVERE'>('HIGH');

  // Calculations
  const signalWaitWithoutSec = signalsCount * 55;
  const signalWaitWithSec = signalsCount * 4;

  const speedWithout = trafficLevel === 'SEVERE' ? 20 : trafficLevel === 'HIGH' ? 28 : 36;
  const speedWith = trafficLevel === 'SEVERE' ? 44 : trafficLevel === 'HIGH' ? 50 : 58;

  const travelTimeWithoutSec = (distanceKm / speedWithout) * 3600;
  const travelTimeWithSec = (distanceKm / speedWith) * 3600;

  const totalTimeWithoutSec = travelTimeWithoutSec + signalWaitWithoutSec;
  const totalTimeWithSec = travelTimeWithSec + signalWaitWithSec;

  const timeSavedSec = Math.max(0, totalTimeWithoutSec - totalTimeWithSec);
  const timeSavedMinutes = Math.round((timeSavedSec / 60) * 10) / 10;
  const percentImprovement = Math.round((timeSavedSec / totalTimeWithoutSec) * 100);

  return (
    <div className="bg-cream-card rounded-3xl border border-cream-border p-8 shadow-cream-md space-y-8">
      {/* Title & Safety Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-border">
        <div>
          <div className="flex items-center gap-2.5 text-lane-gold font-extrabold text-xs uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Comparative Impact Engine</span>
          </div>
          <h3 className="font-heading text-2xl md:text-3xl font-black text-cream-text mt-2">
            What-If Emergency Transit Simulation
          </h3>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            Quantitative comparative analysis measuring simulated time saved and signal congestion reduction.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>SIMULATED IMPACT BENCHMARK</span>
        </div>
      </div>

      {/* Interactive Controls Bar with generous padding */}
      <div className="bg-cream-bg rounded-3xl p-6 border border-cream-border grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-cream-text">
            <span>Route Distance</span>
            <span className="text-lane-green font-mono font-bold text-sm">{distanceKm} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="20"
            step="0.5"
            value={distanceKm}
            onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
            className="w-full accent-lane-green cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-cream-text">
            <span>Intersections / Signals</span>
            <span className="text-lane-green font-mono font-bold text-sm">{signalsCount} signals</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={signalsCount}
            onChange={(e) => setSignalsCount(parseInt(e.target.value))}
            className="w-full accent-lane-green cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-cream-text">Traffic Congestion Density</div>
          <div className="flex gap-2.5">
            {(['MODERATE', 'HIGH', 'SEVERE'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTrafficLevel(lvl)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  trafficLevel === lvl
                    ? 'bg-lane-green text-cream-card shadow-cream-sm'
                    : 'bg-cream-card text-cream-muted border border-cream-border hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side by Side Comparison Cards with spacious padding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WITHOUT LifeLane AI */}
        <div className="bg-white/80 rounded-3xl p-8 border border-cream-border shadow-sm relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#B94A48]" />
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-extrabold uppercase tracking-wider text-lane-danger">
              Conventional Routing
            </span>
            <span className="text-xs font-mono bg-red-100 text-red-900 px-3 py-1 rounded-full font-bold">
              Without LifeLane AI
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="font-heading text-4xl font-black text-[#292722]">
                {Math.round(totalTimeWithoutSec / 60)} <span className="text-base font-normal text-cream-muted font-sans">minutes</span>
              </div>
              <div className="text-xs text-cream-muted font-medium mt-1">Estimated Total Transit Time</div>
            </div>

            <div className="pt-4 border-t border-cream-border/70 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-cream-muted">Signal Wait Delay:</span>
                <span className="font-bold text-red-700 font-mono">
                  {Math.round(signalWaitWithoutSec / 60)} min ({signalsCount} stops)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Average Moving Speed:</span>
                <span className="font-bold text-cream-text font-mono">{speedWithout} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Signal Status:</span>
                <span className="font-bold text-amber-700">Random Red Cycles</span>
              </div>
            </div>
          </div>
        </div>

        {/* WITH LifeLane AI */}
        <div className="bg-emerald-50/60 rounded-3xl p-8 border-2 border-emerald-500 shadow-cream-md relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#10B981]" />
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-extrabold uppercase tracking-wider text-lane-green flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-current" />
              Preemptive Dynamic Corridor
            </span>
            <span className="text-xs font-mono bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full font-bold">
              With LifeLane AI
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="font-heading text-4xl font-black text-lane-dark">
                {Math.round(totalTimeWithSec / 60)} <span className="text-base font-normal text-cream-muted font-sans">minutes</span>
              </div>
              <div className="text-xs text-lane-green font-bold mt-1">Priority Corridor Transit Time</div>
            </div>

            <div className="pt-4 border-t border-emerald-200/80 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-cream-muted">Signal Wait Delay:</span>
                <span className="font-bold text-[#10B981] font-mono">
                  {Math.round(signalWaitWithSec / 60 * 10) / 10} min (Green Waves)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Average Moving Speed:</span>
                <span className="font-bold text-cream-text font-mono">{speedWith} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream-muted">Conflict Arbitration:</span>
                <span className="font-bold text-[#10B981]">Automated Multi-Vehicle Resolution</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Banner with generous padding */}
      <div className="bg-[#0A0D0B] text-white rounded-3xl p-8 shadow-xl border border-[#10B981]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
            <Clock className="w-7 h-7 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#10B981]">
              Emergency Response Advantage
            </div>
            <div className="font-heading text-3xl sm:text-4xl font-black mt-0.5 text-white">
              {timeSavedMinutes} Minutes Saved
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="font-heading text-3xl sm:text-4xl font-black text-[#10B981] flex items-center gap-1.5 justify-end">
              <TrendingUp className="w-7 h-7" />
              {percentImprovement}%
            </div>
            <div className="text-xs text-gray-300 font-semibold mt-0.5">Faster Emergency Arrival</div>
          </div>
        </div>
      </div>
    </div>
  );
};
