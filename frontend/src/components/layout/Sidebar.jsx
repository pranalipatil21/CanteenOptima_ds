import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChefHat, Box, Utensils, ListOrdered, Server, Cpu } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', textAlign: 'center' }}>
        <h1 className="yummy-title" style={{ fontSize: '2rem', margin: 0, color: 'var(--text-main)' }}>
          Yummy<span>.</span>
        </h1>
        <p className="text-sm" style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Canteen Optima DS</p>
      </div>
      
      <nav style={{ padding: '1.5rem 0', flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          
          <li style={{ padding: '0 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Canteen Operations
          </li>

          <li>
            <NavLink 
              to="/"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Utensils size={16} />
              Canteen Menu
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/kitchen"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <ChefHat size={16} />
              Kitchen Workflow
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/admin"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Box size={16} />
              Admin Manager
            </NavLink>
          </li>

          <li style={{ padding: '1.5rem 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Distributed Systems Lab
          </li>

          <li>
            <NavLink 
              to="/dist-hub"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Server size={16} />
              Distributed Hub
            </NavLink>
          </li>

          <li>
            <NavLink 
              to="/ds-architecture"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <Cpu size={16} />
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
                padding: '0.6rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              })}
            >
              <ListOrdered size={16} />
              API Gateway Docs
            </NavLink>
          </li>

        </ul>
      </nav>
    </div>
  );
}
