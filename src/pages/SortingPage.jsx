import React, { useState, useEffect } from 'react';
import ArrayVisualizer from '../components/visualizers/ArrayVisualizer';
import PlaybackControls from '../components/ui/PlaybackControls';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { generateSelectionSortStates, generateBubbleSortStates, generateQuickSortStates, generateMergeSortStates } from '../algorithms/sorting';
import { SHARED_MENU } from '../utils/menuData';
import PageHeader from '../components/ui/PageHeader';
import kitchenImg from '../assets/kitchen.png';

const initialArray = [...SHARED_MENU].map(item => ({ name: item.name, price: item.price }));

export default function SortingPage() {
  const [array, setArray] = useState(initialArray);
  const [algo, setAlgo] = useState('quick'); // selection, bubble, quick, merge
  
  const [states, setStates] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const runner = useAlgorithmRunner(states, 400);

  useEffect(() => {
    let generatedStates = [];
    if (algo === 'selection') {
      generatedStates = generateSelectionSortStates(array);
    } else if (algo === 'bubble') {
      generatedStates = generateBubbleSortStates(array);
    } else if (algo === 'quick') {
      generatedStates = generateQuickSortStates(array);
    } else if (algo === 'merge') {
      generatedStates = generateMergeSortStates(array);
    }
    setStates(generatedStates);
    runner.reset();
  }, [array, algo]);

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

  const handleShuffle = () => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    setArray(newArr);
  };

  return (
    <div>
      <PageHeader 
        title="Menu Organization (Sorting)" 
        description="Sort canteen menu items by price using various algorithms. Compare their efficiency in real-time." 
        imageSrc={kitchenImg} 
      />
      <div className="algorithm-layout">
        <div className="visualization-section">
        <ArrayVisualizer array={runner.currentState?.array || array} state={runner.currentState} />
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div className="card" style={{ flex: 1, padding: '1rem', textAlign: 'center', backgroundColor: 'var(--accent-red-light)', border: '1px solid var(--accent-red)' }}>
            <div className="text-muted text-sm">Comparisons</div>
            <div style={{ fontSize: '2rem', fontFamily: 'Amatic SC, cursive', fontWeight: 'bold', color: 'var(--accent-red)' }}>
              {runner.currentState?.comparisons || 0}
            </div>
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem', textAlign: 'center', backgroundColor: 'var(--accent-red-light)', border: '1px solid var(--accent-red)' }}>
            <div className="text-muted text-sm">Swaps / Writes</div>
            <div style={{ fontSize: '2rem', fontFamily: 'Amatic SC, cursive', fontWeight: 'bold', color: 'var(--accent-red)' }}>
              {runner.currentState?.swaps || 0}
            </div>
          </div>
        </div>

        <div className="log-panel" style={{ marginTop: '1rem' }}>
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
            Sort the canteen menu items by price (₹) in ascending order. Observe how Quick and Merge sort are much faster (fewer operations) than Bubble or Selection sort.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: '0.25rem' }}>Algorithm</label>
            <select 
              className="input-field" 
              style={{ width: '100%' }}
              value={algo}
              onChange={e => setAlgo(e.target.value)}
              disabled={runner.isPlaying}
            >
              <option value="quick">Quick Sort (Divide & Conquer)</option>
              <option value="merge">Merge Sort (Divide & Conquer)</option>
              <option value="selection">Selection Sort</option>
              <option value="bubble">Bubble Sort</option>
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            onClick={handleShuffle}
            disabled={runner.isPlaying}
          >
            Shuffle Prices
          </button>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-checking)' }}></div>
              <span>Comparing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-conflict)' }}></div>
              <span>Swapping/Writing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--state-visited)' }}></div>
              <span>Sorted Position</span>
            </div>
          </div>
        </div>

        <PlaybackControls {...runner} />
      </div>
    </div>
    </div>
  );
}
