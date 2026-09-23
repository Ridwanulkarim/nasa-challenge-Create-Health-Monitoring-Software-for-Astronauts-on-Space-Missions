import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div id="app-shell">
      <Sidebar 
        mobileOpen={mobileOpen} 
        onCloseMobile={() => setMobileOpen(false)} 
      />
      <div className="app-main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="app-main" style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
