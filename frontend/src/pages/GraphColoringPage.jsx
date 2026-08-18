import React, { useState, useEffect } from 'react';
import GraphVisualizer from '../components/visualizers/GraphVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateGraphColoringStates } from '../algorithms/graphColoring';
import PageHeader from '../components/ui/PageHeader';
import seatingImg from '../assets/seating.png';

const initialNodes = [
  { id: 'GrpA', label: 'Group A', x: 200, y: 150 },
  { id: 'GrpB', label: 'Group B', x: 400, y: 150 },
  { id: 'GrpC', label: 'Group C', x: 600, y: 150 },
  { id: 'GrpD', label: 'Group D', x: 300, y: 350 },
  { id: 'GrpE', label: 'Group E', x: 500, y: 350 },
];

const initialEdges = [
  { from: 'GrpA', to: 'GrpB' },
  { from: 'GrpA', to: 'GrpD' },
  { from: 'GrpB', to: 'GrpC' },
  { from: 'GrpB', to: 'GrpE' },
  { from: 'GrpD', to: 'GrpE' },
  { from: 'GrpB', to: 'GrpD' },
];

const availableColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']; // Green, Blue, Amber, Purple

export default function GraphColoringPage() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [numColors, setNumColors] = useState(3);
  
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runner = useAlgorithmRunner(states, 800);

  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/optimization/graph-coloring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nodes,
            edges,
            m: numColors
          })
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
  }, [nodes, edges, numColors]);

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

  return (
    <div>
      <PageHeader 
        title="Table Arrangement (Graph Coloring)" 
        description="Assign non-conflicting groups to different tables so rival groups don't sit together." 
        imageSrc={seatingImg} 
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
          <span>Solving seating graph arrangement on Optimization Service (gRPC communication through API Gateway)...</span>
        </div>
      )}

      <div className="algorithm-layout">
        <div className="visualization-section">
        <GraphVisualizer nodes={nodes} edges={edges} state={runner.currentState} />
        
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
          <h3 style={{ marginBottom: '1rem' }}>Scenario Setup</h3>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Assign tables (colors) to groups of students such that no conflicting groups sit at the same table type.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Number of Tables (Colors)</label>
            <select 
              className="input-field" 
              style={{ width: '100%' }}
              value={numColors}
              onChange={e => setNumColors(Number(e.target.value))}
              disabled={runner.isPlaying}
            >
              <option value={2}>2 Tables</option>
              <option value={3}>3 Tables</option>
              <option value={4}>4 Tables</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {availableColors.slice(0, numColors).map((color, idx) => (
              <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: '50%' }}></div>
                <span className="text-xs font-medium">Table {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
