import React from 'react';
import { motion } from 'framer-motion';

export default function TableVisualizer({ data, rowLabels, colLabels, state, getCellState }) {
  if (!data || data.length === 0) return null;

  const rows = data.length;
  const cols = data[0].length;

  return (
    <div className="visualizer-canvas" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${cols}, minmax(40px, 1fr))`, minWidth: 'max-content' }}>
        {/* Top-left empty cell */}
        <div style={{ padding: '0.5rem', fontWeight: 'bold' }}></div>
        
        {/* Column Headers */}
        {colLabels.map((label, c) => (
          <div key={`col-${c}`} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
            {label}
          </div>
        ))}

        {/* Rows */}
        {data.map((row, r) => (
          <React.Fragment key={`row-${r}`}>
            {/* Row Header */}
            <div style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {rowLabels[r]}
            </div>
            
            {/* Cells */}
            {row.map((cellValue, c) => {
              const cellState = getCellState ? getCellState(r, c, state) : 'normal';
              
              let bgColor = 'var(--bg-card)';
              let color = 'var(--text-main)';
              
              if (cellState === 'current') {
                bgColor = 'var(--state-current)';
                color = '#fff';
              } else if (cellState === 'checking') {
                bgColor = 'var(--state-checking)';
                color = '#fff';
              } else if (cellState === 'updated') {
                bgColor = 'var(--state-visited)';
                color = '#fff';
              } else if (cellState === 'highlight-row-col') {
                bgColor = 'var(--accent-orange-light)';
              }

              return (
                <motion.div
                  key={`cell-${r}-${c}`}
                  style={{
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: cellState !== 'normal' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                  animate={{ backgroundColor: bgColor, color }}
                  transition={{ duration: 0.3 }}
                >
                  {cellValue === Infinity ? '∞' : cellValue}
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
