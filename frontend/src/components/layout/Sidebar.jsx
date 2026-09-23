/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Sidebar Navigation Component: client/src/components/layout/Sidebar.jsx
 */

import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Astronaut';
  const avatarText = ((user.firstName || user.username || 'A')[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase();

  return (
    <>
      <div 
        id="sidebar-backdrop" 
        className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`}
        onClick={onCloseMobile}
      />
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-icon">
            <img src="/assets/images/nasa-logo.svg" alt="NASA Meatball Insignia" />
          </div>
          <div className="sidebar-brand-text">
            <div className="brand-title">AstroHealth</div>
            <div className="brand-subtitle">NASA Bio-HUD</div>
          </div>
          <button 
            id="btn-sidebar-close" 
            className="mobile-sidebar-close-btn" 
            aria-label="Close menu"
            onClick={onCloseMobile}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {user.role === 'ASTRONAUT' ? (
            <>
              <div className="nav-section-title">Flight Telemetry</div>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                </span> 
                Dashboard
              </NavLink>
              <NavLink 
                to="/health-check" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M7 14h2.5l1.5-3 2 6 1.5-3H17"/></svg>
                </span> 
                Daily Check-in
              </NavLink>
              <NavLink 
                to="/history" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M3 12h3l1.5-2 2 4 1.5-2h2"/></svg>
                </span> 
                Health History
              </NavLink>
              <NavLink 
                to="/alerts" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span> 
                Active Alerts
              </NavLink>
              <NavLink 
                to="/dossier" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </span> 
                Clinical Dossier
              </NavLink>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span> 
                Personal Profile
              </NavLink>
            </>
          ) : (
            <>
              <div className="nav-section-title">Ground Operations</div>
              <NavLink 
                to="/mission-control" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="nav-icon">
                  <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
                </span> 
                Fleet Overview
              </NavLink>
            </>
          )}

          <div className="nav-section-title">Clinical Protocols</div>
          <NavLink 
            to="/emergency" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 22 22 7 12 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span> 
            Emergency QRH
          </NavLink>
          <NavLink 
            to="/research" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/></svg>
            </span> 
            NASA 5 Hazards
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <Link 
            to="/profile" 
            className="crew-profile-pill" 
            style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex' }}
            title="View & Edit Personal Profile"
            onClick={onCloseMobile}
          >
            <div className="crew-avatar">{avatarText}</div>
            <div className="crew-info">
              <div className="crew-name">{displayName}</div>
              <div className="crew-role">{user.roleTitle || user.role}</div>
            </div>
          </Link>
          <button 
            id="btn-logout-sidebar" 
            className="btn-logout"
            onClick={handleLogout}
          >
            <svg className="hud-icon" style={{ marginRight: '6px', width: '14px', height: '14px' }} viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg> 
            Disconnect Session
          </button>
        </div>
      </aside>
    </>
  );
}
