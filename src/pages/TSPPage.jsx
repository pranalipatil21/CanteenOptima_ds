import React, { useState, useEffect } from 'react';
import TreeVisualizer from '../components/visualizers/TreeVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateTSPStates } from '../algorithms/tspBranchAndBound';
import PageHeader from '../components/ui/PageHeader';
import deliveryImg from '../assets/delivery.png';

const initialNodes = [
  { id: 'Canteen', label: 'Canteen', x: 400, y: 100 },
  { id: 'Lib', label: 'Lib', x: 200, y: 300 },
  { id: 'Admin', label: 'Admin', x: 600, y: 300 },
  { id: 'Hostel', label: 'Hostel', x: 400, y: 500 },
];

const initialEdges = [
  { from: 'Canteen', to: 'Lib', weight: 10 },
  { from: 'Canteen', to: 'Admin', weight: 15 },
  { from: 'Canteen', to: 'Hostel', weight: 20 },
  { from: 'Lib', to: 'Admin', weight: 35 },
  { from: 'Lib', to: 'Hostel', weight: 25 },
  { from: 'Admin', to: 'Hostel', weight: 30 },
];

export default function TSPPage() {
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const runner = useAlgorithmRunner(states, 1500);

  useEffect(() => {
    const generatedStates = generateTSPStates(initialNodes, initialEdges);
    setStates(generatedStates);
    runner.reset();
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
  }, [runner.currentStep, runner.currentState]);

  return (
    <div>
      <PageHeader 
        title="Delivery Boy Route Optimization (TSP)" 
        description="Find the optimal route for a delivery boy visiting multiple departments and returning." 
        imageSrc={deliveryImg} 
      />
      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>State Space Tree (Branch and Bound)</h3>
          <TreeVisualizer treeNodes={runner.currentState?.treeNodes || []} />
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
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Find the optimal delivery route to visit all departments exactly once and return to the Canteen.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Best Cost</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
              {runner.currentState?.bestCost === Infinity ? '∞' : runner.currentState?.bestCost || '0'}
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-checking)' }}></div>
              <span>Exploring / Bound</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-conflict)' }}></div>
              <span>Pruned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-path)' }}></div>
              <span>Current Best Path</span>
            </div>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
