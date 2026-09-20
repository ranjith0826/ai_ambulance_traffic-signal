import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Siren,
  User,
  Mail,
  Phone,
  Lock,
  Building,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, getRoleRedirectPath } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');

  // Role-specific fields
  const [ambulanceNumber, setAmbulanceNumber] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [department, setDepartment] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!role) {
      setError('Please select a role.');
      return;
    }

    if (role === 'driver' && !ambulanceNumber.trim()) {
      setError('Please enter ambulance number.');
      return;
    }
    if (role === 'traffic_officer' && !department.trim()) {
      setError('Please enter department.');
      return;
    }
    if (role === 'hospital_admin' && !hospitalName.trim()) {
      setError('Please enter hospital name.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
        role,
      };

      if (role === 'driver') {
        payload.ambulance_number = ambulanceNumber.toUpperCase();
        payload.driver_license = driverLicense;
      } else if (role === 'traffic_officer') {
        payload.department = department;
        payload.officer_id = officerId;
      } else if (role === 'hospital_admin') {
        payload.hospital_name = hospitalName;
        payload.hospital_address = hospitalAddress;
      }

      const registeredUser = await register(payload);
      setSuccess('Account created successfully.');
      setTimeout(() => {
        navigate(getRoleRedirectPath(registeredUser.role));
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col justify-center py-16 px-6 sm:px-8 lg:px-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg border border-[#10B981]/50">
            <Siren className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#0A0D0B]">
          Join LifeLane<span className="text-[#10B981]">.AI</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Register a verified emergency response stakeholder account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-8 sm:px-12 rounded-3xl border border-gray-200 shadow-xl space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-cream-text mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cream-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Officer Rajesh Kumar"
                  className="block w-full pl-11 pr-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text placeholder-cream-muted focus:ring-2 focus:ring-lane-green outline-none"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cream-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.org"
                    className="block w-full pl-11 pr-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text placeholder-cream-muted focus:ring-2 focus:ring-lane-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cream-muted">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-11 pr-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text placeholder-cream-muted focus:ring-2 focus:ring-lane-green outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cream-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full pl-11 pr-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text placeholder-cream-muted focus:ring-2 focus:ring-lane-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream-text mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cream-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full pl-11 pr-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text placeholder-cream-muted focus:ring-2 focus:ring-lane-green outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-cream-text mb-2">
                Assigned Stakeholder Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
                className="block w-full px-4 py-3 bg-cream-bg border border-cream-border rounded-2xl text-xs text-cream-text focus:ring-2 focus:ring-lane-green outline-none font-semibold"
              >
                <option value="">-- Please Select Your Role --</option>
                <option value="driver">Ambulance Driver</option>
                <option value="traffic_officer">Traffic Control Officer</option>
                <option value="hospital_admin">Hospital Administrator</option>
              </select>
            </div>

            {/* Dynamic Role Fields with generous padding */}
            {role === 'driver' && (
              <div className="p-6 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>Ambulance Driver Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1.5">
                      Ambulance Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={ambulanceNumber}
                      onChange={(e) => setAmbulanceNumber(e.target.value)}
                      placeholder="e.g. KA-01-EA-5544"
                      className="block w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs outline-none uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1.5">
                      Driver License / Ref
                    </label>
                    <input
                      type="text"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      placeholder="DL-2024-XXXX"
                      className="block w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'traffic_officer' && (
              <div className="p-6 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Shield className="w-4 h-4 text-[#10B981]" />
                  <span>Traffic Officer Department Info</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Central Traffic Division"
                      className="block w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                      Officer ID / Badge
                    </label>
                    <input
                      type="text"
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value)}
                      placeholder="TP-8902"
                      className="block w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'hospital_admin' && (
              <div className="p-6 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Building className="w-4 h-4 text-blue-700" />
                  <span>Hospital Facility Details</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1.5">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. LifeCare Trauma & Emergency Center"
                      className="block w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1.5">
                      Hospital Address
                    </label>
                    <input
                      type="text"
                      value={hospitalAddress}
                      onChange={(e) => setHospitalAddress(e.target.value)}
                      placeholder="Street, City, Sector"
                      className="block w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-2xl font-heading text-xs font-black tracking-wider uppercase shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                {loading ? 'Registering Account...' : 'CREATE VERIFIED ACCOUNT'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">Already registered? </span>
            <Link to="/login" className="text-xs font-extrabold text-[#10B981] hover:underline">
              LOGIN TO ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
