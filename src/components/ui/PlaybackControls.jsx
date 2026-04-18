import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

export default function PlaybackControls({
  isPlaying,
  play,
  pause,
  nextStep,
  prevStep,
  reset,
  speed,
  setSpeed,
  currentStep,
  totalSteps,
  isFinished
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Execution Controls</h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button className="btn btn-secondary btn-icon" onClick={reset} title="Reset" disabled={currentStep === 0}>
          <RotateCcw size={20} />
        </button>
        <button className="btn btn-secondary btn-icon" onClick={prevStep} title="Previous Step" disabled={currentStep === 0}>
          <SkipBack size={20} />
        </button>
        
        {isPlaying ? (
          <button className="btn btn-primary btn-icon" onClick={pause} title="Pause">
            <Pause size={20} />
          </button>
        ) : (
          <button className="btn btn-primary btn-icon" onClick={play} title="Play" disabled={isFinished || totalSteps === 0}>
            <Play size={20} />
          </button>
        )}
        
        <button className="btn btn-secondary btn-icon" onClick={nextStep} title="Next Step" disabled={isFinished || totalSteps === 0}>
          <SkipForward size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        <span className="text-muted">Speed</span>
        <input 
          type="range" 
          min="100" 
          max="2000" 
          step="100" 
          value={2100 - speed} // Invert so sliding right is faster
          onChange={(e) => setSpeed(2100 - Number(e.target.value))}
          style={{ flex: 1, margin: '0 1rem' }}
        />
        <span className="text-muted">
          {speed <= 300 ? 'Fast' : speed >= 1500 ? 'Slow' : 'Normal'}
        </span>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
        <span className="text-muted">Step: </span>
        <strong>{totalSteps > 0 ? currentStep + 1 : 0}</strong> / {totalSteps}
      </div>
    </div>
  );
}
