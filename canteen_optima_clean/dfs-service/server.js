import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 8007;
const INSTANCE_ID = process.env.INSTANCE_ID || 'dfs-service-01';
const startTime = Date.now();

// HDFS Simulation State
const dataNodes = [
  { id: 'datanode-01', name: 'DataNode 1 (Hostel Block)', status: 'ACTIVE', blocks: {} },
  { id: 'datanode-02', name: 'DataNode 2 (Library Block)', status: 'ACTIVE', blocks: {} },
  { id: 'datanode-03', name: 'DataNode 3 (Admin Block)', status: 'ACTIVE', blocks: {} }
];

const files = {}; // filename -> { size, blocks: [ { blockId, data, replicas: [] } ] }
const dfsLogs = ['HDFS System initialized. NameNode active. Replication Factor = 2.'];

function logDfs(msg) {
  dfsLogs.push(msg);
  if (dfsLogs.length > 50) dfsLogs.shift();
  console.log(`[HDFS] ${msg}`);
}

// Auto Re-Replication check
function checkReplication() {
  const activeNodes = dataNodes.filter(d => d.status === 'ACTIVE');
  if (activeNodes.length === 0) return;

  Object.keys(files).forEach(filename => {
    const file = files[filename];
    file.blocks.forEach(block => {
      // Filter out crashed replicas
      const activeReplicas = block.replicas.filter(nodeId => {
        const node = dataNodes.find(d => d.id === nodeId);
        return node && node.status === 'ACTIVE';
      });

      // Under-replicated!
      if (activeReplicas.length < 2 && activeReplicas.length > 0) {
        logDfs(`Block ${block.blockId} of '${filename}' is under-replicated (Replicas: ${activeReplicas.length}/2)`);
        
        // Find another active node that doesn't have this block
        const candidateNode = activeNodes.find(node => !activeReplicas.includes(node.id));
        if (candidateNode) {
          candidateNode.blocks[block.blockId] = block.data;
          block.replicas = [...activeReplicas, candidateNode.id];
          logDfs(`NameNode triggered re-replication: Copied block ${block.blockId} to '${candidateNode.name}'`);
        }
      }
    });
  });
}

// Run replication checker periodically (every 5 seconds)
setInterval(checkReplication, 5000);

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'dfs-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Upload File
app.post('/dfs/upload', (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  // Split content into mock blocks (lines)
  const lines = content.split('\n').filter(l => l.trim() !== '');
  const blockSize = 3; // 3 lines per block
  const blockList = [];
  
  let blockIndex = 0;
  for (let i = 0; i < lines.length; i += blockSize) {
    const blockData = lines.slice(i, i + blockSize).join('\n');
    const blockId = `blk_${name.replace(/\.[^/.]+$/, "")}_${blockIndex++}`;
    blockList.push({
      blockId,
      data: blockData,
      replicas: []
    });
  }

  // Distribute blocks
  const activeNodes = dataNodes.filter(d => d.status === 'ACTIVE');
  if (activeNodes.length < 2) {
    return res.status(500).json({ error: 'Not enough active DataNodes to satisfy Replication Factor of 2' });
  }

  logDfs(`Uploading file '${name}' size: ${content.length} bytes, split into ${blockList.length} blocks.`);

  blockList.forEach(block => {
    // Select 2 random active nodes
    const shuffled = [...activeNodes].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, 2);
    
    targets.forEach(node => {
      node.blocks[block.blockId] = block.data;
      block.replicas.push(node.id);
    });
    logDfs(`Block ${block.blockId} replicated on nodes: ${targets.map(n => n.name).join(', ')}`);
  });

  files[name] = {
    size: content.length,
    blocks: blockList,
    uploadedAt: new Date().toISOString()
  };

  res.json({ message: 'File uploaded and replicated successfully', file: files[name] });
});

// Get HDFS Status
app.get('/dfs/status', (req, res) => {
  res.json({
    nodes: dataNodes.map(node => ({
      id: node.id,
      name: node.name,
      status: node.status,
      blockCount: Object.keys(node.blocks).length,
      blocks: Object.keys(node.blocks)
    })),
    files,
    logs: dfsLogs
  });
});

// Crash DataNode
app.post('/dfs/node/crash', (req, res) => {
  const { id } = req.body;
  const node = dataNodes.find(d => d.id === id);
  if (!node) return res.status(404).json({ error: 'DataNode not found' });

  node.status = 'DOWN';
  logDfs(`DataNode '${node.name}' went OFFLINE. Blocks stored are temporarily inaccessible.`);
  // Trigger immediate replication check
  checkReplication();
  res.json({ message: 'Node crashed', nodes: dataNodes });
});

// Recover DataNode
app.post('/dfs/node/recover', (req, res) => {
  const { id } = req.body;
  const node = dataNodes.find(d => d.id === id);
  if (!node) return res.status(404).json({ error: 'DataNode not found' });

  node.status = 'ACTIVE';
  logDfs(`DataNode '${node.name}' recovered. Synced with NameNode.`);
  res.json({ message: 'Node recovered', nodes: dataNodes });
});

// Read file contents by consolidating blocks
app.get('/dfs/file/:name', (req, res) => {
  const file = files[req.params.name];
  if (!file) return res.status(404).json({ error: 'File not found' });

  const contentArray = [];
  let readSuccess = true;
  const errors = [];

  file.blocks.forEach(block => {
    // Find an active replica
    const activeNodeId = block.replicas.find(nodeId => {
      const node = dataNodes.find(d => d.id === nodeId);
      return node && node.status === 'ACTIVE';
    });

    if (activeNodeId) {
      const node = dataNodes.find(d => d.id === activeNodeId);
      contentArray.push(node.blocks[block.blockId]);
    } else {
      readSuccess = false;
      errors.push(`Block ${block.blockId} is missing (All replicas offline!)`);
    }
  });

  if (!readSuccess) {
    return res.status(500).json({ error: 'HDFS read failed. Some blocks are offline.', errors });
  }

  res.json({
    filename: req.params.name,
    content: contentArray.join('\n')
  });
});

app.listen(PORT, () => {
  console.log(`[REST] DFS Service running on port ${PORT}`);

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'dfs-service',
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
