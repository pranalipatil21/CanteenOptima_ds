import express from 'express';
import cors from 'cors';
import axios from 'axios';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const OPTIMIZATION_GRPC_ADDR = process.env.OPTIMIZATION_GRPC_ADDR || 'localhost:50051';
const PROTO_PATH = path.resolve(__dirname, 'protos/optimization.proto');
const INSTANCE_ID = process.env.INSTANCE_ID || 'api-gateway-01';
const startTime = Date.now();

// State variables for monitoring
let lamportClock = 0;
const systemLogs = [];

function logEvent(service, event, details = {}) {
  lamportClock++;
  const logEntry = {
    timestamp: new Date().toISOString(),
    service,
    instance: INSTANCE_ID,
    event,
    lamportClock,
    ...details
  };
  systemLogs.push(logEntry);
  if (systemLogs.length > 100) systemLogs.shift(); // keep last 100 logs
  console.log(JSON.stringify(logEntry));
  return logEntry;
}

// Circuit Breaker Implementation
class CircuitBreaker {
  constructor(serviceName, threshold = 3, cooldown = 8000) {
    this.serviceName = serviceName;
    this.threshold = threshold;
    this.cooldown = cooldown;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(asyncFunc) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.cooldown) {
        this.state = 'HALF-OPEN';
        logEvent('api-gateway', 'CIRCUIT_BREAKER_HALF_OPEN', { targetService: this.serviceName });
      } else {
        logEvent('api-gateway', 'CIRCUIT_BREAKER_BLOCKED', { targetService: this.serviceName });
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await asyncFunc();
      this.reset();
      return result;
    } catch (err) {
      this.handleFailure();
      throw err;
    }
  }

  reset() {
    if (this.state !== 'CLOSED') {
      logEvent('api-gateway', 'CIRCUIT_BREAKER_CLOSED', { targetService: this.serviceName });
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    logEvent('api-gateway', 'SERVICE_REQUEST_FAILED', { targetService: this.serviceName, failureCount: this.failureCount });

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      logEvent('api-gateway', 'CIRCUIT_BREAKER_OPEN', { targetService: this.serviceName, cooldown: this.cooldown });
    }
  }

  getStatus() {
    return {
      service: this.serviceName,
      state: this.state,
      failures: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
    };
  }
}

const optimizationCB = new CircuitBreaker('optimization-service');
const orderCB = new CircuitBreaker('order-service');
const menuCB = new CircuitBreaker('menu-service');
const kitchenCB = new CircuitBreaker('kitchen-service');

// Retry helper with exponential backoff
async function retryRequest(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    logEvent('api-gateway', 'RETRYING_REQUEST', { retriesLeft: retries, waitMs: delay });
    await new Promise(res => setTimeout(res, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
}

// Load Proto & Setup gRPC Client
let grpcClient = null;
try {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  const optimizationProto = grpc.loadPackageDefinition(packageDefinition).optimization;
  grpcClient = new optimizationProto.OptimizationService(OPTIMIZATION_GRPC_ADDR, grpc.credentials.createInsecure());
  console.log(`[gRPC Client] Connected to Optimization Service at ${OPTIMIZATION_GRPC_ADDR}`);
} catch (e) {
  console.error(`[gRPC Client] Failed to load grpc: ${e.message}`);
}

const app = express();
app.use(cors());
app.use(express.json());

// Log Middleware
app.use((req, res, next) => {
  logEvent('api-gateway', 'INCOMING_REQUEST', { method: req.method, url: req.url });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'api-gateway',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Gateway Status (Circuit Breakers, Clocks, Logs)
app.get('/api/gateway/status', (req, res) => {
  res.json({
    lamportClock,
    circuitBreakers: {
      optimization: optimizationCB.getStatus(),
      order: orderCB.getStatus(),
      menu: menuCB.getStatus(),
      kitchen: kitchenCB.getStatus()
    },
    logs: systemLogs.slice(-30) // last 30 logs
  });
});

// Clock endpoint for Cristian's Algorithm
app.get('/api/gateway/clock', (req, res) => {
  res.json({
    serverTime: Date.now()
  });
});

// API Gateway routes to Optimization Service (using gRPC by default)
app.post('/api/optimization/dijkstra', async (req, res) => {
  const runDijkstraGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      
      const payload = {
        startNode: req.body.startNode || 'Kitchen',
        targetNode: req.body.targetNode || '',
        nodesJson: JSON.stringify(req.body.nodes),
        edgesJson: JSON.stringify(req.body.edges)
      };

      // Set a timeout of 5 seconds
      const deadline = new Date(Date.now() + 5000);
      grpcClient.RunDijkstra(payload, { deadline }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(response.resultJson));
        }
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runDijkstraGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    logEvent('api-gateway', 'ROUTE_FAILED', { path: '/api/optimization/dijkstra', error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimization/floyd-warshall', async (req, res) => {
  const runFWGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      const payload = {
        nodesJson: JSON.stringify(req.body.nodes),
        edgesJson: JSON.stringify(req.body.edges)
      };
      const deadline = new Date(Date.now() + 5000);
      grpcClient.RunFloydWarshall(payload, { deadline }, (err, response) => {
        if (err) reject(err);
        else resolve(JSON.parse(response.resultJson));
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runFWGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimization/tsp', async (req, res) => {
  const runTSPGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      const payload = {
        nodesJson: JSON.stringify(req.body.nodes),
        edgesJson: JSON.stringify(req.body.edges)
      };
      const deadline = new Date(Date.now() + 8000);
      grpcClient.RunTSP(payload, { deadline }, (err, response) => {
        if (err) reject(err);
        else resolve(JSON.parse(response.resultJson));
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runTSPGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimization/job-scheduling', async (req, res) => {
  const runJSGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      const payload = {
        jobsJson: JSON.stringify(req.body.jobs)
      };
      const deadline = new Date(Date.now() + 5000);
      grpcClient.RunJobScheduling(payload, { deadline }, (err, response) => {
        if (err) reject(err);
        else resolve(JSON.parse(response.resultJson));
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runJSGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimization/knapsack', async (req, res) => {
  const runKnapsackGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      const payload = {
        capacity: req.body.capacity,
        itemsJson: JSON.stringify(req.body.items)
      };
      const deadline = new Date(Date.now() + 5000);
      grpcClient.RunKnapsack(payload, { deadline }, (err, response) => {
        if (err) reject(err);
        else resolve(JSON.parse(response.resultJson));
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runKnapsackGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/optimization/graph-coloring', async (req, res) => {
  const runColoringGrpc = () => {
    return new Promise((resolve, reject) => {
      if (!grpcClient) return reject(new Error('gRPC client not initialized'));
      const payload = {
        nodesJson: JSON.stringify(req.body.nodes),
        edgesJson: JSON.stringify(req.body.edges),
        m: req.body.m
      };
      const deadline = new Date(Date.now() + 5000);
      grpcClient.RunGraphColoring(payload, { deadline }, (err, response) => {
        if (err) reject(err);
        else resolve(JSON.parse(response.resultJson));
      });
    });
  };

  try {
    const states = await optimizationCB.execute(() => retryRequest(runColoringGrpc, 2, 500));
    res.json({ states });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy routes for other services (to be added)
const SERVICES_MAP = {
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:8001',
  menu: process.env.MENU_SERVICE_URL || 'http://localhost:8002',
  kitchen: process.env.KITCHEN_SERVICE_URL || 'http://localhost:8003',
  distController: process.env.DIST_CONTROLLER_URL || 'http://localhost:8006',
  dfs: process.env.DFS_SERVICE_URL || 'http://localhost:8007',
  blockchain: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:8008',
  monitoring: process.env.MONITORING_SERVICE_URL || 'http://localhost:8009'
};

// Generic Proxy Handler with Circuit Breaker
async function handleProxy(req, res, targetUrl, cbInstance) {
  const config = {
    method: req.method,
    url: `${targetUrl}${req.path}`,
    data: req.body,
    headers: req.headers,
    timeout: 6000 // 6 seconds timeout
  };

  const executeCall = () => {
    return axios(config);
  };

  try {
    const response = await cbInstance.execute(() => retryRequest(executeCall, 2, 500));
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    const msg = err.response ? err.response.data : err.message;
    res.status(status).json({ error: msg });
  }
}

app.all('/api/orders*', (req, res) => {
  // strip /api
  req.path = req.path.replace(/^\/api/, '');
  handleProxy(req, res, SERVICES_MAP.order, orderCB);
});

app.all('/api/menu*', (req, res) => {
  req.path = req.path.replace(/^\/api/, '');
  handleProxy(req, res, SERVICES_MAP.menu, menuCB);
});

app.all('/api/kitchen*', (req, res) => {
  req.path = req.path.replace(/^\/api/, '');
  handleProxy(req, res, SERVICES_MAP.kitchen, kitchenCB);
});

app.all('/api/dist-controller*', (req, res) => {
  req.path = req.path.replace(/^\/api\/dist-controller/, '');
  // Skip Circuit Breaker for distributed controller status page to allow debugging
  const executeCall = () => axios({
    method: req.method,
    url: `${SERVICES_MAP.distController}${req.path}`,
    data: req.body,
    timeout: 5000
  });
  executeCall()
    .then(response => res.status(response.status).json(response.data))
    .catch(err => res.status(err.response ? err.response.status : 500).json({ error: err.message }));
});

app.all('/api/dfs*', (req, res) => {
  req.path = req.path.replace(/^\/api/, '');
  const executeCall = () => axios({
    method: req.method,
    url: `${SERVICES_MAP.dfs}${req.path}`,
    data: req.body,
    timeout: 5000
  });
  executeCall()
    .then(response => res.status(response.status).json(response.data))
    .catch(err => res.status(err.response ? err.response.status : 500).json({ error: err.message }));
});

app.all('/api/blockchain*', (req, res) => {
  req.path = req.path.replace(/^\/api/, '');
  const executeCall = () => axios({
    method: req.method,
    url: `${SERVICES_MAP.blockchain}${req.path}`,
    data: req.body,
    timeout: 5000
  });
  executeCall()
    .then(response => res.status(response.status).json(response.data))
    .catch(err => res.status(err.response ? err.response.status : 500).json({ error: err.message }));
});

app.listen(PORT, () => {
  console.log(`[REST] API Gateway running on port ${PORT}`);

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch(`${SERVICES_MAP.monitoring}/api/monitoring/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'api-gateway',
          instanceId: INSTANCE_ID,
          status: 'ONLINE',
          lamportClock
        })
      });
    } catch (err) {
      // ignore monitoring server down
    }
  }, 3000);
});
