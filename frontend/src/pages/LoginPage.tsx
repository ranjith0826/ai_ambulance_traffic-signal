import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Siren, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, getRoleRedirectPath } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(getRoleRedirectPath(loggedInUser.role));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col justify-center py-16 px-6 sm:px-8 lg:px-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg border border-[#34D399]/50">
            <Siren className="w-8 h-8 text-[#0A0D0B] animate-pulse" />
          </div>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#0A0D0B]">
          LifeLane<span className="text-[#10B981]">.AI</span> Portal
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          Sign in to your emergency coordination dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 sm:px-12 rounded-3xl border border-gray-200 shadow-xl space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#10B981] focus:bg-white focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#10B981] focus:bg-white focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-2xl font-heading text-xs font-black tracking-wider uppercase shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                {loading ? 'Authenticating...' : 'SIGN IN'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-gray-100">
            <div className="text-center">
              <span className="text-xs text-gray-500">Don't have an account yet? </span>
              <Link
                to="/register"
                className="text-xs font-extrabold text-[#10B981] hover:underline"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </div>

          {/* Quick Demo Fill Buttons with generous padding */}
          <div className="pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span>Quick Demo Autofill Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('driver@lifelane.ai', 'Driver@123456')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-xl text-left font-bold transition-colors"
              >
                🚑 Driver Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('officer@lifelane.ai', 'Officer@123456')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-xl text-left font-bold transition-colors"
              >
                🚦 Traffic Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hospital@lifelane.ai', 'Hospital@123456')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-xl text-left font-bold transition-colors"
              >
                🏥 Hospital Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@lifelane.ai', 'Admin@123456')}
                className="p-3 bg-slate-50 hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-xl text-left font-bold transition-colors"
              >
                👑 System Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
