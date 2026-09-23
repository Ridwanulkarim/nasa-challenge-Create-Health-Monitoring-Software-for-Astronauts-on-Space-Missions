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
        </main>
      </div>
    </div>
  );
}
