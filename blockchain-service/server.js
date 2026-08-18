import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const PORT = process.env.PORT || 8008;
const INSTANCE_ID = process.env.INSTANCE_ID || 'blockchain-service-01';
const startTime = Date.now();

// Blockchain classes
class Block {
  constructor(index, timestamp, transaction, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transaction = transaction; // e.g., { orderId, total, items }
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const dataStr = this.index + 
                    this.previousHash + 
                    this.timestamp + 
                    JSON.stringify(this.transaction) + 
                    this.nonce;
    return crypto.createHash('sha256').update(dataStr).digest('hex');
  }

  // Proof of Work
  mineBlock(difficulty = 2) {
    const target = Array(difficulty + 1).join('0'); // e.g. "00"
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`[Blockchain] Block ${this.index} mined! Nonce: ${this.nonce}, Hash: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Keep it low (2 zeros) for fast B.Tech lab demo execution
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), { message: 'Genesis Block - Canteen Ledger Start' }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    const latest = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      transaction,
      latest.hash
    );
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Re-calculate hash using current properties to detect modifications
      const recalculatedHash = crypto.createHash('sha256').update(
        current.index + 
        current.previousHash + 
        current.timestamp + 
        JSON.stringify(current.transaction) + 
        current.nonce
      ).digest('hex');

      if (current.hash !== recalculatedHash) {
        return {
          isValid: false,
          error: `Block ${current.index} has been modified! Recorded Hash: ${current.hash}, Recalculated: ${recalculatedHash}`,
          tamperedIndex: current.index
        };
      }

      if (current.previousHash !== previous.hash) {
        return {
          isValid: false,
          error: `Block ${current.index} previousHash doesn't match Block ${previous.index} hash!`,
          tamperedIndex: current.index
        };
      }
    }
    return { isValid: true };
  }
}

const canteenLedger = new Blockchain();

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'blockchain-service',
    instanceId: INSTANCE_ID,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Get ledger chain
app.get('/blockchain', (req, res) => {
  res.json({
    chain: canteenLedger.chain,
    difficulty: canteenLedger.difficulty
  });
});

// Add transaction to ledger (audit order)
app.post('/blockchain/transaction', (req, res) => {
  const { orderId, total, items, customerName } = req.body;
  if (!orderId || !total) {
    return res.status(400).json({ error: 'Invalid transaction payload' });
  }

  const transactionData = {
    orderId,
    total,
    items: items ? items.map(i => i.name) : [],
    customerName: customerName || 'Student',
    auditedAt: new Date().toISOString()
  };

  const block = canteenLedger.addTransaction(transactionData);
  res.status(201).json({ message: 'Transaction mined into ledger block', block });
});

// Verify ledger integrity
app.get('/blockchain/verify', (req, res) => {
  const result = canteenLedger.isChainValid();
  res.json(result);
});

// Modify block contents (tampering demo)
app.post('/blockchain/tamper', (req, res) => {
  const { index, newTotal } = req.body;
  const blockIdx = Number(index);

  if (blockIdx <= 0 || blockIdx >= canteenLedger.chain.length) {
    return res.status(400).json({ error: 'Cannot tamper with genesis block or invalid index' });
  }

  const block = canteenLedger.chain[blockIdx];
  const oldTotal = block.transaction.total;
  
  // Directly tamper with transaction content without mining/recalculating hashes
  block.transaction.total = Number(newTotal);
  block.transaction.tampered = true;
  block.transaction.tamperedAt = new Date().toISOString();

  console.warn(`[Blockchain Security ALERT] Block ${index} tampered! Changed total from ₹${oldTotal} to ₹${newTotal}`);
  
  res.json({
    message: `Tampered with Block ${index}. Transaction total modified from ₹${oldTotal} to ₹${newTotal}`,
    block
  });
});

app.listen(PORT, () => {
  console.log(`[REST] Blockchain Service running on port ${PORT}`);

  // Beacon Heartbeat
  setInterval(async () => {
    try {
      await fetch('http://localhost:8009/api/monitoring/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'blockchain-service',
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
