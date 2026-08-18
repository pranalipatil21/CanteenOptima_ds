import React from 'react';

export default function PageHeader({ title, description, imageSrc }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '2rem', 
      marginBottom: '2rem',
      backgroundColor: 'var(--bg-card)',
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {imageSrc && (
        <div style={{ flexShrink: 0, width: '120px', height: '120px', overflow: 'hidden', borderRadius: '50%', border: '4px solid var(--accent-red-light)' }}>
          <img src={imageSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', color: 'var(--accent-red)' }}>{title}</h2>
        <p className="text-muted" style={{ fontSize: '1rem', margin: 0, maxWidth: '800px' }}>{description}</p>
      </div>
    </div>
  );
}
