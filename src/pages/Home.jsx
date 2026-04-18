import React from 'react';
import { Truck, ChefHat, Box, Users, Utensils, Coins, ListOrdered, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero.png';

export default function Home() {
  const categories = [
    {
      title: 'Delivery & Routing',
      desc: 'Optimize food delivery paths across the campus.',
      items: [
        { name: 'Dijkstra (Shortest Path)', path: '/dijkstra', icon: Truck, desc: 'Find the absolute shortest path for a single food delivery to a department.' },
        { name: 'TSP (Route Optimization)', path: '/tsp', icon: Truck, desc: 'Optimal route for a delivery boy visiting multiple departments and returning.' }
      ]
    },
    {
      title: 'Kitchen & Order Management',
      desc: 'Manage kitchen operations and lookup orders efficiently.',
      items: [
        { name: 'Job Scheduling (Kitchen Orders)', path: '/job-scheduling', icon: ChefHat, desc: 'Schedule incoming orders with strict preparation deadlines to maximize profit.' },
        { name: 'Binary Search (Order Lookup)', path: '/binary-search', icon: Search, desc: 'Quickly find a specific completed order ID from a sorted pile of receipts.' }
      ]
    },
    {
      title: 'Menu & Inventory Optimization',
      desc: 'Maximize value from inventory and organize the menu.',
      items: [
        { name: '0/1 Knapsack (Lunchbox)', path: '/knapsack', icon: Box, desc: 'Maximize calorie satisfaction within a fixed lunchbox capacity.' },
        { name: 'Sum of Subsets (Exact Bill)', path: '/sum-of-subsets', icon: Coins, desc: 'Find exactly which combination of menu items adds up to a specific bill amount.' },
        { name: 'Sorting (Menu Organization)', path: '/sorting', icon: ListOrdered, desc: 'Sort menu items by price using various algorithms.' }
      ]
    },
    {
      title: 'Seating & Facilities',
      desc: 'Manage canteen space and campus distances.',
      items: [
        { name: 'Graph Coloring (Table Arrangement)', path: '/graph-coloring', icon: Users, desc: 'Assign non-conflicting groups to different tables so rival groups don\'t sit together.' },
        { name: 'Floyd-Warshall (Distance Matrix)', path: '/floyd-warshall', icon: Utensils, desc: 'Compute shortest paths between all canteens and campus buildings.' }
      ]
    }
  ];

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', padding: '2rem 0', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1.2 }}>
            Enjoy Your Healthy<br/>Delicious Food
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '400px' }}>
            We are a team of talented developers making interactive algorithms with React.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dijkstra" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>Get Started</Link>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
          {heroImage ? (
             <img src={heroImage} alt="Healthy Food Bowl" style={{ width: '100%', maxWidth: '450px', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }} />
          ) : (
             <div style={{ width: '400px', height: '400px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Utensils size={64} color="var(--accent-red)" />
             </div>
          )}
        </div>
      </div>

      {/* About/Categories Section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <p className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>Algorithms</p>
        <h2 className="yummy-title" style={{ fontSize: '2.5rem' }}>Learn More <span>About Us</span></h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {categories.map(category => (
          <div key={category.title}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '2rem', color: 'var(--text-main)', fontFamily: 'Amatic SC, cursive' }}>{category.title}</h3>
              <p className="text-muted text-sm">{category.desc}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {category.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link to={item.path} key={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card" style={{ transition: 'all 0.3s', cursor: 'pointer', height: '100%', border: 'none', borderBottom: '3px solid transparent' }}
                         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderBottomColor = 'var(--accent-red)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderBottomColor = 'transparent'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ backgroundColor: 'var(--accent-red-light)', padding: '0.75rem', borderRadius: '50%', color: 'var(--accent-red)' }}>
                          <Icon size={24} />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{item.name}</h4>
                      </div>
                      <p className="text-muted text-sm">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
