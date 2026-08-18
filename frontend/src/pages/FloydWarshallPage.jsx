import React, { useState, useEffect } from 'react';
import TableVisualizer from '../components/visualizers/TableVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateFloydWarshallStates } from '../algorithms/floydWarshall';
import PageHeader from '../components/ui/PageHeader';
import seatingImg from '../assets/seating.png';

const labels = ['Kitchen', 'Library', 'Hostel', 'Sports', 'Admin'];
const initialMatrix = [
  [0, 4, 2, Infinity, Infinity],
  [4, 0, Infinity, 3, 5],
  [2, Infinity, 0, Infinity, 1],
  [Infinity, 3, Infinity, 0, 2],
  [Infinity, 5, 1, 2, 0]
];

export default function FloydWarshallPage() {
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logEndRef = React.useRef(null);
  
  const runner = useAlgorithmRunner(states, 500);

  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoading(true);
      setError(null);
      
      // Reconstruct nodes and edges format for backend request
      const nodes = labels.map(label => ({ id: label, label }));
      const edges = [];
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          if (initialMatrix[i][j] !== Infinity) {
            edges.push({ from: labels[i], to: labels[j], weight: initialMatrix[i][j] });
          }
        }
      }

      try {
        const response = await fetch('http://localhost:8000/api/optimization/floyd-warshall', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nodes, edges })
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
  }, []);

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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getCellState = (r, c, state) => {
    if (!state) return 'normal';
    
    // If it's the cell being updated
    if (state.i === r && state.j === c) {
      return state.updated ? 'updated' : 'current';
    }
    
    // If it's one of the cells being checked (dist[i][k] or dist[k][j])
    if ((state.i === r && state.k === c) || (state.k === r && state.j === c)) {
      return 'checking';
    }
    
    // Highlight the row and column of the intermediate node K
    if (state.k === r || state.k === c) {
      return 'highlight-row-col';
    }
    
    return 'normal';
  };

  return (
    <div>
      <PageHeader 
        title="Distance Matrix (Floyd-Warshall)" 
        description="Compute shortest paths between all canteens and campus buildings." 
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
          <span>Calculating distance matrix on Optimization Service (gRPC communication through API Gateway)...</span>
        </div>
      )}

      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Distance Matrix</h3>
            {runner.currentState?.k !== null && runner.currentState?.k !== undefined && (
              <div className="text-sm font-medium" style={{ color: 'var(--accent-orange)' }}>
                Intermediate Node (k): {labels[runner.currentState.k]}
              </div>
            )}
          </div>
          
          <TableVisualizer 
            data={runner.currentState?.matrix || initialMatrix} 
            rowLabels={labels} 
            colLabels={labels} 
            state={runner.currentState}
            getCellState={getCellState}
          />
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 16, height: 16, backgroundColor: 'var(--state-checking)' }}></div>
              <span>Checking distances (i→k, k→j)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 16, height: 16, backgroundColor: 'var(--state-current)' }}></div>
              <span>Target cell (i→j)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 16, height: 16, backgroundColor: 'var(--state-visited)' }}></div>
              <span>Updated value</span>
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
          <div ref={logEndRef} />
        </div>
      </div>
      
      <div className="control-panel">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Scenario Setup</h3>
          <p className="text-sm text-muted">
            Compute the shortest distance between all pairs of locations on campus. 
            The algorithm iteratively improves the path by considering each node as an intermediate step.
          </p>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
