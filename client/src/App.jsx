/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Main Application Component: client/src/App.jsx
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HealthCheckPage from './pages/HealthCheckPage';
import HistoryPage from './pages/HistoryPage';
import AlertsPage from './pages/AlertsPage';
import DossierPage from './pages/DossierPage';
import EmergencyPage from './pages/EmergencyPage';
import ProfilePage from './pages/ProfilePage';
import MissionControlPage from './pages/MissionControlPage';
import ResearchPage from './pages/ResearchPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected Spacecraft Telemetry Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/health-check" element={<HealthCheckPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/dossier" element={<DossierPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/mission-control" element={<MissionControlPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
