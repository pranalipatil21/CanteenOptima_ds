import React from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, ChefHat, Box, Users, Utensils, Coins, ListOrdered, Search, Activity, Server, Cpu } from 'lucide-react';

const categories = [
  {
    title: 'Delivery & Routing',
    items: [
      { path: '/dijkstra', name: 'Delivery Shortest Path', icon: Truck },
      { path: '/tsp', name: 'Delivery Route Optimization', icon: Truck },
    ]
  },
  {
    title: 'Kitchen & Orders',
    items: [
      { path: '/job-scheduling', name: 'Order Scheduling', icon: ChefHat },
      { path: '/binary-search', name: 'Find Order', icon: Search },
    ]
  },
  {
    title: 'Menu & Inventory',
    items: [
      { path: '/knapsack', name: 'Lunchbox Optimizer', icon: Box },
      { path: '/sum-of-subsets', name: 'Exact Bill Matcher', icon: Coins },
      { path: '/sorting', name: 'Menu Sorting', icon: ListOrdered },
    ]
  },
  {
    title: 'Seating & Facilities',
    items: [
      { path: '/graph-coloring', name: 'Table Arrangement', icon: Users },
      { path: '/floyd-warshall', name: 'Campus Distances', icon: Utensils },
    ]
  }
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', textAlign: 'center' }}>
        <h1 className="yummy-title" style={{ fontSize: '2rem', margin: 0, color: 'var(--text-main)' }}>
          Yummy<span>.</span>
        </h1>
        <p className="text-sm" style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Canteen Algorithms</p>
      </div>
      
      <nav style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none' }}>
          <li>
            <NavLink 
              to="/"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s'
              })}
            >
              <Utensils size={18} />
              Dashboard
            </NavLink>
          </li>
          
          {categories.map((category) => (
            <React.Fragment key={category.title}>
              <li style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {category.title}
              </li>
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink 
                      to={item.path}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 1.5rem 0.5rem 2rem',
                        textDecoration: 'none',
                        color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                        backgroundColor: 'transparent',
                        borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                        fontWeight: isActive ? 500 : 400,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      })}
                    >
                      <Icon size={16} />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>

        <div style={{ padding: '1rem 1.5rem', marginTop: '1rem' }}>
          <h2 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 600 }}>Overview & Distributed Systems</h2>
          
          <NavLink
            to="/analysis"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1.5rem',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              fontSize: '0.9rem'
            })}
          >
            <Activity size={18} />
            Algorithm Analysis
          </NavLink>

          <NavLink
            to="/distributed-dashboard"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1.5rem',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              fontSize: '0.9rem',
              marginTop: '0.25rem'
            })}
          >
            <Server size={18} />
            Distributed Dashboard
          </NavLink>

          <NavLink
            to="/ds-architecture"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1.5rem',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              fontSize: '0.9rem',
              marginTop: '0.25rem'
            })}
          >
            <Cpu size={18} />
            DS Syllabus Mapping
          </NavLink>

          <NavLink
            to="/api-docs"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1.5rem',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              borderRight: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              fontSize: '0.9rem',
              marginTop: '0.25rem'
            })}
          >
            <ListOrdered size={18} />
            API Gateway Docs
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
