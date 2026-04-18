import React from 'react';
import { motion } from 'framer-motion';

export default function ArrayVisualizer({ array, state }) {
  if (!array || array.length === 0) return null;

  // Assuming array is an array of objects with .price and .name
  // If it's just numbers, we can map them to objects for safety, but we know SortingPage passes objects now.
  const maxVal = Math.max(...array.map(item => typeof item === 'object' ? item.price : item));

  const getBarColor = (index) => {
    if (!state) return 'var(--state-unvisited)';
    if (state.comparing && state.comparing.includes(index)) return 'var(--state-checking)';
    if (state.swapping && state.swapping.includes(index)) return 'var(--state-conflict)';
    if (state.sorted && state.sorted.includes(index)) return 'var(--state-visited)';
    
    // For binary search
    if (state.left !== undefined && state.right !== undefined) {
      if (index >= state.left && index <= state.right) {
        if (index === state.mid) return 'var(--state-checking)';
        return 'var(--state-unvisited)';
      }
      return 'var(--bg-main)'; // Out of bounds
    }

    if (state.found === index) return 'var(--state-path)';

    return 'var(--state-unvisited)';
  };

  return (
    <div className="visualizer-canvas" style={{ padding: '2rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '350px' }}>
      {array.map((item, idx) => {
        const val = typeof item === 'object' ? item.price : item;
        const name = typeof item === 'object' ? item.name : '';
        const heightPercent = (val / maxVal) * 100;
        
        return (
          <motion.div
            key={idx}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              height: '100%'
            }}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              ₹{val}
            </div>
            <motion.div
              style={{
                width: '100%',
                flex: `0 0 ${Math.max(heightPercent, 5)}%`,
                backgroundColor: getBarColor(idx),
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
              animate={{ backgroundColor: getBarColor(idx) }}
            />
            {name && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', height: '40px', overflow: 'hidden', wordWrap: 'break-word', display: 'flex', alignItems: 'center' }}>
                {name}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
