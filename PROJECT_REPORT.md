# B.Tech Distributed Systems Project Report: Distributed Canteen Optima

This project report outlines the design, architecture, and implementation details of **Distributed Canteen Optima**, a decentralized, service-oriented canteen management application built to showcase practical concepts from the B.Tech Computer Engineering Distributed Systems syllabus.

---

## 1. Introduction and Design Goals

### Definition of a Distributed System
A distributed system is a collection of independent components located on different machines that communicate and coordinate their actions by passing messages, presenting themselves to the end-user as a single coherent system.

### Core Goals
- **Transparency**: Hiding the fact that resources and processes are distributed across multiple backend services (e.g. Access, Location, Migration, and Failure transparency).
- **Scalability**: Enforcing microservice decoupling so that service components (such as `kitchen-service` or `optimization-service`) can scale independently.
- **Reliability & Availability**: Incorporating fault tolerance so that failures in individual components (e.g., a cooking replica crashing) do not halt the entire system.
- **Resource Sharing**: Coordinating access to shared resources (like canteen ovens or inventory stock) using distributed locking mechanisms.

---

## 2. Microservice & Middleware Architecture

The application adopts a **Microservices / Service-Oriented Architecture (SOA)**, dividing canteen operations into specialized backend nodes:

```
                    ┌────────────────────────┐
                    │     Frontend Portal    │
                    │    React Canteen UI    │
                    └───────────┬────────────┘
                                │ (REST / WebSocket)
                                ▼
                    ┌────────────────────────┐
                    │      API Gateway       │
                    │   [Retries/CB/Routing] │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │ (REST)              │ (REST)              │ (gRPC)
          ▼                     ▼                     ▼
 ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐
 │ Order Service  │    │  Menu Service  │    │   Optimization   │
 │ [Port 8001]    │    │  [Port 8002]   │    │  [gRPC: 50051]   │
 └────────┬───────┘    └────────────────┘    └──────────────────┘
          │ (Publish: order.created)
          ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                       RABBITMQ BROKER                        │
 │                Message-Oriented Middleware                   │
 └────────┬─────────────────────┬───────────────────────────────┘
          │ (Subscribe: order.created)
          ▼                     ▼
 ┌────────────────┐    ┌────────────────┐
 │Kitchen Service │    │  Notification  │
 │  [Port 8003]   │    │  [Port 8004]   │
 └────────────────┘    └────────────────┘
```

### Decoupled Backend Nodes
1. **API Gateway (Port 8000)**: Serves as the single client entry point. Routes REST/gRPC traffic, logs transactions, and manages fault-tolerance policies.
2. **Order Service (Port 8001)**: Manages placement, cancellation, and updates of orders. Publishes events to RabbitMQ.
3. **Menu/Inventory Service (Port 8002)**: Holds item details, pricing, and stock. Protects stock updates using localized **Mutex Locks** to prevent double-spending or overselling.
4. **Kitchen Service (Port 8003)**: Consumes order events from RabbitMQ and coordinates the preparation pipeline.
5. **Notification Service (Port 8004)**: Subscribes to events on RabbitMQ to alert customers on status updates.
6. **Optimization Service (Port 8005 / gRPC Port 50051)**: Runs complex DAA algorithms (Dijkstra route planning, Job Scheduling kitchen queues, TSP deliveries, Knapsack lunchboxes) and returns step logs.
7. **Distributed Controller (Port 8006)**: Serves as the synchronization, election, and locking coordinator.

---

## 3. Communication Architecture

The project demonstrates three distinct paradigms of distributed communication:

### A. REST (Representational State Transfer)
- Used for standard CRUD operations (e.g., retrieving menu items or creating orders). REST uses standard HTTP protocols and JSON payloads, which is highly portable but incurs serialization overhead.

### B. Remote Procedure Call (gRPC)
- Implemented between **API Gateway** and **Optimization Service**. gRPC runs over HTTP/2 and utilizes **Protocol Buffers (Proto3)** to serialize data into compact binary payloads.
- **Why gRPC is useful here**: gRPC provides low-latency, strictly-typed contracts, and bidirectional streaming. This is ideal for computationally intensive tasks like running DAA shortest paths, where fast network execution is critical.

### C. Message-Oriented Middleware (RabbitMQ / AMQP)
- Enforces loose coupling. When an order is placed, `order-service` publishes a message to the `canteen_events` Exchange. RabbitMQ routes this message to the `kitchen_orders` queue.
- If the `kitchen-service` crashes, the message remains safely queued on RabbitMQ. When `kitchen-service` recovers, it consumes the pending message, ensuring zero data loss.

### D. Stream-Oriented Communication (WebSockets)
- The **Monitoring Service (Port 8009)** hosts a WebSocket server. The React dashboard establishes a connection to receive real-time streams of heartbeats, event logs, and status updates, avoiding inefficient polling.

---

## 4. Physical & Logical Clock Synchronization

Synchronization is a fundamental challenge in distributed systems due to independent hardware clocks drifting over time.

### A. Cristian's Algorithm
- A client synchronizes its clock with a centralized server.
- The client measures the round-trip time ($RTT = t_{receive} - t_{send}$).
- It estimates the synchronized time: $T_{sync} = T_{server} + RTT / 2$.
- The clock offset is calculated as: $Offset = T_{sync} - t_{receive}$.

### B. Berkeley Algorithm
- Suitable for systems without access to a global UTC source.
- A coordinator node polls active counters to fetch their local times.
- The coordinator calculates the average clock difference (excluding outliers).
- It computes corrections and sends them to each node, adjusting their offsets.

### C. Lamport Logical Clocks
- Tracks the happened-before relation ($a \to b$).
- **Rule 1**: Before a local event, increment: $L = L + 1$.
- **Rule 2**: When sending message $m$, attach timestamp $L_m = L$.
- **Rule 3**: On receiving message $m$ with timestamp $T$, update: $L = \max(L, T) + 1$.
- Applied to order workflows (Order Placed $\to$ Kitchen Received $\to$ Notification Sent) to establish causal ordering.

### D. Vector Clocks
- Establishes precise causal relationships without loss of concurrency details.
- Maintains a vector $V$ of size $N$ (number of services): `[Order, Kitchen, Notify]`.
- Messages carry vector stamps, enabling the system to identify if events are causally dependent or concurrent.

---

## 5. Coordinator Elections & Mutual Exclusion

### A. Bully Election Algorithm
- If a node detects that the coordinator has crashed, it initiates an election.
- It sends an ELECTION message to all nodes with higher IDs.
- If no node responds, it elects itself as coordinator and broadcasts a COORDINATOR message.
- If higher nodes respond, they take over the election, and the highest active node eventually assumes the coordinator role.

### B. Ring Election Algorithm
- Nodes are arranged in a logical ring.
- An election token is passed around the ring; each active node appends its ID to the list.
- When the token returns to the initiator, the node with the highest ID is elected coordinator and broadcasts the result.

### C. Distributed Mutual Exclusion (Oven Lock)
To prevent conflicting access to a shared resource (such as a Premium Oven), the system supports three locking modes:
1. **Centralized**: A coordinator grants lock access and maintains a FIFO wait queue.
2. **Ricart-Agrawala**: A node broadcasts a request with a Lamport timestamp. Other nodes reply with an OK message. The requesting node enters the critical section only after receiving approvals from all active nodes.
3. **Token Ring**: A token circulates around a logical ring. A node can enter the critical section only when it holds the token.

---

## 6. Fault Tolerance & Heartbeats

Fault tolerance ensures high availability.

### A. Beacon Protocol (Heartbeats)
- Each service instance sends a periodic heartbeat (every 3 seconds) to the monitoring service registry.
- If pings stop for more than 7 seconds, the registry flags the service as `SUSPECTED_FAILED`.

### B. Exponential Backoff Retries
- If a REST/gRPC request to a service fails, the API Gateway retries the request with exponentially increasing delays (e.g. 500ms, then 1000ms, then 2000ms) before returning a failure code.

### C. Circuit Breakers
- Implements stateful tracking:
  - **CLOSED**: Traffic flows normally.
  - **OPEN**: If failures exceed a threshold (e.g. 3), the circuit trips to OPEN. All subsequent requests are blocked immediately, preventing resource exhaustion.
  - **HALF-OPEN**: After a cooldown period, the gateway sends a single test request. If it succeeds, the circuit closes; if it fails, it returns to OPEN.

### D. RabbitMQ Dead-Letter Queue (DLQ)
- Messages that fail processing or exceed retry limits in the Kitchen Queue are routed to the DLQ (`canteen_dlx` exchange) for auditing.

---

## 7. Distributed File System & Blockchain Ledger

### HDFS Replication Simulation
- Demonstrates distributed file storage.
- When a file is uploaded, the simulated NameNode splits the file into blocks.
- Each block is replicated to 2 random active DataNodes (Replication Factor = 2).
- If a DataNode crashes, the NameNode detects the failure and automatically triggers re-replication of the lost blocks to the remaining active DataNodes, restoring the replication factor.

### Blockchain Audit Ledger
- Records order transactions in a cryptographically secure ledger.
- Each block contains a index, timestamp, transaction payload, previous block hash, and a nonce.
- Blocks are mined using Proof of Work (recalculating the hash until it begins with leading zeros).
- If a transaction value is modified in a database tamper simulation, the hash changes, breaking the link to subsequent blocks. The validation check flags this immediately and identifies the tampered block.

---

## 8. Summary of Viva Prep Topics

1. **How is gRPC different from REST?**
   gRPC uses HTTP/2 (allowing multiplexing, headers compression) and Protocol Buffers, making it faster and strictly typed compared to REST over HTTP/1.1 with text-based JSON.
2. **What is a Lamport Clock?**
   It is a logical clock algorithm that uses monotonically increasing counters to determine the order of events in a distributed system, resolving causal dependencies without physical clocks.
3. **Explain the Berkeley clock synchronization algorithm.**
   It is an active synchronization method where a coordinator polls nodes for their times, averages the offsets, and tells each node how much to adjust its local clock.
4. **What does a Circuit Breaker do?**
   It prevents a cascading failure by stopping requests to an already failing service, giving it time to recover.
5. **How does the HDFS replication work in your project?**
   Files are split into blocks and written to two different DataNodes. If a DataNode crashes, the NameNode detects this via lost heartbeats and re-replicates those blocks to a healthy node.
6. **How does the blockchain detect tampered data?**
   Each block holds the hash of the previous block. If a block's data is modified, its hash changes, which invalidates all subsequent blocks in the chain.
