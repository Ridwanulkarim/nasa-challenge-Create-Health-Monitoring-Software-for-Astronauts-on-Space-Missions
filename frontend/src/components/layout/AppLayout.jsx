/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * App Layout Wrapper: client/src/components/layout/AppLayout.jsx
 */

import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--accent-cyan)' }}>
        <div className="mono">INITIALIZING SPACECRAFT BIO-HUD TELEMETRY...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="app-main-content">
        <Topbar onToggleMobile={() => setMobileOpen(prev => !prev)} />
        <main className="content-area">
          <Outlet />
          <footer style={{ marginTop: '32px', marginBottom: '16px' }}>
            <div className="disclaimer-banner">
              <strong>SIMULATED DEMONSTRATION NOTICE:</strong> The health values displayed in this prototype are simulated data for demonstration purposes. Monitored health indicators and health considerations are informed by NASA's human spaceflight research.<br />
              <strong>DECISION-SUPPORT ONLY:</strong> All numerical thresholds are illustrative demonstration values, NOT official NASA medical limits. This is an onboard monitoring and decision-support prototype, NOT a medical diagnosis system.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
