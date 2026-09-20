import React from 'react';
import { WhatIfComparison } from '../components/WhatIfComparison';
import { SlidersHorizontal, TrendingUp, Clock, ShieldCheck, Zap } from 'lucide-react';

export const WhatIfPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-lane-gold font-extrabold text-xs uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Comparative Predictive Simulation</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
              What-If Transit Impact Analysis
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-1">
              Side-by-side evaluation contrasting conventional urban traffic delays against LifeLane AI preemptive corridors.
            </p>
          </div>

          <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold px-4 py-2 rounded-2xl shadow-sm">
            SIMULATED BENCHMARK
          </span>
        </div>
      </div>

      <WhatIfComparison initialDistanceKm={7.5} initialSignals={6} />
    </div>
  );
};
