import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/notifications');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      // Sort reverse chronological
      setNotifications(data.reverse());
      setError(null);
    } catch (err) {
      setError(`Failed to retrieve alerts: ${err.message}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    // Poll every 3 seconds
    const interval = setInterval(() => fetchNotifications(false), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Customer Order Alerts log" 
        description="Receive real-time notification streams from the RabbitMQ Notification Service." 
      />

      {error && (
        <div className="connection-error" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={20} />
          <div>
            <span style={{ fontWeight: 600 }}>Connection Notice:</span> {error}
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }} onClick={() => fetchNotifications(true)}>
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'inherit' }}>Notification Inbox</h3>
            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <RefreshCw size={12} className="spinner" style={{ animationDuration: '6s' }} /> Live tracking enabled
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map((notif, idx) => (
              <div key={idx} className="card" style={{ 
                display: 'flex', 
                alignItems: 'start', 
                gap: '1rem', 
                padding: '1rem 1.25rem',
                borderLeft: '4px solid var(--accent-red)'
              }}>
                <div style={{ backgroundColor: 'var(--accent-red-light)', padding: '0.5rem', borderRadius: '50%', color: 'var(--accent-red)' }}>
                  <Bell size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-orange)' }}>
                      [Lamport Stamp: {notif.lamportClock || 0}]
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {notif.message || `Order status updated: ${notif.status}`}
                  </p>
                  <span className="text-xs text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                    Origin Node: {notif.service || 'notification-service'} ({notif.instance || 'instance-01'})
                  </span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="card" style={{ padding: '3rem 0', textAlign: 'center' }}>
                <Info size={36} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
                <p className="text-sm text-muted">No notifications received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
