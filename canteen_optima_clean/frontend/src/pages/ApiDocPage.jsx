import React from 'react';
import PageHeader from '../components/ui/PageHeader';

export default function ApiDocPage() {
  const apis = [
    {
      method: 'POST',
      endpoint: '/api/orders',
      service: 'API Gateway → Order Service',
      type: 'REST (HTTP/JSON)',
      purpose: 'Place a new canteen order and publish an event to RabbitMQ.',
      req: `{ "items": [{ "id": "1", "name": "Burger Meals", "quantity": 1 }], "total": 120 }`,
      res: `{ "id": "ORD-123456", "customerName": "Student", "status": "PLACED", ... }`,
      concept: 'Client-Server, Microservices Architecture, Message-Oriented Middleware.'
    },
    {
      method: 'PUT',
      endpoint: '/api/orders/:id',
      service: 'API Gateway → Order Service',
      type: 'REST (HTTP/JSON)',
      purpose: 'Update order lifecycle status.',
      req: `{ "status": "CONFIRMED" }`,
      res: `{ "id": "ORD-123456", "status": "CONFIRMED", ... }`,
      concept: 'Microservices, Logical Clocks (increments Lamport clock on state transition).'
    },
    {
      method: 'POST',
      endpoint: '/api/optimization/dijkstra',
      service: 'API Gateway ── gRPC ──> Optimization Service',
      type: 'gRPC (Proto3 over HTTP/2)',
      purpose: 'Run Dijkstra single-source shortest path calculation to generate visualization steps.',
      req: `DijkstraRequest { startNode, targetNode, nodesJson, edgesJson }`,
      res: `AlgorithmResponse { resultJson (JSON string array of states) }`,
      concept: 'Remote Procedure Call (RPC), Virtualization (service decoupling).'
    },
    {
      method: 'POST',
      endpoint: '/api/menu/deduct',
      service: 'API Gateway → Menu/Inventory Service',
      type: 'REST (HTTP/JSON)',
      purpose: 'Deduct item stock inventory safely under lock.',
      req: `{ "itemsToDeduct": [{ "id": "1", "quantity": 2 }] }`,
      res: `{ "message": "Stock deducted successfully", "menu": [...] }`,
      concept: 'Mutual Exclusion (concurrency protection with async Mutex locks).'
    },
    {
      method: 'POST',
      endpoint: '/api/dist-controller/berkeley/sync',
      service: 'API Gateway → Distributed Controller',
      type: 'REST (HTTP/JSON)',
      purpose: 'Run the Berkeley clock synchronization algorithm across counters.',
      req: `{}`,
      res: `{ "avgDiff": 230, "nodes": [...], "logs": [...] }`,
      concept: 'Physical Clock Synchronization (average offset coordinator calculations).'
    },
    {
      method: 'POST',
      endpoint: '/api/dist-controller/election/start',
      service: 'API Gateway → Distributed Controller',
      type: 'REST (HTTP/JSON)',
      purpose: 'Trigger coordinator election (Bully or Ring) on mock service replicas.',
      req: `{ "startNodeId": 2, "type": "bully" }`,
      res: `{ "nodes": [...], "logs": [...] }`,
      concept: 'Election Algorithms (leader election, crash-recovery synchronization).'
    },
    {
      method: 'POST',
      endpoint: '/api/dfs/upload',
      service: 'API Gateway → DFS (HDFS) Service',
      type: 'REST (HTTP/JSON)',
      purpose: 'Upload a text file, split into blocks, and replicate.',
      req: `{ "name": "backup.txt", "content": "File lines content..." }`,
      res: `{ "message": "File uploaded and replicated successfully", "file": [...] }`,
      concept: 'Distributed File System (HDFS simulation, NameNode, DataNodes, Replication factor).'
    },
    {
      method: 'POST',
      endpoint: '/api/blockchain/transaction',
      service: 'API Gateway → Blockchain Service',
      type: 'REST (HTTP/JSON)',
      purpose: 'Log order audit transaction to blockchain with Proof of Work.',
      req: `{ "orderId": "ORD-123456", "total": 120 }`,
      res: `{ "message": "Transaction mined", "block": { index, hash, nonce, ... } }`,
      concept: 'Distributed Ledger, Proof of Work consensus, Cryptographic block security.'
    }
  ];

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="API Gateway Documentation" 
        description="Verify service API endpoints, payload configurations, and corresponding Distributed Systems concepts." 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {apis.map((api, idx) => (
          <div className="card" key={idx} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  backgroundColor: api.method === 'POST' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(49, 130, 206, 0.1)', 
                  color: api.method === 'POST' ? '#38A169' : '#3182CE',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  {api.method}
                </span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{api.endpoint}</strong>
              </div>
              <span className="text-xs" style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                {api.type}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Target Node:</strong> {api.service}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Purpose:</strong> {api.purpose}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>DS Syllabus Mapping:</strong> <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{api.concept}</span></p>
              </div>

              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.15rem' }}>Request Template:</span>
                  <pre style={{ margin: 0, padding: '0.35rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {api.req}
                  </pre>
                </div>
                <div>
                  <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.15rem' }}>Response Template:</span>
                  <pre style={{ margin: 0, padding: '0.35rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {api.res}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
