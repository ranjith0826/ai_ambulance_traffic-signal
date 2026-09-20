import React, { useState, useEffect } from 'react';
import { userService, ambulanceService, hospitalService, signalService, auditService } from '../services/api';
import { User, Ambulance, Hospital, TrafficSignal, AuditLog } from '../types';
import {
  ShieldCheck,
  Users,
  Truck,
  Hospital as HospIcon,
  Radio,
  FileText,
  UserX,
  UserCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Activity,
  Key
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activeTab, setActiveTab] = useState<'users' | 'ambulances' | 'hospitals' | 'signals' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusActionMsg, setStatusActionMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [uList, aList, hList, sList, logs] = await Promise.all([
        userService.listUsers(),
        ambulanceService.list(),
        hospitalService.list(),
        signalService.list(),
        auditService.getLogs(60),
      ]);
      setUsers(uList);
      setAmbulances(aList);
      setHospitals(hList);
      setSignals(sList);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching admin datasets', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await userService.toggleStatus(user.id, nextStatus);
      setStatusActionMsg(`User ${user.name} has been ${nextStatus}.`);
      setTimeout(() => setStatusActionMsg(null), 3500);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Status modification failed.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream-bg text-cream-text py-10 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8">
      {/* Header with generous padding */}
      <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-purple-700 font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>System Administration & Audit Governance</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-cream-text mt-2">
            Platform Master Console
          </h1>
          <p className="text-xs sm:text-sm text-cream-muted mt-1">
            Manage user accounts, fleet assignments, healthcare nodes, virtual signals, and immutable system audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-black px-4 py-2 rounded-2xl shadow-sm">
            👑 ROOT ADMIN ACCESS
          </span>
        </div>
      </div>

      {statusActionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{statusActionMsg}</span>
        </div>
      )}

      {/* Navigation Tabs with generous spacing */}
      <div className="flex flex-wrap gap-3 border-b border-cream-border pb-4">
        {[
          { id: 'users', label: 'User Directory', count: users.length, icon: Users },
          { id: 'ambulances', label: 'Ambulance Fleet', count: ambulances.length, icon: Truck },
          { id: 'hospitals', label: 'Hospitals', count: hospitals.length, icon: HospIcon },
          { id: 'signals', label: 'Virtual Signals', count: signals.length, icon: Radio },
          { id: 'audit', label: 'Audit Trail', count: auditLogs.length, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                isActive
                  ? 'bg-lane-green text-cream-card shadow-cream-sm'
                  : 'bg-cream-card text-cream-muted border border-cream-border hover:bg-slate-100 hover:text-cream-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive ? 'bg-white/20' : 'bg-cream-bg'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-cream-text">Registered Stakeholder Accounts</h3>
              <p className="text-xs text-cream-muted">Manage authenticated roles, verified unit affiliations, and account active status</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-cream-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cream-bg border border-cream-border rounded-2xl text-xs outline-none focus:ring-2 focus:ring-lane-green"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-bg text-cream-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">User Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Unit Affiliation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-bg/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-heading font-bold text-sm text-cream-text">{u.name}</div>
                      <div className="text-xs text-cream-muted font-mono">{u.email}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold capitalize">
                      <span className="bg-cream-bg border border-cream-border px-3 py-1 rounded-xl text-xs font-bold">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-cream-muted font-medium">
                      {u.ambulance_number || u.hospital_name || u.department || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-cream-muted font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-cream-muted font-bold">Protected Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AMBULANCES */}
      {activeTab === 'ambulances' && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <h3 className="font-heading font-extrabold text-lg text-cream-text">Ambulance Fleet Directory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ambulances.map((amb) => (
              <div key={amb.id} className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-3 text-xs shadow-cream-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-base text-cream-text font-mono">🚑 {amb.ambulance_number}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    amb.status === 'busy' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {amb.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-cream-muted">
                  Assigned Driver: <b className="text-cream-text">{amb.driver_name || 'Unassigned'}</b>
                </div>
                <div className="text-xs font-mono text-cream-muted bg-white p-2.5 rounded-xl border border-cream-border">
                  GPS: Lat {amb.current_location.latitude.toFixed(4)}, Lon {amb.current_location.longitude.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITALS */}
      {activeTab === 'hospitals' && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <h3 className="font-heading font-extrabold text-lg text-cream-text">Registered Healthcare Nodes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hospitals.map((hosp) => (
              <div key={hosp.id} className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-4 text-xs shadow-cream-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-base text-cream-text">🏥 {hosp.name}</span>
                  <span className="bg-lane-green text-cream-card font-bold text-xs px-3 py-1 rounded-xl">
                    Readiness: {hosp.emergency_readiness}%
                  </span>
                </div>
                <div className="text-cream-muted text-xs">{hosp.address}</div>
                <div className="grid grid-cols-3 gap-3 pt-2 font-semibold text-xs">
                  <div className="bg-white p-3 rounded-xl border border-cream-border">
                    <div className="text-[10px] text-cream-muted uppercase font-bold">ER Beds</div>
                    <div className="font-heading font-bold text-sm text-cream-text">{hosp.emergency_beds_available} / {hosp.emergency_beds}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-cream-border">
                    <div className="text-[10px] text-cream-muted uppercase font-bold">ICU Beds</div>
                    <div className="font-heading font-bold text-sm text-[#10B981]">{hosp.icu_beds_available} / {hosp.icu_beds}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-cream-border">
                    <div className="text-[10px] text-cream-muted uppercase font-bold">Vents</div>
                    <div className="font-heading font-bold text-sm text-cream-text">{hosp.ventilators_available}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SIGNALS */}
      {activeTab === 'signals' && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <h3 className="font-heading font-extrabold text-lg text-cream-text">Virtual Traffic Signal Infrastructure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((sig) => (
              <div key={sig.id} className="p-6 bg-cream-bg rounded-2xl border border-cream-border space-y-3 text-xs shadow-cream-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-base text-cream-text">🚦 {sig.name}</span>
                  <span className="font-bold text-xs bg-white px-2.5 py-1 rounded-xl border border-cream-border shadow-sm">
                    {sig.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-cream-muted">Node ID: {sig.intersection_id}</div>
                <div className="text-cream-muted">
                  Corridor Status: <b className={sig.emergency_corridor_active ? 'text-emerald-700' : 'text-cream-text'}>
                    {sig.emergency_corridor_active ? 'PREEMPTION ACTIVE' : 'Normal Cycle'}
                  </b>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-cream-card rounded-3xl p-8 border border-cream-border shadow-cream-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-cream-text">Immutable System Audit Trails</h3>
              <p className="text-xs text-cream-muted">Verifiable ledger tracking all logins, dispatches, and signal commands</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-bg text-cream-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Timestamp</th>
                  <th className="py-3.5 px-4">User / Role</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-bg/60">
                    <td className="py-4 px-4 text-xs font-mono text-cream-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-heading font-bold text-sm text-cream-text">{log.user_name}</div>
                      <div className="text-[10px] text-cream-muted uppercase font-bold">{log.role}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-lane-dark bg-cream-bg border border-cream-border px-2.5 py-1 rounded-lg text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-cream-text">{log.entity}</td>
                    <td className="py-4 px-4 text-xs text-cream-muted font-mono max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
