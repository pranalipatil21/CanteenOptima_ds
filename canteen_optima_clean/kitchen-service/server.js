import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import axios from 'axios';

const PORT = process.env.PORT || 8003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const INSTANCE_ID = process.env.INSTANCE_ID || 'kitchen-service-01';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8001';
const startTime = Date.now();

let lamportClock = 0;
const kitchenQueue = [];

// RabbitMQ Integration
let amqpConn = null;
let amqpChannel = null;

async function initRabbitMQ() {
  try {
    amqpConn = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await amqpConn.createChannel();
    
    // Ensure Exchange
    await amqpChannel.assertExchange('canteen_events', 'topic', { durable: true });
    
    // Assert and Bind Kitchen Queue
    const queueName = 'kitchen_orders';
    await amqpChannel.assertQueue(queueName, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'canteen_dlx',
        'x-dead-letter-routing-key': 'kitchen.failed'
      }
    });
    
    await amqpChannel.bindQueue(queueName, 'canteen_events', 'order.created');
    await amqpChannel.bindQueue(queueName, 'canteen_events', 'order.status.completed');
    
    // Set prefetch to 1 so we don't grab all orders at once if multiple kitchen instances run
    await amqpChannel.prefetch(1);
    
    console.log(`[RabbitMQ] Kitchen Service listening on queue: ${queueName}`);
    
    amqpChannel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const routingKey = msg.fields.routingKey;
          const content = JSON.parse(msg.content.toString());
          
          // Sync clock
          lamportClock = Math.max(lamportClock, content.lamportClock || 0) + 1;
          
          if (routingKey.endsWith('.completed')) {
            console.log(`[Kitchen] Order completed/collected by customer: ${content.orderId}`);
            const index = kitchenQueue.findIndex(q => q.orderId === content.orderId);
            if (index !== -1) {
              kitchenQueue.splice(index, 1);
            }
          } else if (routingKey === 'order.created') {
            console.log(`[Kitchen] Received order: ${content.orderId}, Clock synced: ${lamportClock}`);
            
            // Add to kitchen processing list
            const queueItem = {
              orderId: content.orderId,
              items: content.items,
              total: content.total,
              status: 'CONFIRMED',
              receivedAt: new Date().toISOString(),
              logs: [`Order received in kitchen. Clock: ${lamportClock}`]
            };
            
            kitchenQueue.push(queueItem);
            
            // Start simulated cooking workflow
            processOrderSimulated(queueItem);
          }
          
          // Manually Acknowledge message delivery
          amqpChannel.ack(msg);
        } catch (err) {
          console.error(`[Kitchen] Error processing RMQ message: ${err.message}`);
          // Negative Acknowledge - Send to DLQ
          amqpChannel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

  } catch (err) {
    console.warn(`[RabbitMQ] Kitchen Service failed to connect to RabbitMQ: ${err.message}. Operating in fallback.`);
    // Global fallback for local debugging
    if (global.mockEventBroker) {
      global.mockEventBroker.on('order.created', (event) => {
        lamportClock = Math.max(lamportClock, event.lamportClock || 0) + 1;
        const queueItem = {
          orderId: event.orderId,
          items: event.items,
          total: event.total,
          status: 'CONFIRMED',
          receivedAt: new Date().toISOString(),
          logs: [`[Mock] Order received in kitchen. Clock: ${lamportClock}`]
        };
        kitchenQueue.push(queueItem);
        processOrderSimulated(queueItem);
      });

      global.mockEventBroker.on('order.status.completed', (event) => {
        lamportClock = Math.max(lamportClock, event.lamportClock || 0) + 1;
        const index = kitchenQueue.findIndex(q => q.orderId === event.orderId);
        if (index !== -1) {
          kitchenQueue.splice(index, 1);
        }
      });
    }
  }
}

// Simulated Cooking Steps
async function processOrderSimulated(item) {
  const updateStatus = async (status) => {
    item.status = status;
    item.logs.push(`Order status updated to: ${status} at ${new Date().toLocaleTimeString()}`);
    console.log(`[Kitchen Queue] Order ${item.orderId} status -> ${status}`);
    
    // Call Order Service database to sync status
    try {
      await axios.put(`${ORDER_SERVICE_URL}/orders/${item.orderId}`, { status });
    } catch (err) {
      console.error(`[Kitchen] Failed to sync status with Order Service: ${err.message}`);
    }

    // Publish status event
    publishStatusEvent(item.orderId, status);
  };

  // Step 1: PLACED -> CONFIRMED (instantly done on queue intake)
  await updateStatus('CONFIRMED');

  // Step 2: CONFIRMED -> PREPARING (after 8 seconds)
  setTimeout(async () => {
    await updateStatus('PREPARING');

    // Step 3: PREPARING -> READY (after 12 seconds)
    setTimeout(async () => {
      await updateStatus('READY');
      // Order is ready! Waits in the active kitchen list until the user completes the checkout collection.
    }, 12000);

  }, 8000);
}

function publishStatusEvent(orderId, status) {
  lamportClock++;
  const payload = {
    orderId,
    status,
    lamportClock,
    service: 'kitchen-service',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString()
  };

  if (amqpChannel) {
    try {
      amqpChannel.publish(
        'canteen_events',
        `order.status.${status.toLowerCase()}`,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
      );
    } catch (err) {
      console.error(`[Kitchen] Publish event failed: ${err.message}`);
    }
  }
  
  if (global.mockEventBroker) {
    global.mockEventBroker.emit(`order.status.${status.toLowerCase()}`, payload);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const clientClock = Number(req.headers['x-lamport-clock'] || 0);
  lamportClock = Math.max(lamportClock, clientClock) + 1;
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'kitchen-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

app.get('/kitchen/queue', (req, res) => {
  res.json(kitchenQueue);
});

app.listen(PORT, async () => {
  console.log(`[REST] Kitchen Service running on port ${PORT}`);
  await initRabbitMQ();

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'kitchen-service',
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
