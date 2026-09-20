import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/api';
import { Trip } from '../types';
import { GuidedTour } from '../components/GuidedTour';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  Siren,
  ShieldAlert,
  ArrowRight,
  Radio,
  Zap,
  Clock,
  Hospital,
  Sliders,
  CheckCircle2,
  Users,
  Compass,
  Key,
  ShieldCheck,
  Activity,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, getRoleRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    tripService.getActive().then(setActiveTrips).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0A0D0B] flex flex-col relative overflow-hidden">
      {/* Guided Tour Modal */}
      {showTour && <GuidedTour onClose={() => setShowTour(false)} />}
      {/* Subtle Ambient Radial Glow in the background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#10B981]/10 via-[#34D399]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Citizen Public Safety Alert Banner if an ambulance is active with spacious padding */}
      {activeTrips.length > 0 && (
        <div className="bg-[#DC2626] text-white py-4 px-6 shadow-md sticky top-20 z-40 animate-in fade-in">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="p-3 bg-white/20 rounded-2xl animate-bounce">
                <Siren className="w-6 h-6 text-white" />
              </span>
              <div>
                <div className="font-heading font-extrabold text-base tracking-wide flex items-center gap-2">
                  <span>🚨 EMERGENCY VEHICLE APPROACHING — PLEASE YIELD CORRIDOR</span>
                  <span className="bg-white/20 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold">LIVE PRIORITY</span>
                </div>
                <div className="text-xs text-white/90 mt-0.5">
                  En Route to <span className="font-bold">{activeTrips[0].hospital_name}</span> (ETA: {activeTrips[0].eta_minutes} min)
                </div>
              </div>
            </div>
            <Link
              to="/citizen"
              className="bg-white text-[#DC2626] px-5 py-2.5 rounded-xl text-xs font-black shadow hover:bg-gray-100 transition-all flex-shrink-0"
            >
              View Live Route Awareness
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section with generous breathing room */}
      <section className="py-16 md:py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2.5 bg-[#10B981]/15 border border-[#10B981]/30 px-5 py-2 rounded-full text-xs font-black text-[#10B981] shadow-sm">
            <Radio className="w-4 h-4 text-[#10B981] animate-pulse" />
            <span>AI-Powered Emergency Preemption & Multi-Ambulance Conflict Resolution</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-[#0A0D0B] leading-[1.08]">
            Clearing Paths.{' '}
            <span className="text-[#10B981] underline decoration-[#34D399] decoration-wavy decoration-3 underline-offset-8">
              Saving Lives.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            LifeLane AI dynamically preempts virtual traffic signals, resolves multi-vehicle intersection conflicts, and recommends trauma-ready hospitals in real time.
          </p>

          {/* Call to action buttons with generous padding */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setShowTour(true)}
              id="start-guided-tour-btn"
              className="px-8 py-4 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-2xl font-heading font-black text-sm shadow-lg shadow-[#10B981]/25 flex items-center gap-2.5 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
              <span>Start Guided Demo Tour</span>
            </button>
            <Link
              to="/demo"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-gray-900 border border-gray-300 rounded-2xl font-heading font-bold text-sm shadow-sm transition-all hover:border-[#10B981]"
            >
              <span>Explore Demo Scenarios</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/conflict-demo"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-gray-900 border border-gray-300 rounded-2xl font-heading font-bold text-sm shadow-sm transition-all hover:border-[#10B981]"
            >
              <span>Conflict Resolution Lab</span>
            </Link>
          </div>
        </div>

        {/* Classy Hero 3D Corridor Visual Showcase with Floating Telemetry Badges */}
        <div className="relative mt-14 sm:mt-20 mx-auto max-w-5xl">
          {/* Ambient Background Glow Behind Image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#10B981]/25 via-[#34D399]/20 to-[#10B981]/25 rounded-3xl blur-2xl opacity-75 -z-10 animate-soft-glow" />

          {/* Tactical 3D Mockup Container */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-[#10B981]/50 shadow-2xl bg-[#0A0D0B] group">
            {/* Image */}
            <img
              src="/hero_corridor.jpg"
              alt="Smart City Emergency Response Corridor 3D Visualization"
              className="w-full h-auto object-cover transform group-hover:scale-[1.015] transition-transform duration-700"
            />

            {/* Subtle Light Sheen passing across image */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan-sheen" />
            </div>

            {/* Floating Glassmorphism Telemetry Badge 1: Top Left */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 glass-badge px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float-slow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
              </span>
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-500">Live Preemption Active</div>
                <div className="font-heading text-xs font-black text-[#0A0D0B]">Wave 5/5 Green Corridors Cleared</div>
              </div>
            </div>

            {/* Floating Glassmorphism Telemetry Badge 2: Top Right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 glass-badge px-4 py-2.5 rounded-2xl shadow-xl hidden sm:flex items-center gap-2.5 animate-float-delayed">
              <div className="p-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-500">Conflict Arbitration</div>
                <div className="font-heading text-xs font-black text-[#0A0D0B]">0 Collision Risks • Priority AM-744</div>
              </div>
            </div>

            {/* Floating Glassmorphism Telemetry Badge 3: Bottom Left */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 glass-badge px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-float-delayed">
              <div className="p-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981]">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-500">Emergency Transit Advantage</div>
                <div className="font-heading text-xs font-black text-[#10B981]">4.2 Min Saved via Green Waves</div>
              </div>
            </div>

            {/* Bottom Dark HUD Bar Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 sm:p-5 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider">LIFELANE AI • URBAN TACTICAL PREEMPTION ENGINE</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-gray-300">
                <span>GEO-RADIUS: 500m</span>
                <span>LAT: 12.9716° N</span>
                <span className="text-[#10B981] font-bold">STATUS: NOMINAL</span>
              </div>
            </div>
          </div>

          {/* Animated Performance Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:border-[#10B981]/60 transition-colors text-center">
              <div className="font-heading text-2xl sm:text-3xl font-black text-[#0A0D0B]">
                <AnimatedCounter target={98.4} decimals={1} suffix="%" />
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">Preemption Accuracy</div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:border-[#10B981]/60 transition-colors text-center">
              <div className="font-heading text-2xl sm:text-3xl font-black text-[#10B981]">
                &lt; <AnimatedCounter target={1.2} decimals={1} suffix="s" />
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">Conflict Resolution</div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:border-[#10B981]/60 transition-colors text-center">
              <div className="font-heading text-2xl sm:text-3xl font-black text-[#0A0D0B]">
                <AnimatedCounter target={42} suffix="%" />
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">Transit Time Saved</div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:border-[#10B981]/60 transition-colors text-center">
              <div className="font-heading text-2xl sm:text-3xl font-black text-[#10B981]">
                <AnimatedCounter target={100} suffix="%" />
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">Intersection Safety</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Dashboards Quick Access Grid with spacious padding */}
      <section className="py-20 bg-slate-50/80 border-y border-gray-200 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-heading text-3xl font-black text-gray-900">Role-Based Command Portals</h2>
            <p className="text-sm text-gray-500">Select your verified stakeholder console or explore simulated live feeds</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Driver */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#10B981] hover:-translate-y-1.5 transition-all duration-300 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  🚑
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">Ambulance Driver</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  GPS & simulation navigation, smart hospital finder, live speed telemetry, and route deviation alerts.
                </p>
              </div>
              <Link
                to="/driver"
                className="w-full py-3 bg-[#0A0D0B] hover:bg-[#10B981] hover:text-[#0A0D0B] text-white rounded-xl text-xs font-black text-center transition-all shadow-sm"
              >
                Launch Cockpit
              </Link>
            </div>

            {/* Traffic Officer */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#10B981] hover:-translate-y-1.5 transition-all duration-300 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  🚦
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">Traffic Control Officer</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Live tactical map command center, intersection signal status, conflict arbitration, and manual overrides.
                </p>
              </div>
              <Link
                to="/traffic"
                className="w-full py-3 bg-[#0A0D0B] hover:bg-[#10B981] hover:text-[#0A0D0B] text-white rounded-xl text-xs font-black text-center transition-all shadow-sm"
              >
                Command Center
              </Link>
            </div>

            {/* Hospital Admin */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#10B981] hover:-translate-y-1.5 transition-all duration-300 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  🏥
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">Hospital Administrator</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Real-time bed, ICU, and ventilator capacity management with incoming trauma triage and bay preparedness.
                </p>
              </div>
              <Link
                to="/hospital"
                className="w-full py-3 bg-[#0A0D0B] hover:bg-[#10B981] hover:text-[#0A0D0B] text-white rounded-xl text-xs font-black text-center transition-all shadow-sm"
              >
                Hospital Dashboard
              </Link>
            </div>

            {/* System Admin */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#10B981] hover:-translate-y-1.5 transition-all duration-300 group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  👑
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">System Administrator</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  User accounts management, fleet registry, virtual infrastructure signals, and immutable audit trails.
                </p>
              </div>
              <Link
                to="/admin"
                className="w-full py-3 bg-[#0A0D0B] hover:bg-[#10B981] hover:text-[#0A0D0B] text-white rounded-xl text-xs font-black text-center transition-all shadow-sm"
              >
                Admin Console
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Classy Showcase Section: Clinical Trauma Radar & Inbound Triage */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="bg-[#0A0D0B] text-white rounded-3xl p-8 sm:p-12 lg:p-16 border-2 border-[#10B981]/40 shadow-2xl relative overflow-hidden">
          {/* Subtle light emerald radial glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#10B981]/20 border border-[#10B981]/40 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                INTELLIGENT CLINICAL RADAR
              </div>

              <h2 className="font-heading text-3xl sm:text-4xl font-black leading-tight text-white">
                Pre-Arrival Trauma Readiness & AI Clinical Triage
              </h2>

              <p className="text-sm text-gray-300 leading-relaxed">
                Emergency care starts miles before hospital arrival. LifeLane streams real-time patient acuity, condition severity, and telemetry to destination trauma centers to guarantee vacant resuscitation bays and mobilized specialist teams.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-sm text-white">Zero Turnaround Resuscitation Bays</div>
                    <div className="text-xs text-gray-400 mt-0.5">Automated triage triggers automated ER bay prep 6 minutes before ambulance arrival.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-sm text-white">Verified Specialist Dispatch</div>
                    <div className="text-xs text-gray-400 mt-0.5">On-duty cardiology, trauma surgeons, and neuro teams alerted in sync with incoming vehicle telemetry.</div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/hospital"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-xl font-heading font-black text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-105"
                >
                  <span>Explore Hospital Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 relative">
              {/* Tactical Display Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-700/80 shadow-2xl group">
                <img
                  src="/emergency_triage_flow.jpg"
                  alt="AI Trauma Readiness and Telemetry Interface"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-gray-300">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                    TRAUMA TEAM: DISPATCHED
                  </span>
                  <span className="text-[#10B981] font-bold">READY (4 BAYS VACANT)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Highlights with spacious layout */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-heading text-3xl font-black text-gray-900">Core System Architecture</h2>
          <p className="text-sm text-gray-500">Purpose-built for zero-delay response and complete operational transparency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-extrabold text-lg text-gray-900">500m Green Corridor Geofence</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Virtual signals automatically transition to EMERGENCY GREEN when an active ambulance enters the 500-meter corridor, restoring standard cycling immediately upon vehicle passage.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-extrabold text-lg text-gray-900">Multi-Ambulance Conflict Engine</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              When multiple ambulances arrive at the same intersection within a 30-second window, our weighted algorithm evaluates severity, ETA, distance, and hospital readiness to arbitrate safely.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-inner">
              <Hospital className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-extrabold text-lg text-gray-900">Smart Trauma Recommendation</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Matches patient emergency condition (Cardiac, Stroke, Trauma) with real-time bed and specialist availability, ensuring the ambulance routes to the most prepared facility.
            </p>
          </div>
        </div>
      </section>

      {/* Footer with spacious layout */}
      <footer className="mt-auto bg-[#0A0D0B] text-gray-400 py-10 px-6 sm:px-8 border-t border-gray-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-heading font-bold text-sm text-white">LifeLane AI Prototype</div>
            <p className="text-[11px] text-gray-400">Intelligent Ambulance Priority & Virtual Traffic Management</p>
          </div>
          <div className="text-[11px] text-gray-500 text-center sm:text-right">
            Software Simulation & Virtual Preemption • Compatible with Mapbox, Google Maps & OpenStreetMap
          </div>
        </div>
      </footer>
    </div>
  );
};
