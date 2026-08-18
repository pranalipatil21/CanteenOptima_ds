import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateBinarySearchStates } from '../algorithms/binarySearch';
import PageHeader from '../components/ui/PageHeader';
import kitchenImg from '../assets/kitchen.png';

const initialArray = [102, 115, 128, 142, 155, 168, 182, 195, 208, 222, 235, 248, 262, 275];

export default function BinarySearchPage() {
  const [array, setArray] = useState(initialArray);
  const [target, setTarget] = useState(195);
  
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const runner = useAlgorithmRunner(states, 1200);

  useEffect(() => {
    const generatedStates = generateBinarySearchStates(array, target);
    setStates(generatedStates);
    runner.reset();
  }, [array, target]);

  useEffect(() => {
    if (runner.currentState?.log) {
      setLogs(prev => {
        const newLogs = [...prev, runner.currentState.log];
        if (newLogs.length > 30) return newLogs.slice(newLogs.length - 30);
        return newLogs;
      });
    }
    if (runner.currentStep === 0) {
      setLogs([states[0]?.log].filter(Boolean));
    }
  }, [runner.currentStep, runner.currentState]);

  const getCellColor = (index, state) => {
    if (!state) return 'var(--bg-main)';
    if (state.found && state.mid === index) return 'var(--state-visited)'; // Green
    if (state.mid === index) return 'var(--state-current)'; // Orange
    if (index >= state.left && index <= state.right) return 'var(--accent-orange-light)'; // Search space
    return 'var(--bg-main)'; // Out of bounds
  };

  const getCellOpacity = (index, state) => {
    if (!state) return 1;
    if (index >= state.left && index <= state.right) return 1;
    return 0.3; // Dim elements outside search space
  };

  return (
    <div>
      <PageHeader 
        title="Order Lookup (Binary Search)" 
        description="Quickly find a specific completed order ID from a sorted pile of receipts." 
        imageSrc={kitchenImg} 
      />
      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="visualizer-canvas" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Searching for Order ID: {target}</h3>
            {runner.currentState?.found && (
              <span style={{ color: 'var(--state-visited)', fontWeight: 'bold' }}>Target Found!</span>
            )}
            {runner.currentState?.isFinished && !runner.currentState?.found && (
              <span style={{ color: 'var(--state-conflict)', fontWeight: 'bold' }}>Target Not Found!</span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {(runner.currentState?.array || array).map((val, idx) => (
              <motion.div
                key={`cell-${idx}`}
                style={{
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
                animate={{ 
                  backgroundColor: getCellColor(idx, runner.currentState),
                  opacity: getCellOpacity(idx, runner.currentState),
                  borderColor: runner.currentState?.mid === idx ? 'var(--state-current)' : 'var(--border-color)',
                  color: (runner.currentState?.mid === idx || (runner.currentState?.found && runner.currentState?.mid === idx)) ? 'white' : 'var(--text-main)'
                }}
                transition={{ duration: 0.3 }}
              >
                {val}
                <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'currentColor', opacity: 0.8 }}>idx: {idx}</span>
              </motion.div>
            ))}
          </div>

          {runner.currentState && (
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem', fontSize: '0.875rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="text-muted">Left</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{runner.currentState.left}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className="text-muted">Mid</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--state-current)' }}>{runner.currentState.mid !== null ? runner.currentState.mid : '-'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className="text-muted">Right</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{runner.currentState.right}</div>
              </div>
            </div>
          )}

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
            Find a specific completed Order ID from a sorted list of completed orders using Binary Search.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Target Order ID</label>
            <select 
              className="input-field" 
              style={{ width: '100%' }}
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              disabled={runner.isPlaying}
            >
              {array.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
              <option value="999">999 (Not in list)</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--accent-orange-light)' }}></div>
              <span>Search Space</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-current)' }}></div>
              <span>Checking (Mid)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-visited)' }}></div>
              <span>Found</span>
            </div>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
