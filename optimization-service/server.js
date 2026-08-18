import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import algorithms
import { generateDijkstraStates } from './algorithms/dijkstra.js';
import { generateFloydWarshallStates } from './algorithms/floydWarshall.js';
import { generateTSPStates } from './algorithms/tspBranchAndBound.js';
import { generateKnapsackStates } from './algorithms/knapsack.js';
import { generateJobSchedulingStates } from './algorithms/jobScheduling.js';
import { generateGraphColoringStates } from './algorithms/graphColoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths & Ports
const PROTO_PATH = path.resolve(__dirname, '../protos/optimization.proto');
const GRPC_PORT = process.env.GRPC_PORT || 50051;
const REST_PORT = process.env.REST_PORT || 8005;
const INSTANCE_ID = process.env.INSTANCE_ID || 'optimization-service-01';
const startTime = Date.now();

// Load Proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const optimizationProto = grpc.loadPackageDefinition(packageDefinition).optimization;

// Implement gRPC handlers
const grpcHandlers = {
  RunDijkstra: (call, callback) => {
    try {
      const { startNode, targetNode, nodesJson, edgesJson } = call.request;
      const nodes = JSON.parse(nodesJson);
      const edges = JSON.parse(edgesJson);
      
      const { states: newStates, distances, previous } = generateDijkstraStates(nodes, edges, startNode);
      
      // Append target node logic if targetNode specified
      if (newStates.length > 0 && targetNode) {
        let curr = targetNode;
        const path = [curr];
        const pathEdges = [];
        while (previous[curr]) {
          pathEdges.push(`${previous[curr]}-${curr}`);
          curr = previous[curr];
          path.push(curr);
        }
        
        if (curr === startNode) {
          newStates.push({
            ...newStates[newStates.length - 1],
            log: `Found shortest path to ${targetNode}: ${path.reverse().join(' -> ')} (Total Distance: ${distances[targetNode]})`,
            path: path,
            pathEdges: pathEdges,
            isFinished: true
          });
        } else {
          newStates.push({
            ...newStates[newStates.length - 1],
            log: `Node ${targetNode} is unreachable from ${startNode}.`,
            isFinished: true
          });
        }
      }

      callback(null, { resultJson: JSON.stringify(newStates) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  },

  RunFloydWarshall: (call, callback) => {
    try {
      const { nodesJson, edgesJson } = call.request;
      const nodes = JSON.parse(nodesJson);
      const edges = JSON.parse(edgesJson);
      
      const n = nodes.length;
      const labels = nodes.map(n => n.label || n.id);
      
      // Build initial matrix
      const initialMatrix = Array(n).fill(0).map(() => Array(n).fill(Infinity));
      for (let i = 0; i < n; i++) initialMatrix[i][i] = 0;
      
      edges.forEach(e => {
        const u = nodes.findIndex(node => node.id === e.from);
        const v = nodes.findIndex(node => node.id === e.to);
        if (u !== -1 && v !== -1) {
          initialMatrix[u][v] = e.weight;
          initialMatrix[v][u] = e.weight; // Undirected
        }
      });
      
      const { states } = generateFloydWarshallStates(labels, initialMatrix);
      callback(null, { resultJson: JSON.stringify(states) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  },

  RunTSP: (call, callback) => {
    try {
      const { nodesJson, edgesJson } = call.request;
      const nodes = JSON.parse(nodesJson);
      const edges = JSON.parse(edgesJson);
      
      const states = generateTSPStates(nodes, edges);
      callback(null, { resultJson: JSON.stringify(states) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  },

  RunJobScheduling: (call, callback) => {
    try {
      const { jobsJson } = call.request;
      const jobs = JSON.parse(jobsJson);
      
      const states = generateJobSchedulingStates(jobs);
      callback(null, { resultJson: JSON.stringify(states) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  },

  RunKnapsack: (call, callback) => {
    try {
      const { capacity, itemsJson } = call.request;
      const items = JSON.parse(itemsJson);
      
      const states = generateKnapsackStates(items, capacity);
      callback(null, { resultJson: JSON.stringify(states) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  },

  RunGraphColoring: (call, callback) => {
    try {
      const { nodesJson, edgesJson, m } = call.request;
      const nodes = JSON.parse(nodesJson);
      const edges = JSON.parse(edgesJson);
      
      // Hex colors array
      const colors = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5', '#319795', '#ED64A6'];
      const availableColors = colors.slice(0, m);
      
      const states = generateGraphColoringStates(nodes, edges, availableColors);
      callback(null, { resultJson: JSON.stringify(states) });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        details: err.message
      });
    }
  }
};

// Start gRPC Server
function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(optimizationProto.OptimizationService.service, grpcHandlers);
  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error(`[gRPC] Failed to start server: ${err.message}`);
      return;
    }
    console.log(`[gRPC] Optimization Service running on port ${port}`);
  });
}

// Start Express Server (for direct REST fallback)
function startRestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'optimization-service',
      instanceId: INSTANCE_ID,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/optimization/dijkstra', (req, res) => {
    try {
      const { startNode, targetNode, nodes, edges } = req.body;
      const { states: newStates, distances, previous } = generateDijkstraStates(nodes, edges, startNode);
      
      if (newStates.length > 0 && targetNode) {
        let curr = targetNode;
        const path = [curr];
        const pathEdges = [];
        while (previous[curr]) {
          pathEdges.push(`${previous[curr]}-${curr}`);
          curr = previous[curr];
          path.push(curr);
        }
        
        if (curr === startNode) {
          newStates.push({
            ...newStates[newStates.length - 1],
            log: `Found shortest path to ${targetNode}: ${path.reverse().join(' -> ')} (Total Distance: ${distances[targetNode]})`,
            path: path,
            pathEdges: pathEdges,
            isFinished: true
          });
        } else {
          newStates.push({
            ...newStates[newStates.length - 1],
            log: `Node ${targetNode} is unreachable from ${startNode}.`,
            isFinished: true
          });
        }
      }
      res.json({ states: newStates });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/optimization/floyd-warshall', (req, res) => {
    try {
      const { nodes, edges } = req.body;
      const n = nodes.length;
      const labels = nodes.map(n => n.label || n.id);
      const initialMatrix = Array(n).fill(0).map(() => Array(n).fill(Infinity));
      for (let i = 0; i < n; i++) initialMatrix[i][i] = 0;
      
      edges.forEach(e => {
        const u = nodes.findIndex(node => node.id === e.from);
        const v = nodes.findIndex(node => node.id === e.to);
        if (u !== -1 && v !== -1) {
          initialMatrix[u][v] = e.weight;
          initialMatrix[v][u] = e.weight;
        }
      });
      const { states } = generateFloydWarshallStates(labels, initialMatrix);
      res.json({ states });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/optimization/tsp', (req, res) => {
    try {
      const { nodes, edges } = req.body;
      const states = generateTSPStates(nodes, edges);
      res.json({ states });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/optimization/job-scheduling', (req, res) => {
    try {
      const { jobs } = req.body;
      const states = generateJobSchedulingStates(jobs);
      res.json({ states });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/optimization/knapsack', (req, res) => {
    try {
      const { items, capacity } = req.body;
      const states = generateKnapsackStates(items, capacity);
      res.json({ states });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/optimization/graph-coloring', (req, res) => {
    try {
      const { nodes, edges, m } = req.body;
      const colors = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5', '#319795', '#ED64A6'];
      const availableColors = colors.slice(0, m);
      const states = generateGraphColoringStates(nodes, edges, availableColors);
      res.json({ states });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(REST_PORT, () => {
    console.log(`[REST] Optimization Service running on port ${REST_PORT}`);

    // Beacon Heartbeat
    setInterval(async () => {
      try {
        await fetch('http://localhost:8009/api/monitoring/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'optimization-service',
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
}

// Start Servers
startGrpcServer();
startRestServer();
