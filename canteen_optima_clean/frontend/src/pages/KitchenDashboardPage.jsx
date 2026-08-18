import React, { useState, useEffect } from 'react';
import { ChefHat, RefreshCw, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function KitchenDashboardPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Poll Kitchen queue
  const fetchQueue = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/kitchen/queue');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setQueue(data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch kitchen queue: ${err.message}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(true);
    // Poll every 2 seconds for real-time state machine changes
    const interval = setInterval(() => fetchQueue(false), 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#3182CE'; // Blue
      case 'PREPARING': return '#D69E2E'; // Orange/Yellow
      case 'READY': return '#38A169'; // Green
      case 'COMPLETED': return '#805AD5'; // Purple
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Live Kitchen Cooking Queue" 
        description="Monitor order preparation timelines and state machine transitions in real-time." 
      />

      {error && (
        <div className="connection-error" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={20} />
          <div>
            <span style={{ fontWeight: 600 }}>Connection Notice:</span> {error}
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }} onClick={() => fetchQueue(true)}>
              <RefreshCw size={12} style={{ marginRight: '0.25rem' }} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'inherit' }}>Active Cooking Orders</h3>
            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <RefreshCw size={12} className="spinner" style={{ animationDuration: '4s' }} /> Auto-refreshing every 2s
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="card" style={{ padding: '3rem 0', textAlign: 'center' }}>
              <ChefHat size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
              <p className="text-sm text-muted">
                No orders are currently in the queue. Place some orders from the Menu Catalog!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {queue.map(order => (
                <div key={order.orderId} className="card" style={{ 
                  borderTop: `4px solid ${getStatusColor(order.status)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{order.orderId}</strong>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        color: '#fff',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(order.status)
                      }}>
                        {order.status}
                      </span>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                      <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Items to Prepare:</span>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.85rem' }}>
                        {order.items.map((item, idx) => (
                          <li key={idx} style={{ margin: '0.25rem 0' }}>
                            <strong>{item.quantity}x</strong> {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <Clock size={12} />
                      <span>Received at {new Date(order.receivedAt).toLocaleTimeString()}</span>
                    </div>

                    <div style={{ 
                      maxHeight: '80px', 
                      overflowY: 'auto', 
                      backgroundColor: 'var(--bg-main)', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      fontFamily: 'monospace', 
                      fontSize: '0.7rem',
                      border: '1px solid var(--border-color)' 
                    }}>
                      {order.logs.map((log, idx) => (
                        <div key={idx} style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', padding: '0.15rem 0' }}>
                          &gt; {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
