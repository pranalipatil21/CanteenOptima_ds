import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Cpu, RefreshCw, AlertTriangle, 
  Database, Server, HelpCircle, HardDrive, Key, FileText, CheckCircle
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function DistributedDashboardPage() {
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
  const [uploadFilename, setUploadFilename] = useState('menu_backup.txt');
  const [uploadContent, setUploadContent] = useState('1. Burger Meals - ₹120 - Stock: 10\n2. Fries - ₹90 - Stock: 20\n3. Pizza - ₹250 - Stock: 5');

  // Blockchain State
  const [blockchain, setBlockchain] = useState([]);
  const [ledgerDifficulty, setLedgerDifficulty] = useState(2);
  const [verifyResult, setVerifyResult] = useState(null);
  const [blockchainLogs, setBlockchainLogs] = useState(['Blockchain initialized.']);

  // Gateway status fallback
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // WebSocket Ref
  const wsRef = useRef(null);

  // Fetch status of services
  const refreshAllStatuses = async () => {
    try {
      // API Gateway status
      const gatewayRes = await fetch('http://localhost:8000/api/gateway/status');
      const gatewayData = await gatewayRes.json();
      setGatewayStatus(gatewayData);

      // Berkeley Clocks
      const berkeleyRes = await fetch('http://localhost:8000/api/dist-controller/berkeley/status');
      const berkeleyData = await berkeleyRes.json();
      setBerkeleyNodes(berkeleyData.nodes || []);
      setBerkeleyLogs(berkeleyData.logs || []);

      // Elections
      const electionRes = await fetch('http://localhost:8000/api/dist-controller/election/status');
      const electionData = await electionRes.json();
      setElectionNodes(electionData.nodes || []);
      setElectionLogs(electionData.logs || []);

      // Mutex
      const mutexRes = await fetch('http://localhost:8000/api/dist-controller/mutex/status');
      const mutexData = await mutexRes.json();
      setMutexMode(mutexData.mode || 'CENTRALIZED');
      setOvenLockHolder(mutexData.ovenLockHolder);
      setOvenQueue(mutexData.ovenQueue || []);
      setMutexLogs(mutexData.logs || []);

      // DFS
      const dfsRes = await fetch('http://localhost:8000/api/dfs/status');
      const dfsData = await dfsRes.json();
      setDfsNodes(dfsData.nodes || []);
      setDfsFiles(dfsData.files || {});
      setDfsLogs(dfsData.logs || []);

      // Blockchain
      const bcRes = await fetch('http://localhost:8000/api/blockchain');
      const bcData = await bcRes.json();
      setBlockchain(bcData.chain || []);
      setLedgerDifficulty(bcData.difficulty || 2);
    } catch (err) {
      console.warn('Fallback HTTP fetch failed (services offline?):', err.message);
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
        console.warn('Monitoring WebSocket server offline. Polling HTTP instead.');
      };

      ws.onclose = () => {
        setTimeout(connectWS, 5000); // Reconnect loop
      };
    };

    connectWS();

    // Poll statuses every 3 seconds
    const interval = setInterval(refreshAllStatuses, 3000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Cristian's Sync Handler
  const triggerCristianSync = async () => {
    const t0 = Date.now();
    try {
      const res = await fetch('http://localhost:8000/api/gateway/clock');
      const t1 = Date.now();
      const data = await res.json();
      const serverTime = data.serverTime;
      const rtt = t1 - t0;
      // Cristian's Time: ServerTime + RTT/2
      const synchronizedTime = serverTime + rtt / 2;
      const offset = synchronizedTime - t1;

      setCristianResult({
        clientSent: t0,
        serverReceived: serverTime,
        clientReceived: t1,
        rtt,
        offset,
        synchronizedTime: new Date(synchronizedTime).toLocaleTimeString(),
        localTime: new Date(t1).toLocaleTimeString()
      });
    } catch (err) {
      alert(`Cristian sync failed: ${err.message}`);
    }
  };

  // Berkeley Sync Handler
  const triggerBerkeleySync = async () => {
    setBerkeleySyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/berkeley/sync', { method: 'POST' });
      const data = await res.json();
      setBerkeleyNodes(data.nodes || []);
      setBerkeleyLogs(data.logs || []);
    } catch (err) {
      alert(`Berkeley sync failed: ${err.message}`);
    } finally {
      setBerkeleySyncing(false);
    }
  };

  // Election Handlers
  const crashElectionNode = async (id) => {
    try {
      const res = await fetch('http://localhost:8000/api/dist-controller/election/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      setElectionNodes(data.nodes || []);
      refreshAllStatuses();
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
      refreshAllStatuses();
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
      refreshAllStatuses();
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
      alert('File successfully uploaded, split into blocks, and replicated!');
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
        setBlockchainLogs(prev => [...prev, 'Verification succeeded: Ledger hashes are completely secure.']);
      } else {
        setBlockchainLogs(prev => [...prev, `Verification ALERT: Tampering detected! Hash broken at Block ${data.tamperedIndex}.`]);
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
      setBlockchainLogs(prev => [...prev, `TAMPERED Block ${index}: Total value modified to ₹${newTotal}. Hash not recalculated.`]);
      refreshAllStatuses();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Distributed Systems Dashboard" 
        description="Monitor real-time microservices, execute distributed algorithms, inject faults, and audit ledger transactions." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 1: Service Registry (Beacon Heartbeats) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Server color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Service Registry (Beacon Heartbeats)</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Decentralized heartbeats register node health status. Crash instances to test fault tolerance.
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
                    <td colSpan="3" style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>No beacons active. Start backend services.</td>
                  </tr>
                ) : (
                  Object.keys(registry).map(key => {
                    const svc = registry[key];
                    let badgeColor = '#38A169';
                    if (svc.status === 'SUSPECTED_FAILED') badgeColor = '#D69E2E';
                    if (svc.status === 'DOWN') badgeColor = '#E53E3E';

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

        {/* Card 2: Distributed Events (Lamport Clocks) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Cpu color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Live Clock Event Log Stream</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Incoming logs track Lamport Clock incrementing ($L = \max(L, T) + 1$).
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
                <span style={{ fontWeight: 600 }}>{log.event}</span> - {log.message || log.url || 'API Request processed'}
              </div>
            ))}
            {logs.length === 0 && <span className="text-muted">Waiting for events from API Gateway or Kitchen Service...</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 3: Clock Synchronization (Berkeley & Cristian) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Clock Sync (Berkeley & Cristian)</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Cristian's Section */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cristian's Clock Alignment</span>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={triggerCristianSync}>
                  Sync Client
                </button>
              </div>
              <p className="text-xs text-muted">Estimate server clock offset using Round-Trip Time (RTT).</p>
              {cristianResult && (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                  <span>RTT duration:</span> <strong style={{ color: 'var(--accent-orange)' }}>{cristianResult.rtt} ms</strong>
                  <span>Calculated Offset:</span> <strong>{cristianResult.offset} ms</strong>
                  <span>Adjusted Server Time:</span> <strong>{cristianResult.synchronizedTime}</strong>
                  <span>Unsynced Local Time:</span> <strong>{cristianResult.localTime}</strong>
                </div>
              )}
            </div>

            {/* Berkeley Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Berkeley Coordinator Sync</span>
                <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={triggerBerkeleySync} disabled={berkeleySyncing}>
                  {berkeleySyncing ? 'Syncing...' : 'Poll & Sync Nodes'}
                </button>
              </div>
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Coordinator polls nodes, calculates average drift, and instructs nodes to adjust clocks.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                {berkeleyNodes.map(node => (
                  <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem', backgroundColor: 'var(--bg-main)', borderRadius: '4px' }}>
                    <span>{node.name}</span>
                    <span>Offset: <strong style={{ color: 'var(--accent-red)' }}>{node.timeOffset} ms</strong> (Adjustment: {node.lastSyncedOffset}ms)</span>
                  </div>
                ))}
              </div>

              <div style={{ 
                maxHeight: '80px', 
                overflowY: 'auto', 
                backgroundColor: 'var(--bg-sidebar)', 
                borderRadius: '4px', 
                padding: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                border: '1px solid var(--border-color)'
              }}>
                {berkeleyLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
                {berkeleyLogs.length === 0 && <span className="text-muted">Press sync to view calculations log...</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Coordinator Election (Bully & Ring) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldAlert color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Leader Election (Bully & Ring)</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Simulate node crashes in a replica set. The Bully or Ring protocol elects a new leader.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {electionNodes.map(node => (
              <div key={node.id} style={{ 
                padding: '0.5rem', 
                backgroundColor: node.status === 'ACTIVE' ? 'var(--bg-main)' : 'rgba(239, 68, 68, 0.1)', 
                border: node.isCoordinator ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                minWidth: '95px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Node {node.id}</span>
                <span style={{ fontSize: '0.65rem', color: node.status === 'ACTIVE' ? 'var(--state-checking)' : 'var(--accent-red)' }}>{node.status}</span>
                {node.isCoordinator && (
                  <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '0.125rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>LEADER</span>
                )}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {node.status === 'ACTIVE' ? (
                    <button className="btn btn-secondary" style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }} onClick={() => crashElectionNode(node.id)}>Crash</button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }} onClick={() => recoverElectionNode(node.id)}>Recover</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span>Initiate from:</span>
            <select className="input-field" style={{ padding: '0.25rem', fontSize: '0.8rem' }} value={selectedElectionNode} onChange={e => setSelectedElectionNode(Number(e.target.value))}>
              {electionNodes.filter(n => n.status === 'ACTIVE').map(n => <option key={n.id} value={n.id}>Node {n.id}</option>)}
            </select>
            <select className="input-field" style={{ padding: '0.25rem', fontSize: '0.8rem' }} value={electionType} onChange={e => setElectionType(e.target.value)}>
              <option value="bully">Bully Protocol</option>
              <option value="ring">Ring Protocol</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={startElection}>Run</button>
          </div>

          <div style={{ 
            height: '80px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '4px', 
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            border: '1px solid var(--border-color)'
          }}>
            {electionLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Card 5: Distributed Mutual Exclusion (Oven Lock) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Distributed Mutual Exclusion</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Multiple instances request a single critical section: **Premium Oven**. Choose locking protocol.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
            <button className={`btn ${mutexMode === 'CENTRALIZED' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleMutexModeChange('centralized')}>Centralized Mutex</button>
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
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => requestOvenLock('Kitchen-Node-01')}>K1 Request</button>
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => requestOvenLock('Kitchen-Node-02')}>K2 Request</button>
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => requestOvenLock('Kitchen-Node-03')}>K3 Request</button>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => releaseOvenLock(ovenLockHolder)}>Release Holder</button>
          </div>

          <div style={{ 
            height: '80px', 
            overflowY: 'auto', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '4px', 
            padding: '0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            border: '1px solid var(--border-color)'
          }}>
            {mutexLogs.slice(-10).map((log, idx) => <div key={idx}>&gt; {log}</div>)}
          </div>
        </div>

        {/* Card 6: HDFS Simulation (NameNode & DataNodes) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <HardDrive color="var(--accent-red)" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>DFS Block Store (HDFS Replication)</h3>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Files uploaded are split into blocks and replicated (RF=2) across active DataNodes.
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
              <button type="submit" className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Upload & Replicate</button>
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
            fontSize: '0.7rem',
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
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Blockchain Cryptographic Audit Ledger</h3>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
          Real SHA-256 blocks link transaction history. Modify a block's value directly to simulate a malicious database tamper, then run Verification to detect the broken hash chain.
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
              gap: '0.25rem',
              position: 'relative'
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
                    {block.transaction.tampered && <span style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: '0.65rem' }}>TAMPERED LEDGER DATA!</span>}
                  </div>
                )}
              </div>

              {block.index > 0 && !block.transaction.tampered && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.125rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)', flex: 1 }} 
                          onClick={() => tamperBlock(block.index, Math.round(block.transaction.total * 0.5))}>
                    Tamper Total (50% Off)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={verifyBlockchain}>Run Cryptographic Ledger Verification</button>
          
          {verifyResult && (
            <div style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              backgroundColor: verifyResult.isValid ? 'rgba(56, 161, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: verifyResult.isValid ? '1px solid #38A169' : '1px solid var(--accent-red)',
              color: verifyResult.isValid ? '#38A169' : 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              {verifyResult.isValid ? (
                <>
                  <CheckCircle size={16} />
                  <span>Ledger chain integrity is VALID. All blocks are secure.</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>{verifyResult.error}</span>
                </>
              )}
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
          fontSize: '0.7rem',
          border: '1px solid var(--border-color)'
        }}>
          {blockchainLogs.map((log, idx) => <div key={idx}>&gt; {log}</div>)}
        </div>
      </div>
    </div>
  );
}
