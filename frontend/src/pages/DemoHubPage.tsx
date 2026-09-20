import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoService } from '../services/api';
import { WhatIfComparison } from '../components/WhatIfComparison';
import { ConflictVisualizer } from '../components/ConflictVisualizer';
import {
  Sparkles,
  Siren,
  GitMerge,
  Hospital as HospIcon,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

export const DemoHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<number>(1);
  const [scenario1Data, setScenario1Data] = useState<any>(null);
  const [scenario3Data, setScenario3Data] = useState<any>(null);

  const loadScenario1 = async () => {
    const data = await demoService.getScenario1();
    setScenario1Data(data);
    setActiveDemo(1);
  };

  const loadScenario3 = async () => {
    const data = await demoService.getScenario3();
    setScenario3Data(data);
    setActiveDemo(3);
  };

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Evaluator Demo Execution Suite</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
              Automated Scenario Demonstrator
            </h1>
            <p className="text-xs sm:text-sm text-cream-muted mt-1">
              Instantly test and inspect all 4 major prototype evaluation flows with one click.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-amber-50 text-amber-900 border border-amber-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
            <span>PRE-PROGRAMMED BENCHMARKS</span>
          </div>
        </div>
      </div>

      {/* 4 Demo Selector Tabs with generous padding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 1, title: 'DEMO 1: Single Ambulance', desc: '500m Green Corridor Preemption', icon: Siren, color: 'text-red-700' },
          { id: 2, title: 'DEMO 2: Cross Conflict', desc: 'Multi-Ambulance Priority Arbitration', icon: GitMerge, color: 'text-amber-700' },
          { id: 3, title: 'DEMO 3: Hospital Finder', desc: 'Smart Multi-Factor Facility Triage', icon: HospIcon, color: 'text-blue-700' },
          { id: 4, title: 'DEMO 4: Time Saved', desc: 'Side-by-Side What-If Analysis', icon: Clock, color: 'text-emerald-700' },
        ].map((d) => {
          const Icon = d.icon;
          const isSelected = activeDemo === d.id;
          return (
            <div
              key={d.id}
              onClick={() => {
                setActiveDemo(d.id);
                if (d.id === 1 && !scenario1Data) loadScenario1();
                if (d.id === 3 && !scenario3Data) loadScenario3();
              }}
              className={`cursor-pointer p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-lane-green text-cream-card border-lane-green shadow-cream-md scale-[1.02]'
                  : 'bg-cream-card text-cream-text border-cream-border hover:bg-slate-50 hover:shadow-cream-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-amber-300' : d.color}`} />
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-cream-bg'}`}>
                    SCENARIO #{d.id}
                  </span>
                </div>
                <div className="font-heading font-extrabold text-base">{d.title}</div>
                <div className={`text-xs mt-2 leading-relaxed ${isSelected ? 'text-cream-card/85' : 'text-cream-muted'}`}>
                  {d.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEMO 1 VIEW */}
      {activeDemo === 1 && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-border pb-6">
            <div>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">DEMO SCENARIO 1</span>
              <h2 className="font-heading text-2xl font-extrabold text-cream-text mt-1">
                Single Ambulance Automated Green Corridor Preemption
              </h2>
              <p className="text-xs sm:text-sm text-cream-muted mt-1">
                Ambulance initiates a Critical emergency trip. Signals along its route transition to EMERGENCY GREEN within 500m geofence.
              </p>
            </div>
            <button
              onClick={() => navigate('/driver')}
              className="px-6 py-3 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl text-xs font-bold flex items-center gap-2 shadow-cream-sm flex-shrink-0"
            >
              <span>Launch Live Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-2 text-xs shadow-cream-sm">
              <div className="text-[10px] text-cream-muted uppercase font-bold">1. Emergency Call</div>
              <div className="font-heading font-black text-sm text-cream-text">Ambulance KA-01-EA-1001</div>
              <div className="text-red-700 font-bold">Cardiac • Critical (Score 100)</div>
            </div>

            <div className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-2 text-xs shadow-cream-sm">
              <div className="text-[10px] text-cream-muted uppercase font-bold">2. Dynamic Route</div>
              <div className="font-heading font-black text-sm text-cream-text">Residency Rd → CityCare</div>
              <div className="text-cream-muted">Distance: 4.8 km (ETA: 6.2 min)</div>
            </div>

            <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-300 space-y-2 text-xs shadow-cream-sm">
              <div className="text-[10px] text-emerald-800 uppercase font-bold">3. 500m Geofence</div>
              <div className="font-heading font-black text-sm text-emerald-950">Signal Preempted</div>
              <div className="text-emerald-700 font-bold">EMERGENCY GREEN Active</div>
            </div>

            <div className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-2 text-xs shadow-cream-sm">
              <div className="text-[10px] text-cream-muted uppercase font-bold">4. Arrival & Reset</div>
              <div className="font-heading font-black text-sm text-cream-text">Safe Trauma Handover</div>
              <div className="text-lane-green font-bold">8.5 Minutes Saved</div>
            </div>
          </div>
        </div>
      )}

      {/* DEMO 2 VIEW */}
      {activeDemo === 2 && (
        <div className="space-y-6">
          <ConflictVisualizer />
        </div>
      )}

      {/* DEMO 3 VIEW */}
      {activeDemo === 3 && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex items-center justify-between border-b border-cream-border pb-6">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">DEMO SCENARIO 3</span>
              <h2 className="font-heading text-2xl font-extrabold text-cream-text mt-1">
                Smart Hospital Facility Recommendation Engine
              </h2>
              <p className="text-xs sm:text-sm text-cream-muted mt-1">
                Matches patient condition (Cardiac/Stroke/Trauma) with hospital distance, ICU capacity, and specialist readiness.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-50/90 rounded-3xl border-2 border-emerald-400 space-y-3 text-xs shadow-cream-sm">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-emerald-950">🏥 CityCare Super Specialty Hospital</span>
                <span className="bg-lane-green text-cream-card font-black text-[10px] px-3 py-1 rounded-full">
                  TOP MATCH (Score: 94.5)
                </span>
              </div>
              <div className="text-emerald-900 font-medium">84 Residency Road, Central District</div>
              <div className="grid grid-cols-3 gap-3 pt-3 text-xs border-t border-emerald-200">
                <div>Distance: <b>3.2 km</b></div>
                <div>ETA: <b>7 min</b></div>
                <div>ICU Beds: <b className="text-emerald-800">4 Available</b></div>
              </div>
              <div className="text-xs text-emerald-800 font-bold">
                Specialists: Cardiology, Intensive Care (Matched for Cardiac)
              </div>
            </div>

            <div className="p-6 bg-cream-bg rounded-3xl border border-cream-border space-y-3 text-xs shadow-cream-sm">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-base text-cream-text">🏥 Metro General Healthcare</span>
                <span className="text-cream-muted font-bold text-xs bg-white px-2.5 py-1 rounded-xl border border-gray-200">Alternative (Score: 71.0)</span>
              </div>
              <div className="text-cream-muted">90 Queens Way, North Gate</div>
              <div className="grid grid-cols-3 gap-3 pt-3 text-xs border-t border-cream-border">
                <div>Distance: <b>6.8 km</b></div>
                <div>ETA: <b>14 min</b></div>
                <div>ICU Beds: <b className="text-amber-700">1 Available</b></div>
              </div>
              <div className="text-xs text-cream-muted font-semibold">
                Specialists: General Medicine (No on-call Cardiology)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEMO 4 VIEW */}
      {activeDemo === 4 && (
        <div className="space-y-6">
          <WhatIfComparison initialDistanceKm={8.2} initialSignals={6} />
        </div>
      )}
    </div>
  );
};
