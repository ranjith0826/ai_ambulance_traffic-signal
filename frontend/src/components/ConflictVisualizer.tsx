import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FastForward,
  Cpu,
  ArrowDown,
  ArrowRight,
  Info,
  Layers
} from 'lucide-react';

export const ConflictVisualizer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 6) {
            setIsPlaying(false);
            return 6;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentStep(1);
  };

  const ambA = {
    number: 'KA-01-EA-1001 (A)',
    direction: 'North → South',
    severity: 'Critical (100)',
    eta: currentStep === 1 ? '18s' : currentStep <= 3 ? '12s' : '0s (Cleared)',
    dist: currentStep === 1 ? '280m' : currentStep === 2 ? '190m' : currentStep === 3 ? '80m' : 'Crossed',
    score: 92.4,
    breakdown: '100*0.40(40) + 94*0.30(28.2) + 86*0.20(17.2) + 70*0.10(7.0) = 92.4',
    signal: currentStep >= 3 && currentStep < 5 ? 'EMERGENCY_GREEN' : currentStep >= 5 ? 'PASSED' : 'APPROACHING'
  };

  const ambB = {
    number: 'KA-04-MB-2045 (B)',
    direction: 'East → West',
    severity: 'High (75)',
    eta: currentStep === 1 ? '21s' : currentStep <= 4 ? '15s (Queued)' : '0s (Cleared)',
    dist: currentStep === 1 ? '320m' : currentStep <= 4 ? '110m (Holding)' : 'Crossed',
    score: 78.6,
    breakdown: '75*0.40(30) + 93*0.30(27.9) + 84*0.20(16.8) + 39*0.10(3.9) = 78.6',
    signal: currentStep === 3 || currentStep === 4 ? 'HOLD (RED)' : currentStep === 5 ? 'EMERGENCY_GREEN' : currentStep === 6 ? 'PASSED' : 'APPROACHING'
  };

  return (
    <div className="bg-cream-card rounded-3xl border border-cream-border p-8 shadow-cream-md space-y-8">
      {/* Header & Controls with generous spacing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cream-border">
        <div>
          <div className="flex items-center gap-2.5 text-lane-danger font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Multi-Ambulance Directional Conflict Resolution</span>
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-black text-cream-text mt-2">
            Central Junction Virtual Intersection Simulation
          </h2>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            Demonstrating priority arbitration when multiple ambulances arrive within the 30-second conflict window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-cream-sm transition-all ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-lane-green text-cream-card hover:bg-lane-dark'
            }`}
          >
            {isPlaying ? (
              <>Pause Simulation</>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
          <button
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            disabled={currentStep >= 6}
            className="px-4 py-3 bg-cream-bg text-cream-text border border-cream-border rounded-2xl text-xs font-bold hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FastForward className="w-4 h-4" />
            Next Step
          </button>
          <button
            onClick={resetSimulation}
            className="px-4 py-3 bg-cream-bg text-cream-muted border border-cream-border rounded-2xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Progress Timeline Stepper with generous padding */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { step: 1, title: 'Approach Detected' },
          { step: 2, title: 'Priority Scoring' },
          { step: 3, title: 'A Granted / B Hold' },
          { step: 4, title: 'A Clears Junction' },
          { step: 5, title: 'B Granted Green' },
          { step: 6, title: 'Normal Cycle' },
        ].map((item) => (
          <div
            key={item.step}
            onClick={() => setCurrentStep(item.step)}
            className={`cursor-pointer text-center p-3 rounded-2xl border text-xs transition-all ${
              currentStep === item.step
                ? 'bg-lane-green text-cream-card border-lane-green font-bold shadow-cream-sm'
                : currentStep > item.step
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                : 'bg-cream-bg text-cream-muted border-cream-border opacity-70'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider font-bold">Step {item.step}</div>
            <div className="truncate font-heading font-semibold mt-1">{item.title}</div>
          </div>
        ))}
      </div>

      {/* Visual Intersection Grid with generous gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-4">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-7 bg-slate-100 rounded-3xl p-8 relative min-h-[420px] flex items-center justify-center border border-gray-200 overflow-hidden shadow-inner">
          <div className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-gray-500 border border-gray-200 shadow-sm">
            N ↑
          </div>

          {/* Vertical Road (North - South) */}
          <div className="absolute w-32 h-full bg-[#0F172A] border-x-4 border-dashed border-emerald-400/40 flex flex-col justify-between items-center py-4">
            <div className="text-[11px] text-emerald-300/80 font-mono tracking-widest font-bold">MG ROAD (N)</div>
            <div className="text-[11px] text-emerald-300/80 font-mono tracking-widest font-bold">RESIDENCY (S)</div>
          </div>

          {/* Horizontal Road (East - West) */}
          <div className="absolute h-32 w-full bg-[#0F172A] border-y-4 border-dashed border-emerald-400/40 flex justify-between items-center px-6">
            <div className="text-[11px] text-emerald-300/80 font-mono tracking-widest font-bold">BRIGADE (W)</div>
            <div className="text-[11px] text-emerald-300/80 font-mono tracking-widest font-bold">AIRPORT RD (E)</div>
          </div>

          {/* Central Intersection Square */}
          <div className="relative w-36 h-36 bg-[#0A0D0B] rounded-2xl border-2 border-dashed border-[#10B981]/90 flex flex-col items-center justify-center text-center p-3 z-10 shadow-2xl">
            <div className="font-heading text-xs font-bold text-white uppercase">Central Junction</div>
            <div className="text-[10px] text-[#10B981] font-mono mt-0.5">30s Conflict Zone</div>
            {currentStep >= 3 && currentStep < 5 && (
              <span className="mt-2 bg-[#10B981] text-[#0A0D0B] text-[10px] px-2.5 py-0.5 rounded-full font-black animate-pulse">
                CORRIDOR: A PASSING
              </span>
            )}
            {currentStep === 5 && (
              <span className="mt-2 bg-[#10B981] text-[#0A0D0B] text-[10px] px-2.5 py-0.5 rounded-full font-black animate-pulse">
                CORRIDOR: B PASSING
              </span>
            )}
            {currentStep === 6 && (
              <span className="mt-2 bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                NORMAL CYCLE
              </span>
            )}
          </div>

          {/* Approach A: North to South Vehicle */}
          <div
            className={`absolute z-20 flex flex-col items-center transition-all duration-1000 ${
              currentStep === 1
                ? 'top-4'
                : currentStep === 2
                ? 'top-12'
                : currentStep === 3
                ? 'top-20'
                : currentStep === 4
                ? 'top-1/2 -translate-y-1/2'
                : 'bottom-4'
            }`}
          >
            {/* North Signal Light */}
            <div className="mb-2 flex items-center gap-1.5 bg-[#0A0D0B] px-3 py-1 rounded-full border border-gray-700 text-[10px] font-bold text-white shadow-md">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentStep >= 3 && currentStep <= 4
                    ? 'bg-emerald-400 animate-ping'
                    : currentStep === 5
                    ? 'bg-red-500'
                    : 'bg-emerald-500'
                }`}
              ></span>
              <span>{currentStep >= 3 && currentStep <= 4 ? '🟢 GREEN' : currentStep === 5 ? '🔴 RED' : '🟢'}</span>
            </div>

            {/* Ambulance A Vehicle Marker */}
            <div className="bg-red-700 text-white text-xs px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white animate-bounce">
              <span className="text-base">🚑</span>
              <div className="text-left">
                <div className="font-heading font-black text-xs">KA-01 (A)</div>
                <div className="text-[9px] font-mono opacity-90">Score: 92.4</div>
              </div>
            </div>
          </div>

          {/* Approach B: East to West Vehicle */}
          <div
            className={`absolute z-20 flex items-center transition-all duration-1000 ${
              currentStep === 1
                ? 'right-4'
                : currentStep === 2
                ? 'right-12'
                : currentStep <= 4
                ? 'right-24'
                : currentStep === 5
                ? 'left-1/2 -translate-x-1/2'
                : 'left-6'
            }`}
          >
            {/* Ambulance B Vehicle Marker */}
            <div
              className={`bg-orange-700 text-white text-xs px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white ${
                currentStep >= 3 && currentStep <= 4 ? 'opacity-90 ring-4 ring-red-500' : 'animate-bounce'
              }`}
            >
              <span className="text-base">🚑</span>
              <div className="text-left">
                <div className="font-heading font-black text-xs">KA-04 (B)</div>
                <div className="text-[9px] font-mono opacity-90">Score: 78.6</div>
              </div>
            </div>

            {/* East Signal Light */}
            <div className="ml-2 flex items-center gap-1.5 bg-[#0A0D0B] px-3 py-1 rounded-full border border-gray-700 text-[10px] font-bold text-white shadow-md">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentStep === 3 || currentStep === 4
                    ? 'bg-red-500 animate-pulse'
                    : currentStep === 5
                    ? 'bg-emerald-400 animate-ping'
                    : 'bg-emerald-500'
                }`}
              ></span>
              <span>{currentStep === 3 || currentStep === 4 ? '🔴 HOLD' : currentStep === 5 ? '🟢 GREEN' : '🟢'}</span>
            </div>
          </div>
        </div>

        {/* Priority Computation & Decision Panel with generous padding */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          {/* Decision Card */}
          <div className="bg-cream-bg rounded-3xl p-6 border border-cream-border shadow-cream-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <span className="font-heading text-xs font-bold text-lane-dark flex items-center gap-2">
                <Cpu className="w-4 h-4 text-lane-green" />
                SYSTEM DECISION ENGINE
              </span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full">
                Step {currentStep} of 6
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-cream-muted text-xs font-medium">Interlocking Intersection:</div>
                <div className="font-heading font-black text-sm text-cream-text">Central Junction (MG Road & Brigade)</div>
              </div>

              {/* Status Outcome */}
              <div className="p-4 rounded-2xl bg-cream-card border border-cream-border space-y-2">
                <div className="font-heading font-extrabold text-xs text-cream-text flex items-center gap-2">
                  {currentStep < 3 && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                  {currentStep >= 3 && <CheckCircle2 className="w-4 h-4 text-lane-green flex-shrink-0" />}
                  <span>
                    {currentStep === 1 && 'Conflict Detected: Overlapping 30s Arrival'}
                    {currentStep === 2 && 'Calculating Priority Scores in Real-Time'}
                    {currentStep === 3 && 'Ambulance A: EMERGENCY GREEN | Ambulance B: HOLD'}
                    {currentStep === 4 && 'Ambulance A Crossing Intersection Safely'}
                    {currentStep === 5 && 'Ambulance A Cleared → Ambulance B: EMERGENCY GREEN'}
                    {currentStep === 6 && 'Both Vehicles Cleared → Restoring Normal Signal Cycle'}
                  </span>
                </div>
                <p className="text-xs text-cream-muted leading-relaxed">
                  {currentStep < 3 &&
                    'Two ambulances detected heading towards Central Junction simultaneously from North and East directions within 30 seconds of each other.'}
                  {currentStep === 3 &&
                    'Ambulance A wins right-of-way due to Critical severity (100) vs High (75), producing Priority Score 92.4 vs 78.6. Virtual East approach held safely at RED.'}
                  {currentStep === 4 &&
                    'Ambulance A proceeds through green corridor without stopping. Ambulance B waits safely at intersection perimeter.'}
                  {currentStep === 5 &&
                    'Intersection sensor registers Ambulance A departure. Virtual traffic controller immediately toggles East approach to EMERGENCY GREEN for Ambulance B.'}
                  {currentStep === 6 &&
                    'All emergency vehicles have exited junction geofence. Traffic signal restores standard 60-second fixed-time cycling.'}
                </p>
              </div>
            </div>
          </div>

          {/* Priority Score Breakdown Cards */}
          <div className="space-y-3">
            {/* Ambulance A Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                currentStep >= 3 && currentStep <= 4
                  ? 'bg-emerald-50/90 border-emerald-400 shadow-cream-sm'
                  : 'bg-cream-card border-cream-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-heading font-extrabold text-xs text-cream-text flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  Ambulance A (KA-01-EA-1001)
                </div>
                <span className="text-xs font-black text-lane-green bg-emerald-100 px-2.5 py-0.5 rounded-full font-mono">
                  Score: 92.4
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-cream-muted font-medium mb-2">
                <div>Severity: <b className="text-red-700">Critical</b></div>
                <div>ETA: <b>18s</b></div>
                <div>Dist: <b>280m</b></div>
                <div>Hosp: <b>95%</b></div>
              </div>
              <div className="text-[10px] font-mono text-cream-muted bg-cream-bg px-3 py-1.5 rounded-xl border border-cream-border">
                Formula: (100*0.40) + (94*0.30) + (86*0.20) + (70*0.10) = 92.4
              </div>
            </div>

            {/* Ambulance B Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                currentStep === 5
                  ? 'bg-emerald-50/90 border-emerald-400 shadow-cream-sm'
                  : 'bg-cream-card border-cream-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-heading font-extrabold text-xs text-cream-text flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                  Ambulance B (KA-04-MB-2045)
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
                  Score: 78.6
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-cream-muted font-medium mb-2">
                <div>Severity: <b className="text-amber-700">High</b></div>
                <div>ETA: <b>21s</b></div>
                <div>Dist: <b>320m</b></div>
                <div>Hosp: <b>88%</b></div>
              </div>
              <div className="text-[10px] font-mono text-cream-muted bg-cream-bg px-3 py-1.5 rounded-xl border border-cream-border">
                Formula: (75*0.40) + (93*0.30) + (84*0.20) + (39*0.10) = 78.6
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
