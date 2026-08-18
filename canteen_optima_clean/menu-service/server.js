import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8002;
const INSTANCE_ID = process.env.INSTANCE_ID || 'menu-service-01';
const DB_FILE = path.resolve(__dirname, 'menu.json');
const startTime = Date.now();

let lamportClock = 0;

// Mutex Lock for Concurrency Protection
class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  acquire() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const itemLocks = {};
function getLock(itemId) {
  if (!itemLocks[itemId]) {
    itemLocks[itemId] = new Mutex();
  }
  return itemLocks[itemId];
}

// Initial Menu Data
const DEFAULT_MENU = [
  { id: '1', name: 'Burger Meals 🍔', price: 120, calories: 600, weight: 2, stock: 10, available: true },
  { id: '2', name: 'Fries 🍟', price: 90, calories: 350, weight: 1, stock: 20, available: true },
  { id: '3', name: 'Pizza 🍕', price: 250, calories: 900, weight: 3, stock: 5, available: true },
  { id: '4', name: 'Cold Drinks 🥤', price: 40, calories: 150, weight: 1, stock: 30, available: true },
  { id: '5', name: 'Ice Cream 🍦', price: 60, calories: 200, weight: 1, stock: 25, available: true },
  { id: '6', name: 'Noodles 🍜', price: 80, calories: 400, weight: 1, stock: 15, available: true }
];

// Initialize db file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_MENU, null, 2));
}

function readMenu() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return DEFAULT_MENU;
  }
}

function writeMenu(menu) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(menu, null, 2));
  } catch (err) {
    console.error(`[DB] Error writing menu: ${err.message}`);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Increment Lamport clock on every request
app.use((req, res, next) => {
  const clientClock = Number(req.headers['x-lamport-clock'] || 0);
  lamportClock = Math.max(lamportClock, clientClock) + 1;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'menu-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Get menu items
app.get('/menu', (req, res) => {
  res.json(readMenu());
});

// Deduct stock safely with Concurrency Lock
app.post('/menu/deduct', async (req, res) => {
  const { itemsToDeduct } = req.body; // Array of { id, quantity }
  
  if (!itemsToDeduct || !Array.isArray(itemsToDeduct)) {
    return res.status(400).json({ error: 'Invalid deduction payload' });
  }

  // Acquire locks sequentially for all requested items to prevent deadlock
  const sortedDeductions = [...itemsToDeduct].sort((a, b) => a.id.localeCompare(b.id));
  
  // Acquire all locks
  for (const item of sortedDeductions) {
    await getLock(item.id).acquire();
  }

  try {
    const currentMenu = readMenu();
    const errors = [];
    
    // Validate stock availability for all items first (Transactional check)
    for (const item of sortedDeductions) {
      const dbItem = currentMenu.find(m => m.id === item.id);
      if (!dbItem) {
        errors.push(`Item ID ${item.id} not found`);
      } else if (dbItem.stock < item.quantity) {
        errors.push(`Insufficient stock for '${dbItem.name}'. Available: ${dbItem.stock}, Requested: ${item.quantity}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Deduct stock
    for (const item of sortedDeductions) {
      const dbItem = currentMenu.find(m => m.id === item.id);
      dbItem.stock -= item.quantity;
      console.log(`[Inventory Lock] Deducted ${item.quantity} from '${dbItem.name}'. Remaining: ${dbItem.stock}`);
    }

    writeMenu(currentMenu);
    res.json({ message: 'Stock deducted successfully', menu: currentMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Release locks in reverse order
    for (let i = sortedDeductions.length - 1; i >= 0; i--) {
      getLock(sortedDeductions[i].id).release();
    }
  }
});

// Replenish stock (admin endpoint)
app.post('/menu/replenish', async (req, res) => {
  const { id, quantity } = req.body;
  if (!id || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid replenish request' });
  }

  const lock = getLock(id);
  await lock.acquire();

  try {
    const menu = readMenu();
    const dbItem = menu.find(m => m.id === id);
    if (!dbItem) return res.status(404).json({ error: 'Item not found' });

    dbItem.stock += quantity;
    writeMenu(menu);
    console.log(`[Inventory Lock] Replenished ${quantity} units for '${dbItem.name}'. Total: ${dbItem.stock}`);
    res.json(dbItem);
  } finally {
    lock.release();
  }
});

// Add Menu Item
app.post('/menu', (req, res) => {
  const { name, price, category, stock, available } = req.body;
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing name, price, or stock parameter' });
  }
  const currentMenu = readMenu();
  const newItem = {
    id: Date.now().toString(),
    name,
    price: Number(price),
    category: category || 'Snacks',
    stock: Number(stock),
    available: available !== undefined ? !!available : true,
    calories: 200,
    weight: 1
  };
  currentMenu.push(newItem);
  writeMenu(currentMenu);
  res.status(201).json(newItem);
});

// Update Menu Item
app.put('/menu/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, category, stock, available } = req.body;
  const currentMenu = readMenu();
  const dbItem = currentMenu.find(m => m.id === id);
  if (!dbItem) return res.status(404).json({ error: 'Item not found' });

  if (name !== undefined) dbItem.name = name;
  if (price !== undefined) dbItem.price = Number(price);
  if (category !== undefined) dbItem.category = category;
  if (stock !== undefined) dbItem.stock = Number(stock);
  if (available !== undefined) dbItem.available = !!available;

  writeMenu(currentMenu);
  res.json(dbItem);
});

// Delete Menu Item
app.delete('/menu/:id', (req, res) => {
  const { id } = req.params;
  let currentMenu = readMenu();
  const exists = currentMenu.some(m => m.id === id);
  if (!exists) return res.status(404).json({ error: 'Item not found' });

  currentMenu = currentMenu.filter(m => m.id !== id);
  writeMenu(currentMenu);
  res.json({ message: 'Item deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`[REST] Menu/Inventory Service running on port ${PORT}`);

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'menu-service',
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
