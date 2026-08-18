import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';

const PORT = process.env.PORT || 8004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const INSTANCE_ID = process.env.INSTANCE_ID || 'notification-service-01';
const startTime = Date.now();

let lamportClock = 0;
const notifications = [];

// RabbitMQ Integration
let amqpConn = null;
let amqpChannel = null;

async function initRabbitMQ() {
  try {
    amqpConn = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await amqpConn.createChannel();
    
    await amqpChannel.assertExchange('canteen_events', 'topic', { durable: true });
    
    const queueName = 'notifications_queue';
    await amqpChannel.assertQueue(queueName, { durable: true });
    await amqpChannel.bindQueue(queueName, 'canteen_events', 'order.#');
    
    console.log(`[RabbitMQ] Notification Service listening on queue: ${queueName}`);
    
    amqpChannel.consume(queueName, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          lamportClock = Math.max(lamportClock, content.lamportClock || 0) + 1;
          
          const routingKey = msg.fields.routingKey;
          console.log(`[Notification] Received event: ${routingKey}, Clock: ${lamportClock}`);
          
          let title = '';
          let message = '';
          
          if (routingKey === 'order.created') {
            title = 'New Order Placed 📢';
            message = `Order ${content.orderId} of value ₹${content.total} has been placed.`;
          } else if (routingKey.startsWith('order.status.')) {
            const status = routingKey.split('.').pop().toUpperCase();
            title = `Order Status: ${status} ⚡`;
            message = `Order ${content.orderId} is now: ${status}.`;
          } else {
            title = `Event: ${routingKey}`;
            message = JSON.stringify(content);
          }
          
          notifications.unshift({
            id: `NTF-${Date.now()}-${Math.random().toString(36).slice(-3)}`,
            title,
            message,
            orderId: content.orderId,
            lamportClock,
            timestamp: new Date().toISOString()
          });
          
          if (notifications.length > 50) notifications.pop(); // keep last 50
          
          amqpChannel.ack(msg);
        } catch (err) {
          console.error(`[Notification] Error parsing message: ${err.message}`);
          amqpChannel.nack(msg, false, false);
        }
      }
    }, { noAck: false });

  } catch (err) {
    console.warn(`[RabbitMQ] Notification Service failed to connect to RMQ: ${err.message}. Operating in fallback.`);
    
    // Fallback listening
    if (global.mockEventBroker) {
      const handleMockEvent = (key, event) => {
        lamportClock = Math.max(lamportClock, event.lamportClock || 0) + 1;
        let title = '';
        let message = '';
        if (key === 'order.created') {
          title = 'New Order Placed [Mock] 📢';
          message = `Order ${event.orderId} of value ₹${event.total} has been placed.`;
        } else {
          const status = key.split('.').pop().toUpperCase();
          title = `Order Status: ${status} [Mock] ⚡`;
          message = `Order ${event.orderId} is now: ${status}.`;
        }
        notifications.unshift({
          id: `NTF-${Date.now()}-${Math.random().toString(36).slice(-3)}`,
          title,
          message,
          orderId: event.orderId,
          lamportClock,
          timestamp: new Date().toISOString()
        });
      };
      
      global.mockEventBroker.on('order.created', (event) => handleMockEvent('order.created', event));
      global.mockEventBroker.on('order.status.confirmed', (event) => handleMockEvent('order.status.confirmed', event));
      global.mockEventBroker.on('order.status.preparing', (event) => handleMockEvent('order.status.preparing', event));
      global.mockEventBroker.on('order.status.ready', (event) => handleMockEvent('order.status.ready', event));
      global.mockEventBroker.on('order.status.completed', (event) => handleMockEvent('order.status.completed', event));
      global.mockEventBroker.on('order.status.cancelled', (event) => handleMockEvent('order.status.cancelled', event));
    }
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
    service: 'notification-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

app.get('/notifications', (req, res) => {
  res.json(notifications);
});

app.listen(PORT, async () => {
  console.log(`[REST] Notification Service running on port ${PORT}`);
  await initRabbitMQ();

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'notification-service',
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
