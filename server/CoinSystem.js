const crypto = require('crypto');

const ARENA_SIZE = 1080;
const ARENA_PADDING = 60;
const BATCH_MIN = 15;
const BATCH_MAX = 20;
const MAX_COINS = 35; // never exceed this on map
const RESPAWN_INTERVAL = 30000;
const COIN_COLLECT_RADIUS = 20;
const BIG_COIN_CHANCE = 0.15;

class CoinSystem {
  constructor() {
    this.coins = new Map();
    this.respawnTimer = RESPAWN_INTERVAL;
  }

  spawnBatch() {
    // Don't exceed max coins on map
    const currentCount = this.coins.size;
    if (currentCount >= MAX_COINS) return;
    const spaceLeft = MAX_COINS - currentCount;
    const batchSize = BATCH_MIN + Math.floor(Math.random() * (BATCH_MAX - BATCH_MIN + 1));
    const count = Math.min(batchSize, spaceLeft);
    for (let i = 0; i < count; i++) {
      const isBig = Math.random() < BIG_COIN_CHANCE;
      const coin = {
        id: crypto.randomUUID(),
        x: ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2),
        y: ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2),
        type: isBig ? 'big' : 'regular',
        value: isBig ? 15 : 5,
      };
      this.coins.set(coin.id, coin);
    }
  }

  getAll() {
    return Array.from(this.coins.values());
  }

  checkCollection(pacman) {
    if (!pacman.canCollectCoins()) return [];

    const collected = [];
    const toRemove = [];

    for (const coin of this.coins.values()) {
      const dx = pacman.x - coin.x;
      const dy = pacman.y - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const collectRadius = (pacman.size / 2) + COIN_COLLECT_RADIUS;

      if (dist < collectRadius) {
        collected.push({ id: coin.id, value: coin.value, x: coin.x, y: coin.y, type: coin.type });
        toRemove.push(coin.id);
      }
    }

    for (const id of toRemove) {
      this.coins.delete(id);
    }

    return collected;
  }

  update(dt) {
    this.respawnTimer -= dt;
    if (this.respawnTimer <= 0) {
      this.spawnBatch();
      this.respawnTimer = RESPAWN_INTERVAL;
    }
  }

  reset() {
    this.coins.clear();
    this.respawnTimer = RESPAWN_INTERVAL;
    this.spawnBatch();
  }

  toJSON() {
    return this.getAll().map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      type: c.type,
      value: c.value,
    }));
  }
}

module.exports = CoinSystem;
