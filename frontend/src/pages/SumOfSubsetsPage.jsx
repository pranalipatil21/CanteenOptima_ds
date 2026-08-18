import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateSumOfSubsetsStates } from '../algorithms/sumOfSubsets';
import { SHARED_MENU } from '../utils/menuData';
import PageHeader from '../components/ui/PageHeader';
import lunchboxImg from '../assets/lunchbox.png';

export default function SumOfSubsetsPage() {
  const [items, setItems] = useState([
    { name: SHARED_MENU[0].name, price: SHARED_MENU[0].price },
    { name: SHARED_MENU[1].name, price: SHARED_MENU[1].price },
    { name: SHARED_MENU[2].name, price: SHARED_MENU[2].price },
    { name: SHARED_MENU[3].name, price: SHARED_MENU[3].price },
    { name: SHARED_MENU[7].name, price: SHARED_MENU[7].price },
  ]);
  const [targetSum, setTargetSum] = useState(240);

  const [selectedItem, setSelectedItem] = useState(SHARED_MENU[4].id);

  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const runner = useAlgorithmRunner(states, 900);

  useEffect(() => {
    const generatedStates = generateSumOfSubsetsStates(items, targetSum);
    setStates(generatedStates);
    runner.reset();
  }, [items, targetSum]);

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

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const menuItem = SHARED_MENU.find(m => m.id === selectedItem);
    setItems([...items, { name: menuItem.name, price: menuItem.price }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const currentSum = runner.currentState?.subset?.reduce((acc, curr) => acc + curr.price, 0) || 0;

  return (
    <div>
      <PageHeader 
        title="Exact Bill Matcher (Sum of Subsets)" 
        description="Find exact combinations of menu items that perfectly add up to a specific bill amount." 
        imageSrc={lunchboxImg} 
      />
      <div className="algorithm-layout">
        <div className="visualization-section">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontFamily: 'Amatic SC, cursive' }}>Current Tray (Backtracking)</h3>
          
          <div className="visualizer-canvas" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Target Bill</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>₹{targetSum}</div>
            </div>

            <div style={{ width: '100%', maxWidth: '500px', padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                {runner.currentState?.subset?.map((item, idx) => (
                  <motion.div 
                    key={`${item.name}-${idx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ padding: '0.75rem', backgroundColor: 'var(--accent-red-light)', color: 'var(--accent-red)', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid var(--accent-red)', textAlign: 'center' }}
                  >
                    {item.name} <br/> <span style={{ fontSize: '0.8rem' }}>₹{item.price}</span>
                  </motion.div>
                ))}
                {(!runner.currentState?.subset || runner.currentState.subset.length === 0) && (
                  <span className="text-muted" style={{ padding: '1rem' }}>Tray is empty</span>
                )}
              </div>
              
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', width: '100%', textAlign: 'center', paddingTop: '0.5rem' }}>
                <span className="text-muted">Current Sum: </span>
                <strong style={{ color: currentSum === targetSum ? 'var(--state-visited)' : currentSum > targetSum ? 'var(--state-conflict)' : 'var(--text-main)' }}>
                  ₹{currentSum}
                </strong>
              </div>
            </div>

            {runner.currentState?.isFinished && runner.currentState?.solutions && (
              <div style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--state-visited)', color: 'white', borderRadius: 'var(--radius-md)' }}>
                <strong>{runner.currentState.solutions.length} Valid Combinations Found:</strong>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  {runner.currentState.solutions.map((sol, idx) => (
                    <li key={idx}>{sol.map(i => i.name).join(' + ')} = ₹{targetSum}</li>
                  ))}
                </ul>
              </div>
            )}
            
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
            Find exact combinations of menu items that perfectly add up to a specific bill amount using Backtracking.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Target Bill (₹)</label>
            <input 
              type="number" 
              className="input-field" 
              style={{ width: '100%' }}
              value={targetSum}
              onChange={e => setTargetSum(Number(e.target.value))}
              disabled={runner.isPlaying}
              min={1}
            />
          </div>

          <form onSubmit={handleAddItem} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Add Menu Item</h4>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexDirection: 'column' }}>
              <select className="input-field" value={selectedItem} onChange={e => setSelectedItem(e.target.value)} disabled={runner.isPlaying}>
                {SHARED_MENU.map(item => (
                  <option key={item.id} value={item.id}>{item.name} - ₹{item.price}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={runner.isPlaying}>Add Item</button>
          </form>

          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Available Items</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {[...items].sort((a,b)=>a.price - b.price).map((item, idx) => {
                const originalIndex = items.findIndex(i => i.name === item.name);
                const isChecking = runner.currentState?.currentIndex === idx;
                
                return (
                  <li key={`${item.name}-${idx}`} style={{ 
                    padding: '0.5rem', 
                    backgroundColor: isChecking ? 'var(--accent-red-light)' : 'var(--bg-main)',
                    border: isChecking ? '1px solid var(--accent-red)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="text-xs" style={{ padding: '0.125rem 0.375rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>₹{item.price}</span>
                      {!runner.isPlaying && (
                        <button onClick={() => handleRemoveItem(originalIndex)} className="btn btn-secondary" style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>X</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
