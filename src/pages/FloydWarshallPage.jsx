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
  
  const runner = useAlgorithmRunner(states, 500);

  useEffect(() => {
    const { states: generatedStates, next, dist } = generateFloydWarshallStates(labels, initialMatrix);
    
    // Add path reconstruction for a specific example (Kitchen to Admin) at the end
    // labels = ['Kitchen', 'Library', 'Hostel', 'Sports', 'Admin']
    const u = 0; // Kitchen
    const v = 4; // Admin
    
    if (next[u][v] !== null) {
      let path = [labels[u]];
      let curr = u;
      while (curr !== v) {
        curr = next[curr][v];
        path.push(labels[curr]);
      }
      generatedStates.push({
        ...generatedStates[generatedStates.length - 1],
        log: `Found shortest path from ${labels[u]} to ${labels[v]}: ${path.join(' -> ')} (Total Distance: ${dist[u][v]})`,
        isFinished: true
      });
    }

    setStates(generatedStates);
    runner.reset();
  }, []);

  useEffect(() => {
    if (runner.currentState?.log) {
      setLogs(prev => {
        // Keep only last 50 logs to avoid performance issues
        const newLogs = [...prev, runner.currentState.log];
        if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50);
        return newLogs;
      });
    }
    if (runner.currentStep === 0) {
      setLogs([states[0]?.log].filter(Boolean));
    }
  }, [runner.currentStep, runner.currentState]);

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
