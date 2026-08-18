import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/dijkstra': return 'Dijkstra Algorithm - Delivery Routing';
      case '/floyd-warshall': return 'Floyd-Warshall - Distance Matrix';
      case '/job-scheduling': return 'Job Scheduling - Order Management';
      case '/knapsack': return '0/1 Knapsack - Lunchbox Optimizer';
      case '/graph-coloring': return 'Graph Coloring - Table Arrangement';
      case '/tsp': return 'TSP - Route Optimization';
      case '/sorting': return 'Sorting Algorithms - Menu Organization';
      case '/binary-search': return 'Binary Search - Order Lookup';
      default: return 'CanteenOptima';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h2>{getPageTitle()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-muted text-sm">Status:</span>
            <span style={{ 
              display: 'inline-block', 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: 'var(--accent-green)' 
            }}></span>
            <span className="text-sm">System Online</span>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
