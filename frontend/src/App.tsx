import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';

import { LandingPage } from './pages/LandingPage';
import { CitizenPage } from './pages/CitizenPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DriverDashboard } from './pages/DriverDashboard';
import { TrafficCommandCenter } from './pages/TrafficCommandCenter';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ConflictLabPage } from './pages/ConflictLabPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { DemoHubPage } from './pages/DemoHubPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center text-xs font-bold text-cream-muted">
        Validating session...
      </div>
    );
  }

  // Allow guest access for simulation prototype testing or redirect
  if (!user && allowedRoles) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col font-sans text-cream-text">
      <Navbar />
      <NotificationToast />

      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/citizen" element={<CitizenPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Interactive Innovation & Demo Labs */}
          <Route path="/conflict-demo" element={<ConflictLabPage />} />
          <Route path="/what-if" element={<WhatIfPage />} />
          <Route path="/analytics" element={<AnalyticsReportsPage />} />
          <Route path="/demo" element={<DemoHubPage />} />

          {/* Stakeholder Dashboards */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/traffic"
            element={
              <ProtectedRoute>
                <TrafficCommandCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital"
            element={
              <ProtectedRoute>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
