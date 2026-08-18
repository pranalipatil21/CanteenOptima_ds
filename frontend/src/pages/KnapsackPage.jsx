import React, { useState, useEffect } from 'react';
import TableVisualizer from '../components/visualizers/TableVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateKnapsackStates } from '../algorithms/knapsack';
import { SHARED_MENU } from '../utils/menuData';
import PageHeader from '../components/ui/PageHeader';
import lunchboxImg from '../assets/lunchbox.png';

export default function KnapsackPage() {
  const [items, setItems] = useState([
    { name: SHARED_MENU[0].name, value: SHARED_MENU[0].calories, weight: SHARED_MENU[0].weight },
    { name: SHARED_MENU[2].name, value: SHARED_MENU[2].calories, weight: SHARED_MENU[2].weight },
    { name: SHARED_MENU[3].name, value: SHARED_MENU[3].calories, weight: SHARED_MENU[3].weight },
    { name: SHARED_MENU[1].name, value: SHARED_MENU[1].calories, weight: SHARED_MENU[1].weight },
  ]);
  const [capacity, setCapacity] = useState(5);

  const [selectedItem, setSelectedItem] = useState(SHARED_MENU[4].id);

  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runner = useAlgorithmRunner(states, 700);

  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/optimization/knapsack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ items, capacity })
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
  }, [items, capacity]);

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

  const rowLabels = ['0', ...items.map(item => item.name.split(' ')[0])];
  const colLabels = Array.from({ length: capacity + 1 }, (_, i) => `${i}`);

  const getCellState = (r, c, state) => {
    if (!state) return 'normal';
    if (state.i === r && state.w === c) {
      if (state.updated) return 'updated';
      if (state.checking) return 'checking';
      return 'current';
    }
    if (state.i === r && state.i !== null) return 'highlight-row-col';
    return 'normal';
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const menuItem = SHARED_MENU.find(m => m.id === selectedItem);
    setItems([...items, { name: menuItem.name, value: menuItem.calories, weight: menuItem.weight }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <PageHeader 
        title="Lunchbox Optimizer (0/1 Knapsack)" 
        description="Maximize calorie satisfaction within a fixed lunchbox capacity limit." 
        imageSrc={lunchboxImg} 
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
          <span>Optimizing lunchbox packing on Optimization Service (gRPC communication through API Gateway)...</span>
        </div>
      )}

      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontFamily: 'Amatic SC, cursive' }}>DP Table: Maximum Satisfaction (Calories)</h3>
          
          <TableVisualizer 
            data={runner.currentState?.matrix || Array(items.length + 1).fill(Array(capacity + 1).fill(0))} 
            rowLabels={rowLabels} 
            colLabels={colLabels} 
            state={runner.currentState}
            getCellState={getCellState}
          />
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Final Lunchbox Selection:</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {runner.currentState?.selectedItems?.map((item, idx) => (
                <div key={`${item.name}-${idx}`} style={{ backgroundColor: 'var(--accent-red-light)', color: 'var(--accent-red)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid var(--accent-red)' }}>
                  {item.name} (Cal: {item.value})
                </div>
              )) || <span className="text-muted text-sm">Algorithm not finished</span>}
            </div>
          </div>
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
            Maximize total calories (Value) you can pack into a Lunchbox with a strict weight capacity. Add items to your menu first!
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Lunchbox Capacity (W)</label>
            <input 
              type="number" 
              className="input-field" 
              style={{ width: '100%' }}
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              disabled={runner.isPlaying}
              min={1}
              max={25}
            />
          </div>

          <form onSubmit={handleAddItem} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Add Menu Item</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexDirection: 'column' }}>
              <select className="input-field" value={selectedItem} onChange={e => setSelectedItem(e.target.value)} disabled={runner.isPlaying}>
                {SHARED_MENU.map(item => (
                  <option key={item.id} value={item.id}>{item.name} (Cal: {item.calories}, W: {item.weight})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={runner.isPlaying}>Add Item</button>
          </form>

          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Available Items</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {items.map((item, idx) => (
                <li key={`${item.name}-${idx}`} style={{ 
                  padding: '0.5rem', 
                  backgroundColor: runner.currentState?.i === (idx + 1) ? 'var(--accent-red-light)' : 'var(--bg-main)',
                  border: runner.currentState?.i === (idx + 1) ? '1px solid var(--accent-red)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span className="text-xs" style={{ padding: '0.125rem 0.25rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>V: {item.value}</span>
                    <span className="text-xs" style={{ padding: '0.125rem 0.25rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>W: {item.weight}</span>
                    {!runner.isPlaying && (
                      <button onClick={() => handleRemoveItem(idx)} className="btn btn-secondary" style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>X</button>
                    )}
                  </div>
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
