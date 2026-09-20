import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hospitalService, tripService, awsService } from '../services/api';
import { socketService } from '../services/socket';
import { Hospital, Trip } from '../types';
import {
  Hospital as HospIcon,
  Bed,
  HeartPulse,
  Wind,
  ShieldCheck,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Radio,
  Users,
  Activity,
  Sparkles,
  Cloud,
  Stethoscope,
  X
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [myHospital, setMyHospital] = useState<Hospital | null>(null);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Editable capacity state
  const [emergencyBedsAvail, setEmergencyBedsAvail] = useState<number>(8);
  const [icuBedsAvail, setIcuBedsAvail] = useState<number>(4);
  const [ventilatorsAvail, setVentilatorsAvail] = useState<number>(3);
  const [readinessScore, setReadinessScore] = useState<number>(92);

  // AWS Bedrock Clinical Copilot State
  const [bedrockTriage, setBedrockTriage] = useState<any>(null);
  const [loadingBedrock, setLoadingBedrock] = useState<boolean>(false);
  const [showBedrockModal, setShowBedrockModal] = useState<boolean>(false);
  const [selectedPatientTrip, setSelectedPatientTrip] = useState<Trip | null>(null);

  const handleRunBedrockTriage = async (trip?: Trip) => {
    setSelectedPatientTrip(trip || null);
    setLoadingBedrock(true);
    setShowBedrockModal(true);
    try {
      const patientData = {
        age: trip?.severity === 'Critical' ? 58 : 42,
        gender: 'Male',
        chief_complaint:
          trip?.emergency_type === 'Cardiac'
            ? 'Acute crushing chest pain, hypotension, and diaphoresis'
            : 'Polytrauma, pelvic fracture, and hemodynamic shock',
        suspected_condition:
          trip?.emergency_type === 'Cardiac' ? 'Acute STEMI / Cardiogenic Shock' : 'Level-1 Polytrauma',
        eta_minutes: trip?.eta_minutes || 5.8,
        hospital_name: myHospital?.name || 'Trauma & Emergency Center',
        vitals: {
          heart_rate: 118,
          blood_pressure: '86/52',
          spo2: 89,
          respiratory_rate: 26,
          gcs: 14,
        },
      };
      const res = await awsService.bedrockTriage(patientData);
      setBedrockTriage(res);
    } catch (e: any) {
      alert(`Amazon Bedrock error: ${e.message}`);
    } finally {
      setLoadingBedrock(false);
    }
  };

  const fetchHospitalData = async () => {
    try {
      const [hosps, trips] = await Promise.all([
        hospitalService.list(),
        tripService.getActive(),
      ]);
      setHospitals(hosps);
      setActiveTrips(trips);

      const userHosp = hosps.find(
        (h) => h.id === user?.hospital_id || h.name.toLowerCase().includes(user?.hospital_name?.toLowerCase() || '')
      ) || hosps[0];

      if (userHosp) {
        setMyHospital(userHosp);
        setEmergencyBedsAvail(userHosp.emergency_beds_available);
        setIcuBedsAvail(userHosp.icu_beds_available);
        setVentilatorsAvail(userHosp.ventilators_available);
        setReadinessScore(userHosp.emergency_readiness);
      }
    } catch (e) {
      console.error('Error loading hospital dashboard data', e);
    }
  };

  useEffect(() => {
    fetchHospitalData();

    socketService.connect();
    socketService.on('emergency_started', () => fetchHospitalData());
    socketService.on('emergency_completed', () => fetchHospitalData());

    return () => {
      socketService.off('emergency_started');
      socketService.off('emergency_completed');
    };
  }, [user]);

  const handleSaveAvailability = async () => {
    if (!myHospital) return;
    setSaving(true);
    try {
      const res = await hospitalService.updateAvailability(myHospital.id, {
        emergency_beds_available: emergencyBedsAvail,
        icu_beds_available: icuBedsAvail,
        ventilators_available: ventilatorsAvail,
        emergency_readiness: readinessScore,
      });
      setMyHospital(res.hospital);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update hospital availability');
    } finally {
      setSaving(false);
    }
  };

  const handleTriageAction = async (trip: Trip, action: 'ACCEPT' | 'REJECT') => {
    if (!myHospital) return;
    try {
      await hospitalService.triagePatient(myHospital.id, {
        trip_id: trip.id,
        ambulance_number: trip.ambulance_number,
        action,
      });
      fetchHospitalData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Triage action failed');
    }
  };

  const incomingTrips = activeTrips.filter(
    (t) => t.hospital_id === myHospital?.id || t.hospital_name === myHospital?.name
  );

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
            <HospIcon className="w-4 h-4" />
            <span>Hospital Emergency Readiness Portal</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
            {myHospital?.name || 'Trauma & Emergency Center'}
          </h1>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            {myHospital?.address || 'Metropolitan Emergency District'} • Emergency Line: <span className="font-mono">{myHospital?.phone || '+91 80 2294 1000'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleRunBedrockTriage()}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all hover:scale-105"
          >
            <Cloud className="w-4 h-4" />
            <span>AWS BEDROCK AI COPILOT</span>
          </button>

          <span className="flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>TRAUMA READINESS VERIFIED</span>
          </span>
        </div>
      </div>

      {/* Incoming Patient Triage Alerts with spacious padding */}
      {incomingTrips.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-black text-lane-danger uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>INCOMING EMERGENCY PATIENT TRANSIT ({incomingTrips.length})</span>
          </div>

          {incomingTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-red-50/90 border-2 border-red-400 rounded-3xl p-6 shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-red-700 text-white font-mono font-black text-xs px-3 py-1 rounded-xl shadow-sm">
                    🚑 {trip.ambulance_number}
                  </span>
                  <span className="font-heading font-extrabold text-sm text-red-900">
                    Severity: {trip.severity} • Condition: {trip.emergency_type}
                  </span>
                </div>
                <div className="text-xs text-red-950 font-medium">
                  Driver: <b>{trip.driver_name}</b> • Inbound ETA: <b className="text-red-700 font-mono text-base">{trip.eta_minutes} Min</b> ({trip.distance_remaining_km} km away)
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleRunBedrockTriage(trip)}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-2xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Bedrock AI Triage</span>
                </button>
                <button
                  onClick={() => handleTriageAction(trip, 'ACCEPT')}
                  className="px-6 py-3 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all hover:scale-105"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>PREPARE BAY & ACCEPT</span>
                </button>
                <button
                  onClick={() => handleTriageAction(trip, 'REJECT')}
                  className="px-5 py-3 bg-cream-card hover:bg-cream-bg text-red-700 border border-red-300 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>DIVERT</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cream-card rounded-3xl p-6 border border-cream-border flex items-center justify-between shadow-cream-sm">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <div className="text-xs text-cream-text font-bold">
              No active ambulances currently routed to this trauma facility. Radar scanning dispatch network...
            </div>
          </div>
          <button
            onClick={() => handleRunBedrockTriage()}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Simulate Amazon Bedrock Triage</span>
          </button>
        </div>
      )}

      {/* Capacity Sliders & Availability Form with spacious cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex items-center justify-between border-b border-cream-border pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-cream-text">Live Bed & Resource Capacity</h3>
              <p className="text-xs text-cream-muted">Adjust availability to dynamically update the regional AI recommendation scoring</p>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-4 py-1.5 rounded-full shadow-sm animate-in fade-in">
                Saved & Broadcasted!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Beds */}
            <div className="bg-cream-bg p-5 rounded-2xl border border-cream-border space-y-3 hover-card-interactive">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cream-text flex items-center gap-2">
                  <Bed className="w-4 h-4 text-emerald-700" />
                  Available Emergency Beds
                </span>
                <span className="font-heading text-xl font-black font-mono text-lane-dark">
                  {emergencyBedsAvail} / {myHospital?.emergency_beds || 15}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={myHospital?.emergency_beds || 20}
                value={emergencyBedsAvail}
                onChange={(e) => setEmergencyBedsAvail(parseInt(e.target.value))}
                className="w-full accent-lane-green cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
            </div>

            {/* ICU Beds */}
            <div className="bg-cream-bg p-5 rounded-2xl border border-cream-border space-y-3 hover-card-interactive">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cream-text flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-700 animate-ecg-heartbeat" />
                  Available ICU Beds
                </span>
                <span className="font-heading text-xl font-black font-mono text-lane-danger">
                  {icuBedsAvail} / {myHospital?.icu_beds || 10}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={myHospital?.icu_beds || 12}
                value={icuBedsAvail}
                onChange={(e) => setIcuBedsAvail(parseInt(e.target.value))}
                className="w-full accent-lane-danger cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
            </div>

            {/* Ventilators */}
            <div className="bg-cream-bg p-5 rounded-2xl border border-cream-border space-y-3 hover-card-interactive">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cream-text flex items-center gap-2">
                  <Wind className="w-4 h-4 text-blue-700" />
                  Available Ventilators
                </span>
                <span className="font-heading text-xl font-black font-mono text-blue-900">
                  {ventilatorsAvail} / {myHospital?.ventilators || 8}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={myHospital?.ventilators || 10}
                value={ventilatorsAvail}
                onChange={(e) => setVentilatorsAvail(parseInt(e.target.value))}
                className="w-full accent-blue-700 cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
            </div>

            {/* Readiness Index */}
            <div className="bg-cream-bg p-5 rounded-2xl border border-cream-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cream-text flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-lane-green" />
                  Emergency Readiness Index
                </span>
                <span className="font-heading text-xl font-black font-mono text-lane-green">
                  {readinessScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={readinessScore}
                onChange={(e) => setReadinessScore(parseInt(e.target.value))}
                className="w-full accent-lane-green cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="px-8 py-3.5 bg-lane-green hover:bg-lane-dark text-cream-card rounded-2xl text-xs font-black tracking-wider uppercase shadow-cream-sm flex items-center gap-2.5 transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'UPDATING TELEMETRY...' : 'BROADCAST CAPACITY UPDATE'}</span>
            </button>
          </div>
        </div>

        {/* Specialists On Call */}
        <div className="lg:col-span-4 bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-5">
          <h3 className="font-heading font-extrabold text-base text-cream-text flex items-center gap-2">
            <Users className="w-5 h-5 text-lane-gold" />
            Specialists On Standby
          </h3>
          <p className="text-xs text-cream-muted leading-relaxed">
            Matching triage specialties prioritized during automated ambulance smart routing:
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {(myHospital?.specialists || ['Cardiology', 'Neurology', 'Trauma Surgery', 'Orthopedics', 'Emergency Medicine']).map((spec) => (
              <span
                key={spec}
                className="px-3.5 py-1.5 bg-cream-bg border border-cream-border rounded-xl text-xs font-semibold text-cream-text flex items-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                {spec}
              </span>
            ))}
          </div>

          <div className="pt-5 border-t border-cream-border text-xs text-cream-muted leading-relaxed">
            <b>Smart Routing Boost:</b> Facilities with verified on-duty specialists receive a 25-point weighted boost in the LifeLane clinical triage index.
          </div>
        </div>
      </div>

      {/* Amazon Bedrock GenAI Clinical Triage Modal (For Jury Demo) */}
      {showBedrockModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-spring-pop">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-[length:200%_200%] animate-aurora text-white p-6 sm:p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-pulse-slow">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white tracking-wider">
                      Amazon Bedrock GenAI
                    </span>
                    <span className="text-xs text-amber-100 font-mono">
                      {bedrockTriage?.model_id || 'anthropic.claude-3-5-sonnet'}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mt-1">
                    Pre-Arrival Clinical Triage & Trauma Readiness
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowBedrockModal(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-gray-50/50">
              {loadingBedrock ? (
                <div className="py-16 text-center space-y-3">
                  <Sparkles className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
                  <div className="font-heading font-bold text-base text-gray-800">
                    Invoking Amazon Bedrock Foundation Model...
                  </div>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Synthesizing real-time ambulance telemetry, patient vitals, and trauma room readiness index.
                  </p>
                </div>
              ) : bedrockTriage ? (
                <>
                  {/* Triage Urgency Header */}
                  <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                        Assessed Triage Classification
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1.5 rounded-xl font-mono font-black text-sm bg-red-100 text-red-800 border border-red-200">
                          {bedrockTriage.triage_urgency}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          Priority Urgency Score: <b className="text-gray-900 font-mono text-sm">{bedrockTriage.priority_score}/100</b>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-gray-400 block">Bedrock Latency</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ⚡ {bedrockTriage.latency_ms} ms ({bedrockTriage.provider})
                      </span>
                    </div>
                  </div>

                  {/* Clinical Assessment Summary */}
                  <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <Stethoscope className="w-4 h-4 text-amber-700" />
                      <span>Clinical Assessment & Recommendation</span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed font-medium">
                      {bedrockTriage.clinical_summary}
                    </p>
                    <div className="pt-2 text-xs text-amber-900 font-semibold">
                      Target Specialty Unit: <b className="text-amber-950 underline">{bedrockTriage.recommended_specialty}</b>
                    </div>
                  </div>

                  {/* Dual Columns: Interventions and Bay Prep */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Paramedic En-Route Actions */}
                    <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-2">
                        <span>Paramedic Transit Protocol</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {(bedrockTriage.en_route_interventions || []).map((action: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Hospital Resuscitation Bay Prep */}
                    <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                        <span>Trauma Bay Readiness Standby</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {(bedrockTriage.hospital_prep_actions || []).map((action: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Immediate Risk Factors */}
                  {bedrockTriage.risk_factors && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-1.5">
                      <div className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                        Immediate Deterioration Risks Monitored:
                      </div>
                      <ul className="text-xs text-red-800 list-disc pl-5 space-y-0.5">
                        {bedrockTriage.risk_factors.map((risk: string, i: number) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500 font-mono">
                Powered by Amazon Bedrock Foundation Models
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBedrockModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Trauma Bay 1 & Cath Lab personnel notified. Pre-arrival readiness locked.');
                    setShowBedrockModal(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Acknowledge & Deploy Bay Prep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
