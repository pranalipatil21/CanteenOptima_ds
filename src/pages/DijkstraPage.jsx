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
  
  const runner = useAlgorithmRunner(states, 800);

  useEffect(() => {
    // Generate states whenever graph or start node changes
    const { states: newStates, distances, previous } = generateDijkstraStates(nodes, edges, startNode);
    
    // Add path finding logic state at the end
    if (newStates.length > 0 && targetNode) {
      let curr = targetNode;
      const path = [curr];
      const pathEdges = [];
      while (previous[curr]) {
        pathEdges.push(`${previous[curr]}-${curr}`);
        curr = previous[curr];
        path.push(curr);
      }
      
      if (curr === startNode) {
        newStates.push({
          ...newStates[newStates.length - 1],
          log: `Found shortest path to ${targetNode}: ${path.reverse().join(' -> ')} (Total Distance: ${distances[targetNode]})`,
          path: path,
          pathEdges: pathEdges,
          isFinished: true
        });
      } else {
        newStates.push({
          ...newStates[newStates.length - 1],
          log: `Node ${targetNode} is unreachable from ${startNode}.`,
          isFinished: true
        });
      }
    }
    
    setStates(newStates);
    runner.reset();
  }, [nodes, edges, startNode, targetNode]);

  useEffect(() => {
    if (runner.currentState?.log) {
      setLogs(prev => [...prev, runner.currentState.log]);
    }
    if (runner.currentStep === 0) {
      setLogs([states[0]?.log].filter(Boolean));
    }
  }, [runner.currentStep, runner.currentState]);

  return (
    <div>
      <PageHeader 
        title="Delivery Routing (Dijkstra)" 
        description="Find the absolute shortest path for a single food delivery from the Canteen to a specific department." 
        imageSrc={deliveryImg} 
      />
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
