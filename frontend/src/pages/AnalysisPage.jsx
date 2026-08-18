import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import heroImg from '../assets/hero.png';

export default function AnalysisPage() {
  const analysisData = [
    {
      algo: 'Dijkstra',
      problem: 'Shortest Path (Single Delivery)',
      time: 'O((V + E) log V)',
      space: 'O(V + E)',
      desc: 'Used to find the quickest route to deliver a single order to a specific department.'
    },
    {
      algo: 'TSP (Branch & Bound)',
      problem: 'Route Optimization (Multiple Deliveries)',
      time: 'O(V!)',
      space: 'O(V²)',
      desc: 'Used for a delivery boy visiting multiple locations and returning to the canteen.'
    },
    {
      algo: 'Job Scheduling',
      problem: 'Kitchen Orders (Deadlines)',
      time: 'O(N log N)',
      space: 'O(N)',
      desc: 'Used to maximize total bill amount by preparing high-value orders before their deadlines.'
    },
    {
      algo: 'Binary Search',
      problem: 'Order Lookup',
      time: 'O(log N)',
      space: 'O(1)',
      desc: 'Quickly find a specific completed order receipt from a sorted pile.'
    },
    {
      algo: '0/1 Knapsack (DP)',
      problem: 'Lunchbox Optimization',
      time: 'O(N * W)',
      space: 'O(N * W)',
      desc: 'Maximize total calorie satisfaction without exceeding the lunchbox weight limit.'
    },
    {
      algo: 'Sum of Subsets',
      problem: 'Exact Bill Matcher',
      time: 'O(2^N)',
      space: 'O(N)',
      desc: 'Backtracking to find which exact menu items add up to a specific bill amount.'
    },
    {
      algo: 'Sorting Algorithms',
      problem: 'Menu Organization',
      time: 'O(N log N) [Quick/Merge]',
      space: 'O(log N) to O(N)',
      desc: 'Sort canteen menu items by price.'
    },
    {
      algo: 'Graph Coloring',
      problem: 'Table Arrangement',
      time: 'O(m^V)',
      space: 'O(V)',
      desc: 'Ensure rival groups or conflicting orders do not sit at the same table.'
    },
    {
      algo: 'Floyd-Warshall',
      problem: 'Campus Distance Matrix',
      time: 'O(V³)',
      space: 'O(V²)',
      desc: 'Compute shortest paths between all canteen locations and all campus buildings.'
    }
  ];

  return (
    <div>
      <PageHeader 
        title="Overall Algorithm Analysis" 
        description="A theoretical breakdown of all algorithms used in Canteen Optima, including their time and space complexities." 
        imageSrc={heroImg} 
      />

      <div className="card" style={{ padding: '2rem' }}>
        <h3 className="yummy-title" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Complexity <span>Matrix</span></h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--accent-red)', backgroundColor: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Algorithm</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Canteen Problem Solved</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Time Complexity</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Space Complexity</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{row.algo}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{row.problem}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{row.desc}</div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--state-checking)' }}>{row.time}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--state-visited)' }}>{row.space}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover {
          background-color: var(--bg-main);
        }
      `}} />
    </div>
  );
}
