import React, { useState, useEffect } from 'react';
import TimelineVisualizer from '../components/visualizers/TimelineVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateJobSchedulingStates } from '../algorithms/jobScheduling';
import { SHARED_MENU } from '../utils/menuData';
import PageHeader from '../components/ui/PageHeader';
import kitchenImg from '../assets/kitchen.png';

export default function JobSchedulingPage() {
  const [jobs, setJobs] = useState([
    { id: '1', profit: 100, deadline: 2, name: 'Burger Meals 🍔' },
    { id: '6', profit: 50, deadline: 2, name: 'Noodles 🍜' },
    { id: '3', profit: 27, deadline: 2, name: 'Pizza 🍕' },
    { id: '4', profit: 25, deadline: 1, name: 'Cold Drinks 🥤' },
    { id: '2', profit: 19, deadline: 1, name: 'Fries 🍟' },
    { id: '5', profit: 15, deadline: 3, name: 'Ice Cream 🍦' },
  ]);
  
  const [selectedItem, setSelectedItem] = useState(SHARED_MENU[0].id);
  const [newDeadline, setNewDeadline] = useState(2);

  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runner = useAlgorithmRunner(states, 1000);

  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/optimization/job-scheduling', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ jobs })
        });

        if (!response.ok) {
          const errBody = await response.json();
          throw new Error(errBody.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (active) {
          setStates(data.states || []);
          runner.reset();
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setStates([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStates();
    return () => {
      active = false;
    };
  }, [jobs]);

  useEffect(() => {
    if (runner.currentState?.log) {
      setLogs(prev => {
        const newLogs = [...prev, runner.currentState.log];
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });
    }
    if (runner.currentStep === 0) {
      setLogs([states[0]?.log].filter(Boolean));
    }
  }, [runner.currentStep, runner.currentState, states]);

  const handleAddJob = (e) => {
    e.preventDefault();
    if (!selectedItem || newDeadline <= 0) return;
    
    const menuItem = SHARED_MENU.find(m => m.id === selectedItem);
    
    const newJob = {
      id: (jobs.length + 1).toString(),
      profit: menuItem.price, // Profit is the Bill Amount
      deadline: Number(newDeadline),
      name: menuItem.name
    };
    setJobs([...jobs, newJob]);
  };

  const handleRemoveJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  return (
    <div>
      <PageHeader 
        title="Kitchen Order Scheduling" 
        description="Schedule incoming orders with strict preparation deadlines to maximize total bill amount." 
        imageSrc={kitchenImg} 
      />

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: 'var(--accent-red)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Connection / Fault Tolerance Notice:</span>
          <span>{error}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Demo Tip: Ensure API Gateway and Optimization Service are running, or toggle service states to test retry and circuit breaker logic.</span>
        </div>
      )}

      {loading && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Scheduling jobs on Optimization Service (gRPC communication through API Gateway)...</span>
        </div>
      )}

      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontFamily: 'Amatic SC, cursive' }}>Kitchen Timeline 👨‍🍳</h3>
          <TimelineVisualizer slots={runner.currentState?.slots || Array(Math.max(...jobs.map(j => j.deadline), 0)).fill(null)} state={runner.currentState} />
        </div>

        <div className="log-panel">
          {logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              <span className="text-muted">[{runner.currentStep - logs.length + idx + 1}]</span> {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-muted">Press play to start algorithm...</div>}
        </div>
      </div>
      
      <div className="control-panel">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontFamily: 'Amatic SC, cursive' }}>Scenario Setup</h3>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Schedule incoming kitchen orders. Each order has a <strong>Bill Amount (Profit)</strong> and a <strong>Promised Deadline (mins)</strong>. Maximize total bill value completed before deadlines expire.
          </p>
          
          <form onSubmit={handleAddJob} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Add New Order</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexDirection: 'column' }}>
              <select className="input-field" value={selectedItem} onChange={e => setSelectedItem(e.target.value)} disabled={runner.isPlaying}>
                {SHARED_MENU.map(item => (
                  <option key={item.id} value={item.id}>{item.name} - ₹{item.price}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Deadline (mins):</span>
                <input type="number" className="input-field" style={{ flex: 1 }} value={newDeadline} onChange={e => setNewDeadline(e.target.value)} disabled={runner.isPlaying} min={1} />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={runner.isPlaying}>Add Order</button>
          </form>

          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Orders (Sorted by Bill Amount)</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {(runner.currentState?.jobs || [...jobs].sort((a,b) => b.profit - a.profit)).map(job => (
                <li key={job.id} style={{ 
                  padding: '0.5rem', 
                  backgroundColor: runner.currentState?.currentJob?.id === job.id ? 'var(--accent-red-light)' : 'var(--bg-main)',
                  border: runner.currentState?.currentJob?.id === job.id ? '1px solid var(--accent-red)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 500, display: 'block' }}>Order {job.id}: {job.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className="text-xs" style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>₹{job.profit}</span>
                      <span className="text-xs" style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>Deadline: {job.deadline}m</span>
                    </div>
                  </div>
                  {!runner.isPlaying && (
                    <button onClick={() => handleRemoveJob(job.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>X</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
