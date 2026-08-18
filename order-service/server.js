import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import amqp from 'amqplib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const INSTANCE_ID = process.env.INSTANCE_ID || 'order-service-01';
const DB_FILE = path.resolve(__dirname, 'orders.json');
const startTime = Date.now();

let lamportClock = 0;

// Initialize db file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function readOrders() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error(`[DB] Error writing: ${err.message}`);
  }
}

// RabbitMQ Integration
let amqpChannel = null;
let amqpConn = null;

async function initRabbitMQ() {
  try {
    amqpConn = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await amqpConn.createChannel();
    await amqpChannel.assertExchange('canteen_events', 'topic', { durable: true });
    console.log('[RabbitMQ] Connected successfully inside Order Service');
  } catch (err) {
    console.warn(`[RabbitMQ] Connection failed: ${err.message}. Operating in fallback mode.`);
  }
}

function publishEvent(routingKey, data) {
  lamportClock++;
  const payload = {
    ...data,
    lamportClock,
    service: 'order-service',
    instance: INSTANCE_ID,
    eventTimestamp: new Date().toISOString()
  };
  
  console.log(`[Event Log] Publishing key: ${routingKey}, Clock: ${lamportClock}`);
  
  if (amqpChannel) {
    try {
      amqpChannel.publish(
        'canteen_events',
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
      );
      return true;
    } catch (err) {
      console.error(`[RabbitMQ] Publish failed: ${err.message}`);
    }
  }
  
  // Fallback broadcast via global memory mock for local developer testing
  if (global.mockEventBroker) {
    global.mockEventBroker.emit(routingKey, payload);
  }
  return false;
}

const app = express();
app.use(cors());
app.use(express.json());

// Increment clock on every incoming request
app.use((req, res, next) => {
  const clientClock = Number(req.headers['x-lamport-clock'] || 0);
  lamportClock = Math.max(lamportClock, clientClock) + 1;
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'order-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Create order
app.post('/orders', (req, res) => {
  try {
    const { items, total, customerName } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cannot place order with empty items' });
    }

    const orders = readOrders();
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerName: customerName || 'Anonymous Student',
      items,
      total,
      status: 'PLACED', // PLACED -> CONFIRMED -> PREPARING -> READY -> COMPLETED
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeOrders(orders);

    // Publish RabbitMQ message
    publishEvent('order.created', {
      orderId: newOrder.id,
      status: newOrder.status,
      items: newOrder.items,
      total: newOrder.total
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders
app.get('/orders', (req, res) => {
  res.json(readOrders());
});

// Get order by id
app.get('/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order status
app.put('/orders/:id', (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    writeOrders(orders);

    // Publish RabbitMQ status change event
    publishEvent(`order.status.${status.toLowerCase()}`, {
      orderId: req.params.id,
      status: status
    });

    res.json(orders[orderIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel order
app.delete('/orders/:id', (req, res) => {
  try {
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    orders[orderIndex].status = 'CANCELLED';
    orders[orderIndex].updatedAt = new Date().toISOString();
    writeOrders(orders);

    publishEvent('order.status.cancelled', {
      orderId: req.params.id,
      status: 'CANCELLED'
    });

    res.json(orders[orderIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`[REST] Order Service running on port ${PORT}`);
  await initRabbitMQ();

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'order-service',
          instanceId: INSTANCE_ID,
          status: 'ONLINE',
          lamportClock
        })
      });
    } catch (err) {
      // ignore
    }
  }, 3000);
});
