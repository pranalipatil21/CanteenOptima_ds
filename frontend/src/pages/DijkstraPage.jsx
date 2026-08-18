import React, { useState, useEffect } from 'react';
import GraphVisualizer from '../components/visualizers/GraphVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateDijkstraStates } from '../algorithms/dijkstra';
import PageHeader from '../components/ui/PageHeader';
import deliveryImg from '../assets/delivery.png';

const initialNodes = [
  { id: 'Kitchen', label: 'Main Kitchen', x: 400, y: 100 },
  { id: 'Lib', label: 'Library Canteen', x: 200, y: 250 },
  { id: 'Hostel', label: 'Hostel Mess', x: 600, y: 250 },
  { id: 'Sports', label: 'Sports Complex', x: 300, y: 450 },
  { id: 'Admin', label: 'Admin Block', x: 500, y: 450 },
];

const initialEdges = [
  { from: 'Kitchen', to: 'Lib', weight: 4 },
  { from: 'Kitchen', to: 'Hostel', weight: 2 },
  { from: 'Lib', to: 'Sports', weight: 3 },
  { from: 'Lib', to: 'Admin', weight: 5 },
  { from: 'Hostel', to: 'Admin', weight: 1 },
  { from: 'Hostel', to: 'Kitchen', weight: 2 }, // Redundant for undirected but safe
  { from: 'Sports', to: 'Admin', weight: 2 },
];

export default function DijkstraPage() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [startNode, setStartNode] = useState('Kitchen');
  const [targetNode, setTargetNode] = useState('Admin');
  
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logEndRef = React.useRef(null);
  
  const runner = useAlgorithmRunner(states, 800);

  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/optimization/dijkstra', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nodes,
            edges,
            startNode,
            targetNode
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
  }, [nodes, edges, startNode, targetNode]);

  useEffect(() => {
    if (runner.currentState?.log) {
      setLogs(prev => [...prev, runner.currentState.log]);
    }
    if (runner.currentStep === 0) {
      setLogs([states[0]?.log].filter(Boolean));
    }
  }, [runner.currentStep, runner.currentState, states]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div>
      <PageHeader 
        title="Delivery Routing (Dijkstra)" 
        description="Find the absolute shortest path for a single food delivery from the Canteen to a specific department." 
        imageSrc={deliveryImg} 
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
          <span>Calculating route on Optimization Service (gRPC communication through API Gateway)...</span>
        </div>
      )}

      <div className="algorithm-layout">
        <div className="visualization-section">
        <GraphVisualizer nodes={nodes} edges={edges} state={runner.currentState} />
        <div className="log-panel">
          {logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              <span className="text-muted">[{idx + 1}]</span> {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-muted">Press play to start algorithm...</div>}
          <div ref={logEndRef} />
        </div>
      </div>
      
      <div className="control-panel">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Scenario Setup</h3>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Find the shortest delivery route from the starting location to all other departments.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Start Location</label>
            <select 
              className="input-field" 
              style={{ width: '100%' }}
              value={startNode}
              onChange={e => setStartNode(e.target.value)}
              disabled={runner.isPlaying}
            >
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Target Location (Highlight Path)</label>
            <select 
              className="input-field" 
              style={{ width: '100%' }}
              value={targetNode}
              onChange={e => setTargetNode(e.target.value)}
              disabled={runner.isPlaying}
            >
              <option value="">None</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
