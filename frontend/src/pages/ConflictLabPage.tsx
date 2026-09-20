import React from 'react';
import { ConflictVisualizer } from '../components/ConflictVisualizer';
import { GitMerge, Compass, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export const ConflictLabPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-lane-gold font-extrabold text-xs uppercase tracking-wider">
              <GitMerge className="w-4 h-4" />
              <span>Core Innovation Demonstration</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
              Multi-Ambulance Conflict Resolution Lab
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-1">
              Visual simulation verifying cross-directional arrival, 30-second conflict window detection, and weighted priority arbitration.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ARBITRATION ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Visualizer */}
      <ConflictVisualizer />

      {/* Innovation Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-sm space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-black text-lane-dark uppercase">
            <Compass className="w-5 h-5 text-lane-green" />
            <span className="font-heading font-extrabold text-sm">1. Directional Geometry</span>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed">
            The system tracks GPS headings and trajectory angles (North-to-South vs East-to-West) to verify whether intersecting trajectories represent a genuine physical collision hazard.
          </p>
        </div>

        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-sm space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-black text-lane-dark uppercase">
            <Cpu className="w-5 h-5 text-lane-gold" />
            <span className="font-heading font-extrabold text-sm">2. Weighted Formula</span>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed font-mono text-[11px] bg-cream-bg p-3 rounded-xl border border-cream-border">
            Score = (Severity × 0.40) + (ETA × 0.30) + (Distance × 0.20) + (Hospital × 0.10). Normalized from 0 to 100 for mathematical transparency.
          </p>
        </div>

        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-sm space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-black text-lane-dark uppercase">
            <ShieldAlert className="w-5 h-5 text-lane-danger" />
            <span className="font-heading font-extrabold text-sm">3. Sequential Queue</span>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed">
            The held vehicle does not wait for a full cycle. The moment the primary ambulance clears the intersection perimeter, virtual green is immediately handed over to the queue.
          </p>
        </div>
      </div>
    </div>
  );
};
