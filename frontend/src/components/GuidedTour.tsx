import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Play, MapPin, GitMerge, BarChart3, Siren, CheckCircle } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: { label: string; path: string };
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '🚑 Welcome to LifeLane AI',
    description:
      'This is an AI-powered Emergency Vehicle Traffic Preemption system. It clears traffic signals automatically when an ambulance is dispatched, saving critical minutes.',
    icon: <Siren className="w-8 h-8 text-[#10B981]" />,
  },
  {
    title: '👤 Step 1 — Driver Dispatches Emergency',
    description:
      'A verified ambulance driver logs in, selects emergency type (Cardiac, Trauma, etc.) and severity. The AI recommends the best hospital and starts clearing traffic signals along the route.',
    icon: <Play className="w-8 h-8 text-amber-500" />,
    action: { label: 'Open Driver Dashboard', path: '/driver' },
  },
  {
    title: '🗺️ Step 2 — Traffic Command Center',
    description:
      'Traffic officers see all active ambulances on a live map. Signals along the route turn green automatically. Officers can also manually override signals during emergencies.',
    icon: <MapPin className="w-8 h-8 text-blue-500" />,
    action: { label: 'Open Traffic Command', path: '/traffic' },
  },
  {
    title: '⚡ Step 3 — Conflict Resolution Lab',
    description:
      'When 2 ambulances reach the same intersection, our priority algorithm instantly decides who goes first based on severity, ETA, and emergency type — preventing dangerous deadlocks.',
    icon: <GitMerge className="w-8 h-8 text-purple-500" />,
    action: { label: 'Open Conflict Lab', path: '/conflict-demo' },
  },
  {
    title: '🏥 Step 4 — Hospital Gets Notified',
    description:
      'The hospital dashboard shows the incoming patient\'s condition, blood type, and ETA in real time. AWS Bedrock AI generates a triage priority score so doctors are ready on arrival.',
    icon: <Siren className="w-8 h-8 text-rose-500" />,
    action: { label: 'Open Hospital Dashboard', path: '/hospital' },
  },
  {
    title: '📊 Step 5 — Analytics & Impact',
    description:
      'After the emergency, detailed analytics show time saved, signals preempted, and hospital performance. Reports can be exported as PDF/CSV or archived to Amazon S3.',
    icon: <BarChart3 className="w-8 h-8 text-[#10B981]" />,
    action: { label: 'View Analytics', path: '/analytics' },
  },
  {
    title: '✅ Demo Complete!',
    description:
      'You\'ve seen the full LifeLane AI workflow — from dispatch to hospital readiness. Every second saved could be a life saved. Thank you for exploring!',
    icon: <CheckCircle className="w-8 h-8 text-[#10B981]" />,
  },
];

interface GuidedTourProps {
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isLast) setStep((s) => s + 1);
      if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, isLast, onClose]);

  const handleAction = () => {
    if (current.action) navigate(current.action.path);
    if (!isLast) setStep((s) => s + 1);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-tour-pop">
        <div className="bg-gradient-to-br from-[#0A0D0B] to-[#111827] border border-[#10B981]/40 rounded-3xl shadow-2xl shadow-[#10B981]/20 overflow-hidden">

          {/* Header bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
            <span className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
              🎯 Guided Demo Tour
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-500"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-5 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                {current.icon}
              </div>
            </div>

            {/* Title */}
            <h2 className="font-heading text-xl font-black text-white leading-tight">
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-300 leading-relaxed">
              {current.description}
            </p>

            {/* Step dots */}
            <div className="flex justify-center gap-2 pt-1">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 bg-[#10B981]'
                      : i < step
                      ? 'w-2 bg-[#10B981]/50'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-8 pb-8 flex items-center gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex-1" />

            {current.action && (
              <button
                onClick={() => navigate(current.action!.path)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/10 transition-all"
              >
                {current.action.label} ↗
              </button>
            )}

            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] transition-all shadow-lg shadow-[#10B981]/30"
            >
              {isLast ? 'Finish Tour' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-[10px] text-gray-600 pb-4">
            Press ← → arrow keys to navigate · ESC to close
          </p>
        </div>
      </div>
    </div>
  );
};
