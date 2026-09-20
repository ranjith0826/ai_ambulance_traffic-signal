import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Siren,
  MapPin,
  GitMerge,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Radio
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, getRoleRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Citizen Page', path: '/citizen', icon: ShieldAlert },
    { name: 'Live Command', path: '/traffic', icon: MapPin },
    { name: 'Conflict Lab', path: '/conflict-demo', icon: GitMerge },
    { name: 'What-If Simulation', path: '/what-if', icon: SlidersHorizontal },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Demo Scenarios', path: '/demo', icon: Sparkles, highlight: true },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'driver':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">🚑 Driver</span>;
      case 'traffic_officer':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">🚦 Officer</span>;
      case 'hospital_admin':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">🏥 Admin</span>;
      case 'admin':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">👑 Super Admin</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A0D0B] text-white shadow-sm border-b border-[#10B981]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo with generous spacing */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-[#34D399]/60 group-hover:scale-105 transition-transform">
                  <Siren className="w-6 h-6 text-[#0A0D0B] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-2xl font-black tracking-tight text-white">
                      LifeLane<span className="text-[#10B981]">.AI</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">
                    Intelligent Traffic Preemption
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Nav Links with spacious padding */}
            <nav className="hidden xl:flex items-center space-x-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-[#10B981] text-[#0A0D0B] shadow-sm border border-[#34D399]'
                        : item.highlight
                        ? 'bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/40'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls with spacious gaps */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(getRoleRedirectPath())}
                    className="flex items-center gap-2 bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-[#34D399] shadow-sm"
                    title="Go to role dashboard"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#0A0D0B] animate-pulse" />
                    <span>Dashboard</span>
                  </button>

                  <div className="flex items-center gap-3 bg-[#111827] px-3.5 py-2 rounded-xl border border-gray-800">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{user.name}</div>
                      <div className="flex items-center justify-end mt-0.5">{getRoleBadge(user.role)}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-xs font-bold px-4 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs font-black px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] shadow-sm transition-all"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="xl:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer with spacious padding */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#0A0D0B] px-6 pt-4 pb-6 space-y-2 border-t border-gray-800 animate-in fade-in">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getRoleRedirectPath());
                  }}
                  className="flex-1 py-3 text-xs bg-[#10B981] hover:bg-[#34D399] text-[#0A0D0B] rounded-xl font-black text-center"
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="py-3 px-4 text-xs text-red-400 font-bold bg-red-950/40 rounded-xl border border-red-900/50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-800 flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-3 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-xl text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-3 text-xs font-black bg-[#10B981] hover:bg-[#34D399] rounded-xl text-[#0A0D0B]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
