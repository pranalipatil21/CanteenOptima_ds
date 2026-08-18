import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 8006;
const INSTANCE_ID = process.env.INSTANCE_ID || 'dist-controller-01';
const startTime = Date.now();

// 1. Clock Synchronization State
const berkeleyNodes = [
  { id: 'counter-01', name: 'Counter 1 (Main Canteen)', timeOffset: 5000, lastSyncedOffset: 0 },
  { id: 'counter-02', name: 'Counter 2 (Library Cafe)', timeOffset: -8000, lastSyncedOffset: 0 },
  { id: 'counter-03', name: 'Counter 3 (Sports Arena)', timeOffset: 12000, lastSyncedOffset: 0 },
  { id: 'counter-04', name: 'Counter 4 (Hostel Diner)', timeOffset: -3000, lastSyncedOffset: 0 },
];
let berkeleyLogs = [];

// 2. Lamport & Vector Clocks Logs
const clockEvents = [
  { id: 'ev-1', event: 'ORDER_PLACED', service: 'order-service', lamport: 1, vector: [1, 0, 0], details: 'Placed Burger Order #ORD-8261' },
  { id: 'ev-2', event: 'KITCHEN_RECEIVED', service: 'kitchen-service', lamport: 2, vector: [1, 1, 0], details: 'Kitchen took Order #ORD-8261. Lamport = max(1, 1) + 1 = 2' },
  { id: 'ev-3', event: 'NOTIFICATION_SENT', service: 'notification-service', lamport: 3, vector: [1, 1, 1], details: 'Notified customer. Lamport = max(2, 2) + 1 = 3' }
];

// 3. P2P Logs
const p2pLogs = [];

// 4. Election Nodes State
let electionNodes = [
  { id: 1, name: 'Kitchen Node 1', status: 'ACTIVE', isCoordinator: false },
  { id: 2, name: 'Kitchen Node 2', status: 'ACTIVE', isCoordinator: false },
  { id: 3, name: 'Kitchen Node 3', status: 'ACTIVE', isCoordinator: false },
  { id: 4, name: 'Kitchen Node 4', status: 'ACTIVE', isCoordinator: false },
  { id: 5, name: 'Kitchen Node 5', status: 'ACTIVE', isCoordinator: true }
];
let electionLogs = ['System initialized. Highest Node 5 elected coordinator.'];

// 5. Mutual Exclusion: Premium Oven Lock State
let ovenLockHolder = null;
let ovenQueue = [];
let mutualExclusionMode = 'CENTRALIZED'; // CENTRALIZED, RICART_AGRAWALA, TOKEN_RING
let tokenRingHolderIndex = 0;
let mutexLogs = ['Oven initialized. Lock is currently FREE.'];

// 6. Beacon Protocols (Heartbeats)
const activeBeacons = {};

// Helper to log coordinator actions
function logElection(msg) {
  electionLogs.push(msg);
  if (electionLogs.length > 50) electionLogs.shift();
  console.log(`[Election] ${msg}`);
}

// Bully Election Logic
function runBullyElection(startNodeId) {
  logElection(`Bully election initiated by Node ${startNodeId}...`);
  const starter = electionNodes.find(n => n.id === startNodeId);
  if (!starter || starter.status === 'DOWN') {
    logElection(`Error: Node ${startNodeId} is DOWN or invalid.`);
    return;
  }

  // Find all higher active nodes
  const higherNodes = electionNodes.filter(n => n.id > startNodeId && n.status === 'ACTIVE');
  if (higherNodes.length === 0) {
    // No higher active node, this node becomes coordinator
    electionNodes.forEach(n => n.isCoordinator = false);
    starter.isCoordinator = true;
    logElection(`No higher active nodes responded. Node ${starter.id} elects itself as coordinator!`);
  } else {
    logElection(`Node ${startNodeId} sends ELECTION messages to higher nodes: ${higherNodes.map(n => n.id).join(', ')}`);
    higherNodes.forEach(n => {
      logElection(`Node ${n.id} sends OK message back to Node ${startNodeId}`);
    });
    // Find the highest active node in the system
    const highestActive = [...electionNodes]
      .filter(n => n.status === 'ACTIVE')
      .sort((a, b) => b.id - a.id)[0];
      
    if (highestActive) {
      electionNodes.forEach(n => n.isCoordinator = false);
      highestActive.isCoordinator = true;
      logElection(`Node ${highestActive.id} wins Bully election. Elected Coordinator!`);
    }
  }
}

// Ring Election Logic
function runRingElection(startNodeId) {
  logElection(`Ring election initiated by Node ${startNodeId}...`);
  
  // Collect active nodes in logical ring (1 -> 2 -> 3 -> 4 -> 5 -> 1)
  const activeIds = electionNodes.filter(n => n.status === 'ACTIVE').map(n => n.id);
  if (activeIds.length === 0) {
    logElection('No active nodes to elect.');
    return;
  }
  
  let currentId = startNodeId;
  const list = [currentId];
  logElection(`Node ${currentId} starts ring token. List: [${list.join(', ')}]`);
  
  // Simulate token passing around the ring
  for (let i = 1; i < electionNodes.length; i++) {
    const nextNodeIndex = (electionNodes.findIndex(n => n.id === currentId) + 1) % electionNodes.length;
    const nextNode = electionNodes[nextNodeIndex];
    if (nextNode.status === 'ACTIVE') {
      currentId = nextNode.id;
      list.push(currentId);
      logElection(`Node ${currentId} appends ID. List: [${list.join(', ')}]`);
    } else {
      logElection(`Node ${nextNode.id} is offline. Skipping to next node.`);
    }
  }
  
  const winnerId = Math.max(...list);
  const winner = electionNodes.find(n => n.id === winnerId);
  electionNodes.forEach(n => n.isCoordinator = false);
  winner.isCoordinator = true;
  logElection(`Ring token returned to Node ${startNodeId}. Highest ID found: ${winnerId}. Node ${winnerId} is elected coordinator!`);
}

const app = express();
app.use(cors());
app.use(express.json());

// Status
app.get('/status', (req, res) => {
  res.json({
    status: 'UP',
    service: 'distributed-controller',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000)
  });
});

// ================= CLOCK SYNCHRONIZATION =================

// Cristian's clock endpoint
app.get('/clock', (req, res) => {
  res.json({ time: Date.now() });
});

// Berkeley algorithm sync trigger
app.post('/berkeley/sync', (req, res) => {
  berkeleyLogs = [];
  const coordTime = Date.now();
  berkeleyLogs.push(`Coordinator clock reads: ${new Date(coordTime).toLocaleTimeString()}`);
  
  // Poll nodes
  const differences = berkeleyNodes.map(node => {
    const nodeTime = coordTime + node.timeOffset;
    const diff = nodeTime - coordTime;
    berkeleyLogs.push(`Polled '${node.name}': Offset diff = ${diff}ms`);
    return { ...node, diff };
  });

  // Calculate average diff (including coordinator = 0)
  const totalDiff = differences.reduce((sum, n) => sum + n.diff, 0);
  const avgDiff = Math.round(totalDiff / (berkeleyNodes.length + 1));
  berkeleyLogs.push(`Calculated average difference: ${avgDiff}ms`);

  // Calculate corrections and adjust offsets
  berkeleyNodes.forEach(node => {
    const nodeDiff = node.timeOffset;
    // Correction = avgDiff - nodeDiff
    const correction = avgDiff - nodeDiff;
    node.lastSyncedOffset = correction;
    node.timeOffset += correction; // Adjust node physical clock
    berkeleyLogs.push(`Node '${node.name}' correction: ${correction}ms. New Offset: ${node.timeOffset}ms`);
  });

  res.json({
    avgDiff,
    nodes: berkeleyNodes,
    logs: berkeleyLogs
  });
});

app.get('/berkeley/status', (req, res) => {
  res.json({
    nodes: berkeleyNodes,
    logs: berkeleyLogs
  });
});

// ================= ELECTION ALGORITHMS =================

app.get('/election/status', (req, res) => {
  res.json({
    nodes: electionNodes,
    logs: electionLogs
  });
});

app.post('/election/crash', (req, res) => {
  const { id } = req.body;
  const node = electionNodes.find(n => n.id === Number(id));
  if (!node) return res.status(404).json({ error: 'Node not found' });
  
  node.status = 'DOWN';
  const wasLeader = node.isCoordinator;
  node.isCoordinator = false;
  
  logElection(`Node ${id} has crashed!`);
  if (wasLeader) {
    logElection(`Coordinator Node ${id} failed. Active nodes must start leader election!`);
  }
  res.json({ nodes: electionNodes });
});

app.post('/election/recover', (req, res) => {
  const { id } = req.body;
  const node = electionNodes.find(n => n.id === Number(id));
  if (!node) return res.status(404).json({ error: 'Node not found' });
  
  node.status = 'ACTIVE';
  logElection(`Node ${id} recovered.`);
  // Bully rule: when a higher node recovers, it triggers an election
  runBullyElection(node.id);
  res.json({ nodes: electionNodes });
});

app.post('/election/start', (req, res) => {
  const { startNodeId, type } = req.body;
  if (type === 'bully') {
    runBullyElection(Number(startNodeId));
  } else {
    runRingElection(Number(startNodeId));
  }
  res.json({ nodes: electionNodes, logs: electionLogs });
});

// ================= MUTUAL EXCLUSION =================

app.get('/mutex/status', (req, res) => {
  res.json({
    mode: mutualExclusionMode,
    ovenLockHolder,
    ovenQueue,
    logs: mutexLogs
  });
});

app.post('/mutex/mode', (req, res) => {
  const { mode } = req.body;
  mutualExclusionMode = mode.toUpperCase();
  // Reset Oven locks
  ovenLockHolder = null;
  ovenQueue = [];
  mutexLogs.push(`Mutex mode changed to: ${mutualExclusionMode}`);
  res.json({ mode: mutualExclusionMode, logs: mutexLogs });
});

// Request Oven lock
app.post('/mutex/oven/request', (req, res) => {
  const { nodeName } = req.body;
  mutexLogs.push(`Node '${nodeName}' requests Premium Oven access.`);

  if (mutualExclusionMode === 'CENTRALIZED') {
    if (ovenLockHolder === null) {
      ovenLockHolder = nodeName;
      mutexLogs.push(`Coordinator: Oven lock GRANTED to '${nodeName}'.`);
    } else {
      ovenQueue.push(nodeName);
      mutexLogs.push(`Coordinator: Oven is busy. '${nodeName}' added to wait queue: [${ovenQueue.join(', ')}]`);
    }
  } else if (mutualExclusionMode === 'RICART_AGRAWALA') {
    const ticket = Date.now();
    mutexLogs.push(`[Ricart-Agrawala] Node '${nodeName}' broadcasts REQUEST message with Timestamp: ${ticket}`);
    
    // Check if anyone holds lock
    if (ovenLockHolder === null) {
      ovenLockHolder = nodeName;
      mutexLogs.push(`[Ricart-Agrawala] All other nodes replied OK. Node '${nodeName}' enters CRITICAL SECTION.`);
    } else {
      ovenQueue.push(nodeName);
      mutexLogs.push(`[Ricart-Agrawala] Lock is held by '${ovenLockHolder}'. Request from '${nodeName}' deferred.`);
    }
  } else if (mutualExclusionMode === 'TOKEN_RING') {
    mutexLogs.push(`[Token Ring] Node '${nodeName}' requests token to enter critical section.`);
    if (ovenLockHolder === null) {
      ovenLockHolder = nodeName;
      mutexLogs.push(`[Token Ring] Token acquired by '${nodeName}'. Entered CRITICAL SECTION.`);
    } else {
      ovenQueue.push(nodeName);
      mutexLogs.push(`[Token Ring] Waiting for token to circulate. Added to queue: [${ovenQueue.join(', ')}]`);
    }
  }

  res.json({ ovenLockHolder, ovenQueue, logs: mutexLogs });
});

// Release Oven lock
app.post('/mutex/oven/release', (req, res) => {
  const { nodeName } = req.body;
  if (ovenLockHolder !== nodeName) {
    return res.status(400).json({ error: 'Lock not held by this node' });
  }

  mutexLogs.push(`Node '${nodeName}' releases Premium Oven lock.`);
  ovenLockHolder = null;

  if (ovenQueue.length > 0) {
    const nextNode = ovenQueue.shift();
    ovenLockHolder = nextNode;
    mutexLogs.push(`Lock allocated to next waiting node: '${nextNode}'. Queue left: [${ovenQueue.join(', ')}]`);
  } else {
    mutexLogs.push('Premium Oven is now FREE.');
  }

  res.json({ ovenLockHolder, ovenQueue, logs: mutexLogs });
});

// ================= LOGICAL & VECTOR CLOCKS LOGS =================

app.get('/clocks/events', (req, res) => {
  res.json(clockEvents);
});

app.post('/clocks/event', (req, res) => {
  const { event, service, lamport, vector, details } = req.body;
  clockEvents.push({
    id: `ev-${Date.now()}`,
    event,
    service,
    lamport,
    vector,
    details,
    timestamp: new Date().toISOString()
  });
  if (clockEvents.length > 50) clockEvents.shift();
  res.json(clockEvents);
});

// ================= P2P COMMUNICATION =================

app.post('/p2p/send', (req, res) => {
  const { from, to, message } = req.body;
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    from,
    to,
    message,
    details: `Direct socket payload from ${from} address to ${to} counter node.`
  };
  p2pLogs.push(entry);
  if (p2pLogs.length > 30) p2pLogs.shift();
  console.log(`[P2P] ${from} -> ${to}: ${message}`);
  res.json(p2pLogs);
});

app.get('/p2p/logs', (req, res) => {
  res.json(p2pLogs);
});

app.listen(PORT, () => {
  console.log(`[REST] Distributed Controller running on port ${PORT}`);

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'distributed-controller',
          instanceId: INSTANCE_ID,
          status: 'ONLINE',
          lamportClock: 0
        })
      });
    } catch (err) {
      // ignore
    }
  }, 3000);
});
