import React from 'react';
import { motion } from 'framer-motion';

export default function TimelineVisualizer({ slots, state }) {
  if (!slots) return null;

  return (
    <div className="visualizer-canvas" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Current Job Info */}
      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {state && state.currentJob ? (
          <div style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="text-muted">Current Order to Schedule:</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-orange)' }}>Order {state.currentJob.id}</strong>
            <span style={{ backgroundColor: 'var(--accent-green-light)', color: 'var(--accent-green)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>Profit: ₹{state.currentJob.profit}</span>
            <span style={{ backgroundColor: 'var(--accent-red-light)', color: 'var(--accent-red)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>Deadline: {state.currentJob.deadline}</span>
          </div>
        ) : (
          <div className="text-muted">Waiting to process orders...</div>
        )}
      </div>

      {/* Timeline Slots */}
      <div>
        <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
          {slots.map((_, i) => (
            <div key={`header-${i}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
              t={i} to {i+1}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', height: '80px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {slots.map((jobInSlot, i) => {
            const isChecking = state && state.checkingSlot === i;
            const isUpdated = state && state.checkingSlot === i && state.slotUpdated;
            
            let bgColor = 'var(--bg-main)';
            let borderColor = 'var(--border-color)';
            
            if (isUpdated) {
              bgColor = 'var(--state-visited)';
              borderColor = 'var(--state-visited)';
            } else if (isChecking) {
              bgColor = 'var(--state-checking)';
              borderColor = 'var(--state-checking)';
            } else if (jobInSlot) {
              bgColor = 'var(--accent-orange-light)';
            }

            return (
              <motion.div 
                key={`slot-${i}`}
                style={{ 
                  flex: 1, 
                  borderRight: i < slots.length - 1 ? `1px solid ${borderColor}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem'
                }}
                animate={{ backgroundColor: bgColor }}
                transition={{ duration: 0.3 }}
              >
                {jobInSlot ? (
                  <>
                    <strong style={{ color: (isUpdated || isChecking) ? 'white' : 'var(--accent-orange)', fontSize: '1.1rem' }}>O-{jobInSlot.id}</strong>
                    <span style={{ color: (isUpdated || isChecking) ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontSize: '0.75rem' }}>P: {jobInSlot.profit}</span>
                  </>
                ) : (
                  <span style={{ color: isChecking ? 'white' : 'var(--text-muted)' }}>Empty</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}></div>
          <span>Empty Slot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--accent-orange-light)' }}></div>
          <span>Scheduled</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--state-checking)' }}></div>
          <span>Checking Slot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 16, height: 16, backgroundColor: 'var(--state-visited)' }}></div>
          <span>Just Assigned</span>
        </div>
      </div>
    </div>
  );
}
