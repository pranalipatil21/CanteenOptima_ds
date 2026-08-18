import React from 'react';
import { NavLink } from 'react-router-dom';
import { Utensils, Bell, ChefHat, Settings, Server, Cpu, ListOrdered } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', textAlign: 'center' }}>
        <h1 className="yummy-title" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-main)', fontFamily: 'Amatic SC, cursive' }}>
          Canteen<span>.</span>Optima
        </h1>
        <p className="text-sm" style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Distributed Canteen System</p>
      </div>
      
      <nav style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          
          <li style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Canteen Operations
          </li>
          
          <li>
            <NavLink 
              to="/"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Utensils size={18} />
              Menu Catalog
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/notifications"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Bell size={18} />
              Notifications Inbox
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/kitchen"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <ChefHat size={18} />
              Kitchen Monitor
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/admin/menu"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Settings size={18} />
              Admin Inventory
            </NavLink>
          </li>

          <li style={{ padding: '1.5rem 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Distributed Systems Hub
          </li>

          <li>
            <NavLink
              to="/distributed-dashboard"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Server size={18} />
              Distributed Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/ds-architecture"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Cpu size={18} />
              DS Syllabus Mapping
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/api-docs"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <ListOrdered size={18} />
              API Gateway Docs
            </NavLink>
          </li>

        </ul>
      </nav>
    </div>
  );
}
