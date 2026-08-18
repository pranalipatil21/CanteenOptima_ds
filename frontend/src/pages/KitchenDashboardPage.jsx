import React, { useState, useEffect } from 'react';
import { ChefHat, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function KitchenDashboardPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/kitchen/queue');
      if (!res.ok) throw new Error('Failed to fetch kitchen orders');
      const data = await res.json();
      setQueue(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 3 seconds
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch('http://localhost:8000/api/kitchen/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchQueue(); // Refresh queue
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Kitchen Operations Dashboard" 
        description="Monitor real-time cooking pipelines, inspect order logs, and advance preparation statuses." 
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <AlertTriangle size={16} />
          <span>Connection Warning: {error}. Check if Kitchen Service is running.</span>
        </div>
      )}

      {loading && queue.length === 0 ? (
        <div className="text-center" style={{ padding: '2rem' }}>Loading active kitchen queue...</div>
      ) : queue.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
          <ChefHat size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No Active Canteen Orders</h3>
          <p className="text-sm">Place an order from the Canteen Menu to see it queue here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {queue.map(order => {
            let statusColor = '#3182CE'; // Blue for Confirmed
            if (order.status === 'PREPARING') statusColor = '#D69E2E'; // Orange
            if (order.status === 'READY') statusColor = '#38A169'; // Green

            return (
              <div key={order.orderId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: <strong>{order.orderId}</strong></span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: '#fff', 
                      backgroundColor: statusColor, 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: '4px' 
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

                  <div style={{ margin: '0.75rem 0' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Items:</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {order.items.map((item, idx) => (
                        <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          <strong>{item.quantity}</strong> × {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ margin: '0.75rem 0' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Kitchen Logs:</span>
                    <div style={{ 
                      maxHeight: '60px', 
                      overflowY: 'auto', 
                      backgroundColor: 'var(--bg-sidebar)', 
                      borderRadius: '4px', 
                      padding: '0.35rem', 
                      fontSize: '0.7rem', 
                      fontFamily: 'monospace',
                      border: '1px solid var(--border-color)'
                    }}>
                      {order.logs.map((log, lidx) => (
                        <div key={lidx}>&gt; {log}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {order.status === 'CONFIRMED' && (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }} onClick={() => updateStatus(order.orderId, 'PREPARING')}>
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem', backgroundColor: '#38A169', borderColor: '#38A169' }} onClick={() => updateStatus(order.orderId, 'READY')}>
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem', color: '#fff', backgroundColor: '#805AD5', borderColor: '#805AD5' }} onClick={() => updateStatus(order.orderId, 'COMPLETED')}>
                      Complete Order
                    </button>
                  )}
                  <button className="btn btn-secondary" style={{ padding: '0.35rem', fontSize: '0.8rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => updateStatus(order.orderId, 'CANCELLED')}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
