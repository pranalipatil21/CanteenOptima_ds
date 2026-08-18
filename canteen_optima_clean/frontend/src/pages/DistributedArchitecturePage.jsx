import React from 'react';
import PageHeader from '../components/ui/PageHeader';

export default function DistributedArchitecturePage() {
  const concepts = [
    {
      title: '1. Goals of Distributed Systems & Definition',
      def: 'A distributed system is a collection of independent computers that appears to its users as a single coherent system.',
      mapping: 'In Canteen Optima, independent services run on different hosts/ports (or in separate Docker containers), yet the student interacts with a unified portal.'
    },
    {
      title: '2. Microservices & Service-Oriented Architecture (SOA)',
      def: 'Microservices arrange an application as a collection of loosely-coupled, fine-grained services communicating via lightweight protocols.',
      mapping: 'Decoding business domains into Order, Menu, Kitchen, and Notification services. Communicating over REST and gRPC.'
    },
    {
      title: '3. Middleware (Service Communication)',
      def: 'Middleware is software that lies between an operating system and the applications running on it, enabling communication and data management.',
      mapping: 'RabbitMQ acts as the message-oriented middleware broker, handling asynchronous event exchanges and task queues between Order, Kitchen, and Notification services.'
    },
    {
      title: '4. Remote Procedure Call (RPC)',
      def: 'RPC allows a computer program to cause a subroutine to execute in a different address space without the programmer explicitly coding the details.',
      mapping: 'gRPC is implemented between the API Gateway and the Optimization Service. Structured protocol buffers specify the payload contracts (Dijkstra, TSP).'
    },
    {
      title: '5. Clock Synchronization (Berkeley & Cristian)',
      def: 'Algorithms to align physical clocks across nodes to coordinate event times and logging order.',
      mapping: "Cristian's algorithm corrects local client clock drifts using Server RTT checks. Berkeley sync polls node clocks, averages the differences, and instructs nodes to adjust offsets."
    },
    {
      title: '6. Logical & Vector Clocks (Lamport Clocks)',
      def: 'Tracks the happened-before relation ($a \\to b$) between events in a distributed system without relying on physical clocks.',
      mapping: 'Lamport and Vector clocks are stamped onto RabbitMQ events, capturing causal relationships (Order Placed $\\to$ Kitchen Cooking $\\to$ Delivery Alert).'
    },
    {
      title: '7. Distributed Mutual Exclusion',
      def: 'Enforces that only one node at a time can access a shared resource in a distributed environment.',
      mapping: 'Used to lock the Premium Oven using Centralized, Ricart-Agrawala (timestamp voting), and Token Ring token-passing protocols.'
    },
    {
      title: '8. Fault Tolerance & Heartbeats',
      def: 'Enables a system to continue operating properly in the event of the failure of some of its components.',
      mapping: 'Implemented using service-to-monitoring Heartbeats (Beacons), Axios request retries with exponential backoffs, circuit breaker state tracking, and RabbitMQ persistent queues with Dead Letter Queues (DLQ).'
    },
    {
      title: '9. Distributed File Storage (HDFS Simulation)',
      def: 'Divides large files into blocks and distributes copies across multiple storage nodes for scalability and resilience.',
      mapping: 'Files are split into blocks and replicated across DataNodes. NameNode monitors heartbeats and runs re-replication if a DataNode crashes.'
    },
    {
      title: '10. Distributed Ledger (Blockchain)',
      def: 'A decentralized, consensus-driven, cryptographically secure audit trail.',
      mapping: 'Canteen transaction audit log blocks are linked by SHA-256 hashes with Proof of Work mining, validating chain integrity and identifying tampered blocks.'
    }
  ];

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Distributed Systems Syllabus Mapping" 
        description="Learn how academic distributed systems topics are implemented in Distributed Canteen Optima." 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Distributed Architecture Map</h2>
          <p className="text-sm text-muted">
            The project demonstrates practical implementation of all key syllabus units:
          </p>
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: 'var(--bg-sidebar)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap'
          }}>
{`               ┌────────────────────────────────────────────────────────┐
               │                        CLIENT                          │
               │                   React Web Portal                     │
               └──────────────────────────┬─────────────────────────────┘
                                          │ (REST / WebSockets)
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │                      API GATEWAY                       │
               │              [Retries / CB / Timeouts]                 │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  │ (REST)                │ (REST)                │ (gRPC)
                  ▼                       ▼                       ▼
       ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
       │   ORDER SERVICE    │  │    MENU SERVICE    │  │    OPTIMIZATION    │
       │    Lamport Clocks  │  │   Concurrency Lock │  │      SERVICE       │
       └──────────┬─────────┘  └────────────────────┘  └────────────────────┘
                  │ (RabbitMQ Exchanges)
                  ▼
       ┌────────────────────────────────────────────────────────┐
       │                    RABBITMQ BROKER                     │
       │                Asynchronous Middleware                 │
       └──────────┬───────────────────────┬─────────────────────┘
                  │                       │
                  ▼                       ▼
       ┌────────────────────┐  ┌────────────────────┐
       │  KITCHEN SERVICE   │  │    NOTIFICATION    │
       │  RMQ Ack / Queue   │  │      SERVICE       │
       └────────────────────┘  └────────────────────┘`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {concepts.map((c, idx) => (
            <div className="card" key={idx}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--accent-red)' }}>{c.title}</h3>
              <div style={{ marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '3px solid var(--border-color)' }}>
                <span className="text-xs text-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Syllabus Concept:</span>
                <p className="text-sm" style={{ fontStyle: 'italic', margin: '0.25rem 0 0' }}>{c.def}</p>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Canteen Optima Implementation:</span>
                <p className="text-sm" style={{ fontWeight: 500, margin: '0.25rem 0 0' }}>{c.mapping}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
