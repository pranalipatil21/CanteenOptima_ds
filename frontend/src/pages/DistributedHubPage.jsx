import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Cpu, RefreshCw, AlertTriangle, 
  Database, Server, HardDrive, Key, CheckCircle
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function DistributedHubPage() {
  // Service Registry & Logs State
  const [registry, setRegistry] = useState({});
  const [logs, setLogs] = useState([]);
  
  // Clock Sync State
  const [cristianResult, setCristianResult] = useState(null);
  const [berkeleyNodes, setBerkeleyNodes] = useState([]);
  const [berkeleyLogs, setBerkeleyLogs] = useState([]);
  const [berkeleySyncing, setBerkeleySyncing] = useState(false);

  // Election State
  const [electionNodes, setElectionNodes] = useState([]);
  const [electionLogs, setElectionLogs] = useState([]);
  const [selectedElectionNode, setSelectedElectionNode] = useState(1);
  const [electionType, setElectionType] = useState('bully');

  // Mutual Exclusion State
  const [mutexMode, setMutexMode] = useState('CENTRALIZED');
  const [ovenLockHolder, setOvenLockHolder] = useState(null);
  const [ovenQueue, setOvenQueue] = useState([]);
  const [mutexLogs, setMutexLogs] = useState([]);

  // DFS State
  const [dfsNodes, setDfsNodes] = useState([]);
  const [dfsFiles, setDfsFiles] = useState({});
  const [dfsLogs, setDfsLogs] = useState([]);
  const [uploadFilename, setUploadFilename] = useState('inventory_backup.json');
  const [uploadContent, setUploadContent] = useState('{"canteen": "Main Canteen", "last_audit": "2026-08-18", "healthy": true}');

  // Blockchain State
  const [blockchain, setBlockchain] = useState([]);
  const [ledgerDifficulty, setLedgerDifficulty] = useState(2);
  const [verifyResult, setVerifyResult] = useState(null);
  const [blockchainLogs, setBlockchainLogs] = useState(['Blockchain initialized.']);

  // WebSocket Ref
  const wsRef = useRef(null);

  // Fetch status of services
  const refreshAllStatuses = async () => {
    try {
      // Berkeley Clocks
      const berkeleyRes = await fetch('http://localhost:8000/api/dist-controller/berkeley/status');
      if (berkeleyRes.ok) {
        const berkeleyData = await berkeleyRes.json();
        setBerkeleyNodes(berkeleyData.nodes || []);
        setBerkeleyLogs(berkeleyData.logs || []);
      }

      // Elections
      const electionRes = await fetch('http://localhost:8000/api/dist-controller/election/status');
      if (electionRes.ok) {
        const electionData = await electionRes.json();
        setElectionNodes(electionData.nodes || []);
        setElectionLogs(electionData.logs || []);
      }

      // Mutex
      const mutexRes = await fetch('http://localhost:8000/api/dist-controller/mutex/status');
      if (mutexRes.ok) {
        const mutexData = await mutexRes.json();
        setMutexMode(mutexData.mode || 'CENTRALIZED');
        setOvenLockHolder(mutexData.ovenLockHolder);
        setOvenQueue(mutexData.ovenQueue || []);
        setMutexLogs(mutexData.logs || []);
      }

      // DFS
      const dfsRes = await fetch('http://localhost:8000/api/dfs/status');
      if (dfsRes.ok) {
        const dfsData = await dfsRes.json();
        setDfsNodes(dfsData.nodes || []);
        setDfsFiles(dfsData.files || {});
        setDfsLogs(dfsData.logs || []);
      }

      // Blockchain
      const bcRes = await fetch('http://localhost:8000/api/blockchain');
      if (bcRes.ok) {
        const bcData = await bcRes.json();
        setBlockchain(bcData.chain || []);
        setLedgerDifficulty(bcData.difficulty || 2);
      }
    } catch (err) {
      console.warn('Fallback HTTP fetch failed (monitoring offline?):', err.message);
    }
  };

  // Connect WebSockets
  useEffect(() => {
    refreshAllStatuses();

    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:8009');
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'REGISTRY') {
          setRegistry(message.data);
        } else if (message.type === 'LOG') {
          setLogs(prev => [...prev, message.data].slice(-30));
        } else if (message.type === 'LOGS_INIT') {
          setLogs(message.data);
        }
      };

      ws.onerror = () => {
        console.warn('WS registry offline. Fallback polling active.');
      };

      ws.onclose = () => {
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    const interval = setInterval(refreshAllStatuses, 3000);
    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Cristian's Clock Sync
  const triggerCristianSync = async () => {
    const t0 = Date.now();
    try {
      const res = await fetch('http://localhost:8000/api/gateway/clock');
      const t1 = Date.now();
      const data = await res.json();
      const serverTime = data.serverTime;
      const rtt = t1 - t0;
      const synchronizedTime = serverTime + rtt / 2;
      const offset = synchronizedTime - t1;

      setCristianResult({
        rtt,
        offset,
        synchronizedTime: new Date(synchronizedTime).toLocaleTimeString(),
        localTime: new Date(t1).toLocaleTimeString()
      });
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  // Berkeley Clock Sync
  const triggerBerkeleySync = async () => {
    setBerkeleySyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/berkeley/sync', { method: 'POST' });
      const data = await res.json();
      setBerkeleyNodes(data.nodes || []);
      setBerkeleyLogs(data.logs || []);
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setBerkeleySyncing(false);
    }
  };

  // Elections
  const crashElectionNode = async (id) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/election/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      setElectionNodes(data.nodes || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const recoverElectionNode = async (id) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/election/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      setElectionNodes(data.nodes || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const startElection = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/election/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNodeId: selectedElectionNode,
          type: electionType
        })
      });
      const data = await res.json();
      setElectionNodes(data.nodes || []);
      setElectionLogs(data.logs || []);
    } catch (err) {
      alert(err.message);
    }
  };

  // Mutex Handlers
  const handleMutexModeChange = async (mode) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/mutex/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      setMutexMode(data.mode);
      setMutexLogs(data.logs);
    } catch (err) {
      alert(err.message);
    }
  };

  const requestOvenLock = async (nodeName) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/mutex/oven/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeName })
      });
      const data = await res.json();
      setOvenLockHolder(data.ovenLockHolder);
      setOvenQueue(data.ovenQueue || []);
      setMutexLogs(data.logs || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const releaseOvenLock = async (nodeName) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/mutex/oven/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeName })
      });
      const data = await res.json();
      setOvenLockHolder(data.ovenLockHolder);
      setOvenQueue(data.ovenQueue || []);
      setMutexLogs(data.logs || []);
    } catch (err) {
      alert(err.message);
    }
  };

  // DFS Handlers
  const handleDfsUpload = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/dfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: uploadFilename, content: uploadContent })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('File uploaded, split into blocks, and replicated factor RF=2!');
      refreshAllStatuses();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const crashDfsNode = async (id) => {
    try {
      await fetch('http://localhost:8000/api/dfs/node/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      refreshAllStatuses();
    } catch (err) {
      alert(err.message);
    }
  };

  const recoverDfsNode = async (id) => {
    try {
      await fetch('http://localhost:8000/api/dfs/node/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      refreshAllStatuses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Blockchain Handlers
  const verifyBlockchain = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/blockchain/verify');
      const data = await res.json();
      setVerifyResult(data);
      if (data.isValid) {
        setBlockchainLogs(prev => [...prev, 'Verification success: Ledger hashes are completely secure.']);
      } else {
        setBlockchainLogs(prev => [...prev, `ALERT: Tampering detected! Hash broken at Block ${data.tamperedIndex}.`]);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const tamperBlock = async (index, newTotal) => {
    try {
      const res = await fetch('http://localhost:8000/api/blockchain/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, newTotal })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBlockchainLogs(prev => [...prev, `TAMPERED Block ${index}: Total value modified to ₹${newTotal}. Hash broken.`]);
      refreshAllStatuses();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Distributed Systems Hub" 
        description="Inspect active synchronization, logical clocks, coordinator elections, mutual exclusion oven locks, and block storage." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 1: Service Registry (Heartbeats) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Server color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Service Monitor (Heartbeats)</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Periodic pings monitor microservice health states. Crash services via Docker to test.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0' }}>Service</th>
                  <th>Instance ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(registry).length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>No heartbeats active. Start backend.</td>
                  </tr>
                ) : (
                  Object.keys(registry).map(key => {
                    const svc = registry[key];
                    let badgeColor = '#38A169';
                    if (svc.status === 'SUSPECTED_FAILED') badgeColor = '#D69E2E';

                    return (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{svc.name}</td>
                        <td>{svc.instanceId}</td>
                        <td>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.125rem 0.5rem', 
                            borderRadius: '4px', 
                            color: '#fff', 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: badgeColor 
                          }}>
                            {svc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: WS Event Log Stream (Lamport Clocks) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Cpu color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>WebSocket Event Log Stream</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Live messages order sequence causal dependency based on Lamport Logical Clocks.
          </p>
          <div style={{ 
            height: '220px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '8px', 
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            border: '1px solid var(--border-color)'
          }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid var(--border-color)', padding: '0.35rem 0' }}>
                <span style={{ color: 'var(--accent-orange)' }}>[L: {log.lamportClock}]</span>{' '}
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{log.service}</span>:{' '}
                <span style={{ fontWeight: 600 }}>{log.event}</span> - {log.message || log.url}
              </div>
            ))}
            {logs.length === 0 && <span className="text-muted">Waiting for events from API Gateway...</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 3: Clock Sync */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Physical Clock Sync</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Cristian's */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cristian's Sync</span>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={triggerCristianSync}>
                  Sync
                </button>
              </div>
              <p className="text-xs text-muted">Adjusts local offset using Server RTT checks.</p>
              {cristianResult && (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                  <span>RTT:</span> <strong>{cristianResult.rtt} ms</strong>
                  <span>Calculated Offset:</span> <strong>{cristianResult.offset} ms</strong>
                  <span>Aligned Time:</span> <strong>{cristianResult.synchronizedTime}</strong>
                </div>
              )}
            </div>

            {/* Berkeley */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Berkeley Sync</span>
                <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={triggerBerkeleySync} disabled={berkeleySyncing}>
                  {berkeleySyncing ? 'Syncing...' : 'Sync Counters'}
                </button>
              </div>
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Coordinator pulls counter drifts, averages them, and corrects offsets.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {berkeleyNodes.map(node => (
                  <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem', backgroundColor: 'var(--bg-main)', borderRadius: '4px' }}>
                    <span>{node.name}</span>
                    <span>Offset: <strong style={{ color: 'var(--accent-red)' }}>{node.timeOffset} ms</strong></span>
                  </div>
                ))}
              </div>

              <div style={{ 
                maxHeight: '60px', 
                overflowY: 'auto', 
                backgroundColor: 'var(--bg-sidebar)', 
                borderRadius: '4px', 
                padding: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                border: '1px solid var(--border-color)'
              }}>
                {berkeleyLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Coordinator Election */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldAlert color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Leader Election</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Inject node crashes in a replica set to trigger election routines.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {electionNodes.map(node => (
              <div key={node.id} style={{ 
                padding: '0.4rem', 
                backgroundColor: node.status === 'ACTIVE' ? 'var(--bg-main)' : 'rgba(239, 68, 68, 0.1)', 
                border: node.isCoordinator ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '90px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Node {node.id}</span>
                <span style={{ fontSize: '0.65rem', color: node.status === 'ACTIVE' ? 'var(--state-checking)' : 'var(--accent-red)' }}>{node.status}</span>
                {node.isCoordinator && (
                  <span style={{ fontSize: '0.6rem', backgroundColor: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '0.1rem', borderRadius: '4px', fontWeight: 600, marginTop: '0.25rem' }}>LEADER</span>
                )}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {node.status === 'ACTIVE' ? (
                    <button className="btn btn-secondary" style={{ padding: '0.1rem 0.25rem', fontSize: '0.6rem' }} onClick={() => crashElectionNode(node.id)}>Crash</button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '0.1rem 0.25rem', fontSize: '0.6rem' }} onClick={() => recoverElectionNode(node.id)}>Recover</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span>Trigger:</span>
            <select className="input-field" style={{ padding: '0.25rem', fontSize: '0.8rem' }} value={selectedElectionNode} onChange={e => setSelectedElectionNode(Number(e.target.value))}>
              {electionNodes.filter(n => n.status === 'ACTIVE').map(n => <option key={n.id} value={n.id}>Node {n.id}</option>)}
            </select>
            <select className="input-field" style={{ padding: '0.25rem', fontSize: '0.8rem' }} value={electionType} onChange={e => setElectionType(e.target.value)}>
              <option value="bully">Bully Protocol</option>
              <option value="ring">Ring Protocol</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={startElection}>Run</button>
          </div>

          <div style={{ 
            height: '80px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '4px', 
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            border: '1px solid var(--border-color)'
          }}>
            {electionLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 5: Mutex */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Mutual Exclusion</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Locks the campus shared Oven. Toggle Centralized, Ricart-Agrawala, or Token Ring algorithms.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button className={`btn ${mutexMode === 'CENTRALIZED' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleMutexModeChange('centralized')}>Centralized</button>
            <button className={`btn ${mutexMode === 'RICART_AGRAWALA' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleMutexModeChange('ricart_agrawala')}>Ricart-Agrawala</button>
            <button className={`btn ${mutexMode === 'TOKEN_RING' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleMutexModeChange('token_ring')}>Token Ring</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oven Lock Holder:</span>
              <strong style={{ fontSize: '1.1rem', color: ovenLockHolder ? 'var(--accent-red)' : 'var(--state-checking)' }}>
                {ovenLockHolder ? ovenLockHolder : 'FREE'}
              </strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting Queue:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {ovenQueue.length > 0 ? ovenQueue.join(' ← ') : 'Empty'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => requestOvenLock('Counter-01')}>C1 Request</button>
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => requestOvenLock('Counter-02')}>C2 Request</button>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => releaseOvenLock(ovenLockHolder)}>Release Holder</button>
          </div>

          <div style={{ 
            height: '80px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '4px', 
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            border: '1px solid var(--border-color)'
          }}>
            {mutexLogs.slice(-10).map((log, idx) => <div key={idx}>&gt; {log}</div>)}
          </div>
        </div>

        {/* Card 6: DFS Replication */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <HardDrive color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>DFS Replication (HDFS)</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Splits files into blocks and distributes to DataNodes. Auto-heals factor (RF=2) on crash.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {dfsNodes.map(node => (
              <div key={node.id} style={{ 
                padding: '0.4rem', 
                backgroundColor: node.status === 'ACTIVE' ? 'var(--bg-main)' : 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                flex: 1,
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 600 }}>{node.name.split(' ')[0]}</div>
                <div style={{ fontSize: '0.65rem', color: node.status === 'ACTIVE' ? 'var(--state-checking)' : 'var(--accent-red)' }}>{node.status}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Blocks: {node.blockCount}</div>
                <div style={{ marginTop: '0.25rem' }}>
                  {node.status === 'ACTIVE' ? (
                    <button className="btn btn-secondary" style={{ padding: '0.1rem 0.25rem', fontSize: '0.6rem' }} onClick={() => crashDfsNode(node.id)}>Crash</button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '0.1rem 0.25rem', fontSize: '0.6rem' }} onClick={() => recoverDfsNode(node.id)}>Recover</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleDfsUpload} style={{ backgroundColor: 'var(--bg-main)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <input type="text" className="input-field" style={{ padding: '0.2rem', fontSize: '0.75rem', flex: 1 }} value={uploadFilename} onChange={e => setUploadFilename(e.target.value)} placeholder="filename" />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Upload</button>
            </div>
            <textarea className="input-field" style={{ width: '100%', height: '40px', fontSize: '0.7rem', padding: '0.2rem' }} value={uploadContent} onChange={e => setUploadContent(e.target.value)} />
          </form>

          <div style={{ 
            height: '80px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '4px', 
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            border: '1px solid var(--border-color)'
          }}>
            {dfsLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
          </div>
        </div>
      </div>

      {/* Row 4: Blockchain Ledger Auditing */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Database color="var(--accent-red)" size={20} />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Blockchain Cryptographic Audit Ledger</h3>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
          Real SHA-256 blocks link transaction history. Modify a block total directly to simulate database tampering, then run Verification to check.
        </p>

        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
          {blockchain.map((block, idx) => (
            <div key={block.index} style={{ 
              minWidth: '220px', 
              padding: '1rem', 
              backgroundColor: block.transaction.tampered ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-main)', 
              border: block.transaction.tampered ? '2px dashed var(--accent-red)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Block #{block.index}</span>
                <span className="text-muted">Nonce: {block.nonce}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0.25rem 0' }}></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Prev Hash:</strong> <span style={{ fontFamily: 'monospace' }}>{block.previousHash.slice(0, 10)}...</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Hash:</strong> <span style={{ fontFamily: 'monospace', color: block.transaction.tampered ? 'var(--accent-red)' : 'var(--state-checking)' }}>{block.hash.slice(0, 10)}...</span></div>
              
              <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                {block.index === 0 ? (
                  <span>{block.transaction.message}</span>
                ) : (
                  <div>
                    <strong>Order ID:</strong> {block.transaction.orderId}<br/>
                    <strong>Total Value:</strong> ₹{block.transaction.total}<br/>
                    <strong>Customer:</strong> {block.transaction.customerName}<br/>
                    {block.transaction.tampered && <span style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '0.65rem' }}>TAMPERED!</span>}
                  </div>
                )}
              </div>

              {block.index > 0 && !block.transaction.tampered && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.125rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)', flex: 1 }} 
                          onClick={() => tamperBlock(block.index, Math.round(block.transaction.total * 0.5))}>
                    Tamper Total
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={verifyBlockchain}>Verify Ledger Integrity</button>
          
          {verifyResult && (
            <div style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              backgroundColor: verifyResult.isValid ? 'rgba(56, 161, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: verifyResult.isValid ? '1px solid #38A169' : '1px solid var(--accent-red)',
              color: verifyResult.isValid ? '#38A169' : 'var(--accent-red)',
              fontSize: '0.85rem'
            }}>
              {verifyResult.isValid ? 'Ledger chain integrity is VALID. All blocks secure.' : verifyResult.error}
            </div>
          )}
        </div>

        <div style={{ 
          marginTop: '1rem',
          maxHeight: '80px', 
          overflowY: 'auto', 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRadius: '4px', 
          padding: '0.5rem',
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          border: '1px solid var(--border-color)'
        }}>
          {blockchainLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
        </div>
      </div>
    </div>
  );
}
