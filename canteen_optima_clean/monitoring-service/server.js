import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 8009;
const INSTANCE_ID = process.env.INSTANCE_ID || 'monitoring-service-01';
const startTime = Date.now();

// Service Registry (Beacon Protocol)
const serviceRegistry = {};
const systemLogs = [];

// Create Server
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket Broadcaster helper
function broadcast(data) {
  const payloadStr = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payloadStr);
    }
  });
}

// Beacon Protocol check
setInterval(() => {
  const now = Date.now();
  Object.keys(serviceRegistry).forEach(serviceKey => {
    const service = serviceRegistry[serviceKey];
    if (service.status === 'ONLINE' && now - service.lastHeartbeat > 7000) {
      service.status = 'SUSPECTED_FAILED';
      const logEntry = {
        timestamp: new Date().toISOString(),
        service: 'monitoring-service',
        event: 'SERVICE_BEACON_LOST',
        message: `Heartbeat lost for service '${service.name}' instance '${service.instanceId}'. SUSPECTED FAILED.`,
        lamportClock: 0
      };
      systemLogs.push(logEntry);
      if (systemLogs.length > 50) systemLogs.shift();
      console.log(JSON.stringify(logEntry));
      
      broadcast({ type: 'LOG', data: logEntry });
      broadcast({ type: 'REGISTRY', data: serviceRegistry });
    }
  });
}, 2000);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'monitoring-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Beacon Heartbeat Receiver
app.post('/api/monitoring/heartbeat', (req, res) => {
  const { name, instanceId, status, lamportClock } = req.body;
  if (!name || !instanceId) {
    return res.status(400).json({ error: 'Missing service name or instanceId' });
  }

  const key = `${name}-${instanceId}`;
  const oldStatus = serviceRegistry[key]?.status;
  
  serviceRegistry[key] = {
    name,
    instanceId,
    status: status || 'ONLINE',
    lastHeartbeat: Date.now(),
    lamportClock: lamportClock || 0
  };

  if (oldStatus !== 'ONLINE') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: name,
      event: 'SERVICE_REGISTERED',
      message: `Instance '${instanceId}' of service '${name}' reported ONLINE.`,
      lamportClock: lamportClock || 0
    };
    systemLogs.push(logEntry);
    broadcast({ type: 'LOG', data: logEntry });
  }

  broadcast({ type: 'REGISTRY', data: serviceRegistry });
  res.json({ status: 'ACK' });
});

// Logs ingestion endpoint
app.post('/api/monitoring/log', (req, res) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...req.body
  };
  systemLogs.push(logEntry);
  if (systemLogs.length > 50) systemLogs.shift();
  
  broadcast({ type: 'LOG', data: logEntry });
  res.json({ status: 'ACK' });
});

// Get current registry status
app.get('/api/monitoring/status', (req, res) => {
  res.json({
    registry: serviceRegistry,
    logs: systemLogs
  });
});

// Setup WebSockets
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected to monitoring stream.');
  // send initial states
  ws.send(JSON.stringify({ type: 'REGISTRY', data: serviceRegistry }));
  ws.send(JSON.stringify({ type: 'LOGS_INIT', data: systemLogs }));
});

server.listen(PORT, () => {
  console.log(`[REST/WS] Monitoring Service running on port ${PORT}`);
});
