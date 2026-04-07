# PAC BATTLE ARENA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TikTok Live Pac-Man arena game where players join via gifts, compete in Blue vs Pink teams, and interact through a 5-tier gift system — all rendered in a 1080x1080 OBS browser source.

**Architecture:** Server-authoritative. Node.js server runs all game logic at 30fps and broadcasts state via WebSocket. PixiJS client is a dumb renderer that draws whatever the server sends. TikTok Live events flow through tiktok-live-connector into the server's event queue.

**Tech Stack:** Node.js, Express, ws (WebSocket), PixiJS v7, tiktok-live-connector

**Design Spec:** `docs/superpowers/specs/2026-04-08-pac-battle-arena-design.md`

---

## File Structure

### Server Files
| File | Responsibility |
|---|---|
| `server/index.js` | Express static server + WebSocket server + TikTok bridge startup |
| `server/Game.js` | Main game loop (30fps tick), orchestrates all systems |
| `server/PacMan.js` | PacMan entity class — position, points, state, team, movement |
| `server/Arena.js` | Entity collection, spawning, removal, spatial queries |
| `server/CombatSystem.js` | Collision detection, damage resolution, knockback |
| `server/GiftSystem.js` | Gift effects (Rose→Fire Truck), timers, activation |
| `server/CoinSystem.js` | Coin spawning, collection checks, 30-second respawn timer |
| `server/TeamManager.js` | Team assignment, team scores, team player counts |
| `server/RoundManager.js` | 15-min timer, round end, winner calculation, reset |
| `server/GrowthSystem.js` | Size/speed/spin calculation from points |
| `server/tiktok/TikTokBridge.js` | tiktok-live-connector wrapper, event queue |
| `server/tiktok/GiftMapper.js` | Map TikTok gift names to game gift types |

### Client Files
| File | Responsibility |
|---|---|
| `client/index.html` | 1080x1080 page, loads PixiJS + app.js |
| `client/app.js` | PixiJS Application init, WebSocket client, render loop |
| `client/renderers/ArenaRenderer.js` | Background image, draws bg.jpeg |
| `client/renderers/PacManRenderer.js` | Pac-Man shapes, mouth animation, profile pics, labels |
| `client/renderers/HUDRenderer.js` | Team scores, timer, king, top 3, German text |
| `client/renderers/CoinRenderer.js` | Coin dots with glow, sparkle on pickup |
| `client/renderers/EffectRenderer.js` | Gift visual effects, freeze, fire, coin fly animation |
| `client/renderers/WinScreen.js` | Round end overlay, confetti, trophies |
| `client/SoundManager.js` | Web Audio API generated sounds |

### Test Files
| File | Tests |
|---|---|
| `tests/PacMan.test.js` | Entity creation, state transitions, movement |
| `tests/Arena.test.js` | Spawning, removal, spatial queries |
| `tests/CombatSystem.test.js` | Collision, damage, cooldown, knockback |
| `tests/GiftSystem.test.js` | Gift activation, timers, tier priority |
| `tests/CoinSystem.test.js` | Spawning, collection, respawn timer |
| `tests/TeamManager.test.js` | Team join, scores, player counts |
| `tests/RoundManager.test.js` | Timer, round end, reset |
| `tests/GrowthSystem.test.js` | Size/speed formulas |
| `tests/GiftMapper.test.js` | Gift name → type mapping |
| `tests/Game.test.js` | Game loop integration |

---

## Task 1: Project Setup & Dependencies

**Files:**
- Modify: `package.json`
- Create: `server/index.js`
- Create: `client/index.html`
- Create: `client/app.js`

- [ ] **Step 1: Install dependencies**

```bash
cd "/c/Users/ARFA TECH/Desktop/html5 and games/tikTok Game"
npm install express ws tiktok-live-connector
npm install --save-dev jest nodemon
```

- [ ] **Step 2: Update package.json scripts**

Update `package.json` to add test script:
```json
{
  "name": "pac-battle-arena",
  "version": "1.0.0",
  "description": "TikTok Live Pac-Man Arena Game",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "test": "jest --verbose",
    "test:watch": "jest --watch"
  },
  "keywords": ["tiktok", "live", "game", "pacman", "arena"],
  "author": "alihamza143143",
  "license": "MIT"
}
```

- [ ] **Step 3: Create server entry point**

Create `server/index.js`:
```javascript
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve client files
app.use(express.static(path.join(__dirname, '..', 'client')));

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(json);
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PAC BATTLE ARENA running on http://localhost:${PORT}`);
});

module.exports = { app, server, wss, broadcast, clients };
```

- [ ] **Step 4: Create client HTML**

Create `client/index.html`:
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAC BATTLE ARENA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="https://pixijs.download/release/pixi.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create client app.js skeleton**

Create `client/app.js`:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

// WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

let gameState = null;

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'gameState') {
    gameState = data;
  }
};

ws.onopen = () => console.log('Connected to server');
ws.onclose = () => console.log('Disconnected from server');

// Render loop
app.ticker.add(() => {
  if (!gameState) return;
  // Renderers will be added here
});
```

- [ ] **Step 6: Move assets to client directory**

```bash
mkdir -p client/assets
cp bg.jpeg client/assets/
cp "Team Girl.jpeg" "client/assets/team-girl.jpeg"
cp "Team Men.jpeg" "client/assets/team-men.jpeg"
```

- [ ] **Step 7: Run server to verify setup**

```bash
npm start
```
Expected: `PAC BATTLE ARENA running on http://localhost:3000`
Open http://localhost:3000 — should show black 1080x1080 canvas.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project setup with Express, WebSocket, PixiJS skeleton"
```

---

## Task 2: PacMan Entity

**Files:**
- Create: `server/PacMan.js`
- Create: `tests/PacMan.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/PacMan.test.js`:
```javascript
const PacMan = require('../server/PacMan');

describe('PacMan', () => {
  test('creates AI pacman with defaults', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    expect(pm.type).toBe('ai');
    expect(pm.team).toBe('blue');
    expect(pm.state).toBe('inactive');
    expect(pm.points).toBe(500);
    expect(pm.x).toBeGreaterThanOrEqual(0);
    expect(pm.y).toBeGreaterThanOrEqual(0);
    expect(pm.username).toMatch(/^Bot-/);
  });

  test('creates player pacman as neutral', () => {
    const pm = new PacMan({
      type: 'player',
      username: 'testUser',
      avatarUrl: 'https://example.com/pic.jpg',
    });
    expect(pm.type).toBe('player');
    expect(pm.state).toBe('neutral');
    expect(pm.team).toBeNull();
    expect(pm.points).toBe(500);
    expect(pm.username).toBe('testUser');
  });

  test('joinTeam changes state and team', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('pink');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
  });

  test('activate sets state to active', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.state = 'inactive';
    pm.activate();
    expect(pm.state).toBe('active');
  });

  test('takeDamage reduces points', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.takeDamage(50);
    expect(pm.points).toBe(450);
  });

  test('takeDamage does not go below 0', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.takeDamage(600);
    expect(pm.points).toBe(0);
    expect(pm.isEliminated()).toBe(true);
  });

  test('addPoints increases points', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.addPoints(100);
    expect(pm.points).toBe(600);
  });

  test('updateMovement changes position', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const oldX = pm.x;
    const oldY = pm.y;
    pm.angle = 0; // move right
    pm.updateMovement(33); // one tick
    // Position should change (or at least not throw)
    expect(typeof pm.x).toBe('number');
    expect(typeof pm.y).toBe('number');
  });

  test('canAttack returns true for active, false for inactive/neutral', () => {
    const active = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const inactive = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const neutral = new PacMan({ type: 'player', username: 'test' });
    expect(active.canAttack()).toBe(true);
    expect(inactive.canAttack()).toBe(false);
    expect(neutral.canAttack()).toBe(false);
  });

  test('canBeAttacked returns true for inactive/neutral, false for active', () => {
    const active = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const inactive = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const neutral = new PacMan({ type: 'player', username: 'test' });
    expect(active.canBeAttacked()).toBe(false);
    expect(inactive.canBeAttacked()).toBe(true);
    expect(neutral.canBeAttacked()).toBe(true);
  });

  test('toJSON serializes entity', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    const json = pm.toJSON();
    expect(json.id).toBeDefined();
    expect(json.type).toBe('ai');
    expect(json.team).toBe('blue');
    expect(json.points).toBe(500);
    expect(json.x).toBeDefined();
    expect(json.y).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/PacMan.test.js --verbose
```
Expected: FAIL — `Cannot find module '../server/PacMan'`

- [ ] **Step 3: Implement PacMan entity**

Create `server/PacMan.js`:
```javascript
const crypto = require('crypto');

const ARENA_SIZE = 1080;
const ARENA_PADDING = 60; // keep away from edges
const BASE_SIZE = 25;
const SIZE_PER_POINT = 1 / 25; // +1px per 25 points
const BASE_SPEED = 0.5;
const SPEED_FACTOR = 0.02;
const BASE_MOUTH_SPEED = 0.05;
const MOUTH_SPEED_FACTOR = 0.001;
const INACTIVE_TIMEOUT = 15000; // 15 seconds

class PacMan {
  constructor({ type, team = null, state = null, username = null, avatarUrl = null }) {
    this.id = crypto.randomUUID();
    this.type = type; // 'ai' | 'player'
    this.team = type === 'player' ? null : team;
    this.username = username || `Bot-${this.id.slice(0, 4)}`;
    this.avatarUrl = avatarUrl || null;

    // Default state
    if (state) {
      this.state = state;
    } else if (type === 'player') {
      this.state = 'neutral';
    } else {
      this.state = 'inactive';
    }

    // Position — random within arena
    this.x = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.y = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.angle = Math.random() * Math.PI * 2;

    // Stats
    this.points = 500;
    this.size = this._calcSize();
    this.speed = this._calcSpeed();

    // Mouth animation
    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.mouthSpeed = this._calcMouthSpeed();

    // Gift state
    this.activeGift = null;

    // King
    this.isKing = false;

    // Activity tracking
    this.lastActivityTime = Date.now();

    // Combat cooldowns: targetId -> timestamp
    this.hitCooldowns = {};

    // AI direction change timer
    this.dirChangeTimer = 2000 + Math.random() * 3000;
  }

  _calcSize() {
    return BASE_SIZE + this.points * SIZE_PER_POINT;
  }

  _calcSpeed() {
    const size = this._calcSize();
    return BASE_SPEED + size * SPEED_FACTOR;
  }

  _calcMouthSpeed() {
    if (this.state === 'inactive' || this.state === 'neutral') return 0;
    const size = this._calcSize();
    return BASE_MOUTH_SPEED + size * MOUTH_SPEED_FACTOR;
  }

  joinTeam(team) {
    this.team = team;
    this.state = 'active';
    this.lastActivityTime = Date.now();
  }

  activate() {
    if (this.team) {
      this.state = 'active';
      this.lastActivityTime = Date.now();
    }
  }

  addPoints(amount) {
    this.points += amount;
    this.size = this._calcSize();
    this.speed = this._calcSpeed();
    this.mouthSpeed = this._calcMouthSpeed();
  }

  takeDamage(amount) {
    this.points = Math.max(0, this.points - amount);
    this.size = this._calcSize();
    this.speed = this._calcSpeed();
    this.mouthSpeed = this._calcMouthSpeed();
  }

  isEliminated() {
    return this.points <= 0;
  }

  canAttack() {
    return this.state === 'active';
  }

  canBeAttacked() {
    return this.state === 'inactive' || this.state === 'neutral';
  }

  canCollectCoins() {
    return this.state === 'active';
  }

  checkInactivity(now) {
    if (this.type === 'ai') return; // AI state is managed separately
    if (this.state === 'active' && this.team) {
      if (now - this.lastActivityTime > INACTIVE_TIMEOUT) {
        this.state = 'inactive';
        this.mouthSpeed = this._calcMouthSpeed();
      }
    }
  }

  applyGift(giftType, color, durationMs) {
    // Higher tier replaces lower tier
    const tiers = { rose: 1, donut: 2, confetti: 3, moneygun: 4, firetruck: 5 };
    if (this.activeGift && tiers[this.activeGift.type] >= tiers[giftType]) {
      return false; // current gift is equal or higher tier
    }
    this.activeGift = { type: giftType, remainingMs: durationMs, color };
    this.lastActivityTime = Date.now();
    this.state = 'active';
    return true;
  }

  updateGiftTimer(dt) {
    if (!this.activeGift) return;
    this.activeGift.remainingMs -= dt;
    if (this.activeGift.remainingMs <= 0) {
      this.activeGift = null;
    }
  }

  getSpeedMultiplier() {
    if (!this.activeGift) return 1;
    const multipliers = {
      rose: 1.1,     // very minimal
      donut: 1.5,
      confetti: 1.8,
      moneygun: 1.5,
      firetruck: 2.5,
    };
    // Rose speed fades after 1 second
    if (this.activeGift.type === 'rose' && this.activeGift.remainingMs < 2000) {
      return 1;
    }
    return multipliers[this.activeGift.type] || 1;
  }

  getSizeMultiplier() {
    if (!this.activeGift) return 1;
    if (this.activeGift.type === 'firetruck') return 2.0;
    return 1;
  }

  getMouthSpeedMultiplier() {
    if (!this.activeGift) return 1;
    const multipliers = {
      rose: 1.2,
      donut: 1.8,
      confetti: 2.2,
      moneygun: 1.5,
      firetruck: 3.0,
    };
    return multipliers[this.activeGift.type] || 1;
  }

  getDamagePerHit() {
    if (!this.activeGift) return 5;
    const damage = {
      rose: 5,
      donut: 10,
      confetti: 20,
      moneygun: 0, // money gun does instant steal, not per-hit
      firetruck: 100,
    };
    return damage[this.activeGift.type] || 5;
  }

  canHitTarget(target) {
    if (!this.canAttack()) return false;
    if (!this.activeGift || this.activeGift.type === 'rose' || this.activeGift.type === 'confetti') {
      // Rose, Confetti, and no-gift: can only hit inactive
      return target.canBeAttacked();
    }
    if (this.activeGift.type === 'donut') {
      // Donut: can hit anyone without active gift protection
      return !target.activeGift;
    }
    if (this.activeGift.type === 'firetruck') {
      // Fire truck: hits everyone
      return target.id !== this.id;
    }
    return target.canBeAttacked();
  }

  isOnCooldown(targetId, now) {
    const last = this.hitCooldowns[targetId];
    if (!last) return false;
    return (now - last) < 500; // 0.5 second cooldown
  }

  recordHit(targetId, now) {
    this.hitCooldowns[targetId] = now;
  }

  updateMovement(dt) {
    const speedMult = this.getSpeedMultiplier();
    const actualSpeed = this.speed * speedMult;

    // Slow movement for inactive/neutral
    let moveFactor = 1;
    if (this.state === 'inactive') moveFactor = 0.3;
    if (this.state === 'neutral') moveFactor = 0.2;

    this.x += Math.cos(this.angle) * actualSpeed * moveFactor * (dt / 16);
    this.y += Math.sin(this.angle) * actualSpeed * moveFactor * (dt / 16);

    // Bounce off edges
    const effectiveSize = this.size * this.getSizeMultiplier();
    const halfSize = effectiveSize / 2;
    if (this.x < halfSize) { this.x = halfSize; this.angle = Math.PI - this.angle; }
    if (this.x > ARENA_SIZE - halfSize) { this.x = ARENA_SIZE - halfSize; this.angle = Math.PI - this.angle; }
    if (this.y < halfSize) { this.y = halfSize; this.angle = -this.angle; }
    if (this.y > ARENA_SIZE - halfSize) { this.y = ARENA_SIZE - halfSize; this.angle = -this.angle; }

    // Update mouth animation
    if (this.state === 'active') {
      const mouthMult = this.getMouthSpeedMultiplier();
      if (this.mouthOpening) {
        this.mouthAngle += this.mouthSpeed * mouthMult * (dt / 16);
        if (this.mouthAngle >= 45) this.mouthOpening = false;
      } else {
        this.mouthAngle -= this.mouthSpeed * mouthMult * (dt / 16);
        if (this.mouthAngle <= 0) this.mouthOpening = true;
      }
    } else {
      this.mouthAngle = 0;
    }
  }

  updateAI(dt) {
    if (this.type !== 'ai') return;
    this.dirChangeTimer -= dt;
    if (this.dirChangeTimer <= 0) {
      this.angle = Math.random() * Math.PI * 2;
      this.dirChangeTimer = 2000 + Math.random() * 3000;
    }
  }

  applyKnockback(fromX, fromY) {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / dist) * 15;
    this.y += (dy / dist) * 15;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      team: this.team,
      username: this.username,
      avatarUrl: this.avatarUrl,
      x: this.x,
      y: this.y,
      angle: this.angle,
      points: this.points,
      size: this.size * this.getSizeMultiplier(),
      speed: this.speed * this.getSpeedMultiplier(),
      mouthAngle: this.mouthAngle,
      mouthSpeed: this.mouthSpeed * this.getMouthSpeedMultiplier(),
      activeGift: this.activeGift ? { type: this.activeGift.type, color: this.activeGift.color, remainingMs: this.activeGift.remainingMs } : null,
      isKing: this.isKing,
    };
  }
}

module.exports = PacMan;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/PacMan.test.js --verbose
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/PacMan.js tests/PacMan.test.js
git commit -m "feat: PacMan entity with states, combat, gifts, movement"
```

---

## Task 3: Arena — Entity Management

**Files:**
- Create: `server/Arena.js`
- Create: `tests/Arena.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/Arena.test.js`:
```javascript
const Arena = require('../server/Arena');
const PacMan = require('../server/PacMan');

describe('Arena', () => {
  let arena;

  beforeEach(() => {
    arena = new Arena();
  });

  test('starts empty', () => {
    expect(arena.getAll().length).toBe(0);
  });

  test('addEntity adds and getById retrieves', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    arena.addEntity(pm);
    expect(arena.getAll().length).toBe(1);
    expect(arena.getById(pm.id)).toBe(pm);
  });

  test('removeEntity removes', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    arena.addEntity(pm);
    arena.removeEntity(pm.id);
    expect(arena.getAll().length).toBe(0);
  });

  test('spawnAI creates 20 AI pacmans (10 active, 10 inactive)', () => {
    arena.spawnInitialAI();
    const all = arena.getAll();
    expect(all.length).toBe(20);
    const active = all.filter(p => p.state === 'active');
    const inactive = all.filter(p => p.state === 'inactive');
    expect(active.length).toBe(10);
    expect(inactive.length).toBe(10);
  });

  test('spawnInitialAI splits evenly between teams', () => {
    arena.spawnInitialAI();
    const blue = arena.getAll().filter(p => p.team === 'blue');
    const pink = arena.getAll().filter(p => p.team === 'pink');
    expect(blue.length).toBe(10);
    expect(pink.length).toBe(10);
  });

  test('getAICount returns correct count', () => {
    arena.spawnInitialAI();
    expect(arena.getAICount()).toBe(20);
  });

  test('respawnAI fills back to 20', () => {
    arena.spawnInitialAI();
    const first = arena.getAll()[0];
    arena.removeEntity(first.id);
    expect(arena.getAICount()).toBe(19);
    arena.respawnAI();
    expect(arena.getAICount()).toBe(20);
  });

  test('getByUsername finds player', () => {
    const pm = new PacMan({ type: 'player', username: 'Ali' });
    arena.addEntity(pm);
    expect(arena.getByUsername('Ali')).toBe(pm);
  });

  test('getTeamEntities filters by team', () => {
    arena.spawnInitialAI();
    const blue = arena.getTeamEntities('blue');
    expect(blue.length).toBe(10);
    blue.forEach(p => expect(p.team).toBe('blue'));
  });

  test('getTeamScore sums points for team', () => {
    arena.spawnInitialAI();
    const blueScore = arena.getTeamScore('blue');
    // 10 blue AI * 500 = 5000
    expect(blueScore).toBe(5000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/Arena.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement Arena**

Create `server/Arena.js`:
```javascript
const PacMan = require('./PacMan');

const TARGET_AI_COUNT = 20;

class Arena {
  constructor() {
    this.entities = new Map(); // id -> PacMan
  }

  addEntity(pacman) {
    this.entities.set(pacman.id, pacman);
  }

  removeEntity(id) {
    this.entities.delete(id);
  }

  getById(id) {
    return this.entities.get(id) || null;
  }

  getByUsername(username) {
    for (const pm of this.entities.values()) {
      if (pm.username === username) return pm;
    }
    return null;
  }

  getAll() {
    return Array.from(this.entities.values());
  }

  getAICount() {
    return this.getAll().filter(p => p.type === 'ai').length;
  }

  getTeamEntities(team) {
    return this.getAll().filter(p => p.team === team);
  }

  getTeamScore(team) {
    return this.getTeamEntities(team).reduce((sum, p) => sum + p.points, 0);
  }

  getTeamPlayerCount(team) {
    return this.getAll().filter(p => p.type === 'player' && p.team === team).length;
  }

  getTop3() {
    return this.getAll()
      .filter(p => p.type === 'player' && p.team)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }

  getKing() {
    const players = this.getAll().filter(p => p.type === 'player' && p.team);
    if (players.length === 0) return null;
    return players.reduce((king, p) => p.points > king.points ? p : king, players[0]);
  }

  spawnInitialAI() {
    // 5 active blue, 5 active pink, 5 inactive blue, 5 inactive pink
    for (let i = 0; i < 5; i++) {
      this.addEntity(new PacMan({ type: 'ai', team: 'blue', state: 'active' }));
      this.addEntity(new PacMan({ type: 'ai', team: 'pink', state: 'active' }));
      this.addEntity(new PacMan({ type: 'ai', team: 'blue', state: 'inactive' }));
      this.addEntity(new PacMan({ type: 'ai', team: 'pink', state: 'inactive' }));
    }
  }

  respawnAI() {
    const currentAI = this.getAICount();
    const needed = TARGET_AI_COUNT - currentAI;
    for (let i = 0; i < needed; i++) {
      const team = i % 2 === 0 ? 'blue' : 'pink';
      const state = i % 4 < 2 ? 'active' : 'inactive';
      this.addEntity(new PacMan({ type: 'ai', team, state }));
    }
  }

  clear() {
    this.entities.clear();
  }
}

module.exports = Arena;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/Arena.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/Arena.js tests/Arena.test.js
git commit -m "feat: Arena entity management with AI spawning and team queries"
```

---

## Task 4: GrowthSystem

**Files:**
- Create: `server/GrowthSystem.js`
- Create: `tests/GrowthSystem.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/GrowthSystem.test.js`:
```javascript
const GrowthSystem = require('../server/GrowthSystem');
const PacMan = require('../server/PacMan');

describe('GrowthSystem', () => {
  test('calcSize returns base size for 0 points', () => {
    expect(GrowthSystem.calcSize(0)).toBe(25);
  });

  test('calcSize at 500 points', () => {
    expect(GrowthSystem.calcSize(500)).toBe(45);
  });

  test('calcSize at 2000 points', () => {
    expect(GrowthSystem.calcSize(2000)).toBe(105);
  });

  test('calcSize has no cap', () => {
    expect(GrowthSystem.calcSize(10000)).toBe(425);
  });

  test('calcSpeed increases with size', () => {
    const small = GrowthSystem.calcSpeed(25);
    const big = GrowthSystem.calcSpeed(100);
    expect(big).toBeGreaterThan(small);
  });

  test('calcMouthSpeed is 0 for inactive', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'inactive')).toBe(0);
  });

  test('calcMouthSpeed is 0 for neutral', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'neutral')).toBe(0);
  });

  test('calcMouthSpeed is positive for active', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'active')).toBeGreaterThan(0);
  });

  test('updateEntity recalculates size and speed', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    pm.points = 2000;
    GrowthSystem.updateEntity(pm);
    expect(pm.size).toBe(105);
    expect(pm.speed).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/GrowthSystem.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement GrowthSystem**

Create `server/GrowthSystem.js`:
```javascript
const BASE_SIZE = 25;
const SIZE_PER_POINT = 1 / 25; // +1px per 25 points
const BASE_SPEED = 0.5;
const SPEED_FACTOR = 0.02;
const BASE_MOUTH_SPEED = 0.05;
const MOUTH_SPEED_FACTOR = 0.001;

const GrowthSystem = {
  calcSize(points) {
    return BASE_SIZE + points * SIZE_PER_POINT;
  },

  calcSpeed(size) {
    return BASE_SPEED + size * SPEED_FACTOR;
  },

  calcMouthSpeed(size, state) {
    if (state === 'inactive' || state === 'neutral') return 0;
    return BASE_MOUTH_SPEED + size * MOUTH_SPEED_FACTOR;
  },

  updateEntity(pm) {
    pm.size = GrowthSystem.calcSize(pm.points);
    pm.speed = GrowthSystem.calcSpeed(pm.size);
    pm.mouthSpeed = GrowthSystem.calcMouthSpeed(pm.size, pm.state);
  },
};

module.exports = GrowthSystem;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/GrowthSystem.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/GrowthSystem.js tests/GrowthSystem.test.js
git commit -m "feat: GrowthSystem — continuous size/speed/spin scaling"
```

---

## Task 5: CombatSystem

**Files:**
- Create: `server/CombatSystem.js`
- Create: `tests/CombatSystem.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/CombatSystem.test.js`:
```javascript
const CombatSystem = require('../server/CombatSystem');
const PacMan = require('../server/PacMan');

describe('CombatSystem', () => {
  test('detects collision between two overlapping pacmans', () => {
    const a = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const b = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    a.x = 100; a.y = 100;
    b.x = 110; b.y = 100; // within radius
    expect(CombatSystem.checkCollision(a, b)).toBe(true);
  });

  test('no collision when far apart', () => {
    const a = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const b = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    a.x = 100; a.y = 100;
    b.x = 500; b.y = 500;
    expect(CombatSystem.checkCollision(a, b)).toBe(false);
  });

  test('active hits inactive for 5 damage (no gift)', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(5);
    expect(target.points).toBe(495);
  });

  test('inactive cannot hit active', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'active' });
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(false);
  });

  test('donut hits unprotected player for 10', () => {
    const attacker = new PacMan({ type: 'player', username: 'test' });
    attacker.joinTeam('blue');
    attacker.applyGift('donut', '#ffff00', 3000);
    const target = new PacMan({ type: 'player', username: 'test2' });
    target.joinTeam('pink');
    target.state = 'active'; // active but no gift = unprotected
    target.activeGift = null;
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(10);
  });

  test('donut cannot hit gift-protected player', () => {
    const attacker = new PacMan({ type: 'player', username: 'a' });
    attacker.joinTeam('blue');
    attacker.applyGift('donut', '#ffff00', 3000);
    const target = new PacMan({ type: 'player', username: 'b' });
    target.joinTeam('pink');
    target.applyGift('rose', '#ff69b4', 3000);
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(false);
  });

  test('firetruck hits active players', () => {
    const attacker = new PacMan({ type: 'player', username: 'a' });
    attacker.joinTeam('blue');
    attacker.applyGift('firetruck', '#ff4400', 5000);
    const target = new PacMan({ type: 'player', username: 'b' });
    target.joinTeam('pink');
    target.state = 'active';
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(100);
  });

  test('hit cooldown prevents rapid hits', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    const now = Date.now();
    const result1 = CombatSystem.resolveCombat(attacker, target, now);
    expect(result1.hit).toBe(true);
    const result2 = CombatSystem.resolveCombat(attacker, target, now + 100);
    expect(result2.hit).toBe(false); // cooldown
    const result3 = CombatSystem.resolveCombat(attacker, target, now + 600);
    expect(result3.hit).toBe(true); // cooldown expired
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/CombatSystem.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement CombatSystem**

Create `server/CombatSystem.js`:
```javascript
class CombatSystem {
  static checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const aRadius = (a.size * (a.getSizeMultiplier ? a.getSizeMultiplier() : 1)) / 2;
    const bRadius = (b.size * (b.getSizeMultiplier ? b.getSizeMultiplier() : 1)) / 2;
    return dist < (aRadius + bRadius);
  }

  static resolveCombat(attacker, target, now) {
    // Check if attacker can attack this target
    if (!attacker.canHitTarget(target)) {
      return { hit: false, damage: 0 };
    }

    // Check cooldown
    if (attacker.isOnCooldown(target.id, now)) {
      return { hit: false, damage: 0 };
    }

    const damage = attacker.getDamagePerHit();
    target.takeDamage(damage);
    attacker.addPoints(damage); // attacker gains what target loses
    attacker.recordHit(target.id, now);

    // Knockback
    target.applyKnockback(attacker.x, attacker.y);

    return { hit: true, damage };
  }

  static processAllCollisions(entities, now) {
    const results = [];
    const arr = entities;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (!CombatSystem.checkCollision(a, b)) continue;

        // Try both directions
        if (a.canHitTarget(b)) {
          const result = CombatSystem.resolveCombat(a, b, now);
          if (result.hit) results.push({ attacker: a.id, target: b.id, damage: result.damage });
        }
        if (b.canHitTarget(a)) {
          const result = CombatSystem.resolveCombat(b, a, now);
          if (result.hit) results.push({ attacker: b.id, target: a.id, damage: result.damage });
        }
      }
    }
    return results;
  }
}

module.exports = CombatSystem;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/CombatSystem.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/CombatSystem.js tests/CombatSystem.test.js
git commit -m "feat: CombatSystem — collision detection, damage, cooldowns, knockback"
```

---

## Task 6: GiftSystem

**Files:**
- Create: `server/GiftSystem.js`
- Create: `tests/GiftSystem.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/GiftSystem.test.js`:
```javascript
const GiftSystem = require('../server/GiftSystem');
const PacMan = require('../server/PacMan');
const Arena = require('../server/Arena');

describe('GiftSystem', () => {
  test('applyRose activates player with minimal boost', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('pink');
    pm.state = 'inactive';
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.state).toBe('active');
    expect(pm.activeGift.type).toBe('rose');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyDonut sets yellow color and 3 sec', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'donut');
    expect(pm.activeGift.type).toBe('donut');
    expect(pm.activeGift.color).toBe('#ffff00');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyConfetti sets rainbow and 3 sec', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'confetti');
    expect(pm.activeGift.type).toBe('confetti');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyFiretruck sets 5 sec duration', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'firetruck');
    expect(pm.activeGift.type).toBe('firetruck');
    expect(pm.activeGift.remainingMs).toBe(5000);
  });

  test('applyMoneyGun freezes all others and steals 50 from each', () => {
    const arena = new Arena();
    const user = new PacMan({ type: 'player', username: 'rich' });
    user.joinTeam('blue');
    arena.addEntity(user);

    const other1 = new PacMan({ type: 'ai', team: 'pink', state: 'active' });
    const other2 = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    arena.addEntity(other1);
    arena.addEntity(other2);

    const result = GiftSystem.applyMoneyGun(user, arena);
    expect(result.frozen.length).toBe(2);
    expect(other1.points).toBe(450); // lost 50
    expect(other2.points).toBe(450); // lost 50
    expect(user.points).toBe(600); // gained 100 (50 from each)
  });

  test('higher tier gift replaces lower tier', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.activeGift.type).toBe('rose');
    GiftSystem.applyGift(pm, 'donut');
    expect(pm.activeGift.type).toBe('donut');
  });

  test('lower tier gift does not replace higher tier', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'confetti');
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.activeGift.type).toBe('confetti');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/GiftSystem.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement GiftSystem**

Create `server/GiftSystem.js`:
```javascript
const GIFT_CONFIG = {
  rose: { color: '#ff69b4', duration: 3000, tier: 1 },
  donut: { color: '#ffff00', duration: 3000, tier: 2 },
  confetti: { color: '#ff00ff', duration: 3000, tier: 3 }, // rainbow handled on client
  moneygun: { color: '#ffd700', duration: 3000, tier: 4 },
  firetruck: { color: '#ff4400', duration: 5000, tier: 5 },
};

class GiftSystem {
  static applyGift(pacman, giftType) {
    const config = GIFT_CONFIG[giftType];
    if (!config) return false;

    pacman.activate();
    return pacman.applyGift(giftType, config.color, config.duration);
  }

  static applyMoneyGun(user, arena) {
    const config = GIFT_CONFIG.moneygun;
    user.applyGift('moneygun', config.color, config.duration);
    user.activate();

    const allOthers = arena.getAll().filter(p => p.id !== user.id);
    const frozen = [];
    let totalStolen = 0;

    for (const other of allOthers) {
      const steal = Math.min(50, other.points);
      other.takeDamage(steal);
      totalStolen += steal;
      frozen.push(other.id);
    }

    user.addPoints(totalStolen);

    return { frozen, totalStolen };
  }

  static getConfig(giftType) {
    return GIFT_CONFIG[giftType] || null;
  }
}

module.exports = GiftSystem;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/GiftSystem.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/GiftSystem.js tests/GiftSystem.test.js
git commit -m "feat: GiftSystem — 5-tier gifts with Rose through Fire Truck"
```

---

## Task 7: CoinSystem

**Files:**
- Create: `server/CoinSystem.js`
- Create: `tests/CoinSystem.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/CoinSystem.test.js`:
```javascript
const CoinSystem = require('../server/CoinSystem');
const PacMan = require('../server/PacMan');

describe('CoinSystem', () => {
  let coins;

  beforeEach(() => {
    coins = new CoinSystem();
  });

  test('spawnBatch creates 20-30 coins', () => {
    coins.spawnBatch();
    const count = coins.getAll().length;
    expect(count).toBeGreaterThanOrEqual(20);
    expect(count).toBeLessThanOrEqual(30);
  });

  test('coins have position and value', () => {
    coins.spawnBatch();
    const coin = coins.getAll()[0];
    expect(coin.x).toBeGreaterThanOrEqual(0);
    expect(coin.y).toBeGreaterThanOrEqual(0);
    expect(coin.value).toBeGreaterThan(0);
    expect(coin.type).toBeDefined();
  });

  test('active player can collect coin', () => {
    coins.spawnBatch();
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    const collected = coins.checkCollection(pm);
    expect(collected.length).toBeGreaterThan(0);
    expect(collected[0].value).toBeGreaterThan(0);
  });

  test('inactive player cannot collect coin', () => {
    coins.spawnBatch();
    const pm = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    const collected = coins.checkCollection(pm);
    expect(collected.length).toBe(0);
  });

  test('neutral player cannot collect coin', () => {
    coins.spawnBatch();
    const pm = new PacMan({ type: 'player', username: 'test' });
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    const collected = coins.checkCollection(pm);
    expect(collected.length).toBe(0);
  });

  test('collected coin is removed', () => {
    coins.spawnBatch();
    const initialCount = coins.getAll().length;
    const pm = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    coins.checkCollection(pm);
    expect(coins.getAll().length).toBe(initialCount - 1);
  });

  test('respawn timer spawns new batch after 30 seconds', () => {
    coins.spawnBatch();
    const initialCount = coins.getAll().length;
    // Simulate 30 seconds
    coins.update(30000);
    // Should have spawned additional coins
    expect(coins.getAll().length).toBeGreaterThan(initialCount);
  });

  test('toJSON serializes coins', () => {
    coins.spawnBatch();
    const json = coins.toJSON();
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].x).toBeDefined();
    expect(json[0].y).toBeDefined();
    expect(json[0].value).toBeDefined();
    expect(json[0].type).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/CoinSystem.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement CoinSystem**

Create `server/CoinSystem.js`:
```javascript
const crypto = require('crypto');

const ARENA_SIZE = 1080;
const ARENA_PADDING = 60;
const BATCH_MIN = 20;
const BATCH_MAX = 30;
const RESPAWN_INTERVAL = 30000; // 30 seconds
const COIN_COLLECT_RADIUS = 20;
const BIG_COIN_CHANCE = 0.15; // 15% chance of big coin

class CoinSystem {
  constructor() {
    this.coins = new Map(); // id -> coin
    this.respawnTimer = RESPAWN_INTERVAL;
  }

  spawnBatch() {
    const count = BATCH_MIN + Math.floor(Math.random() * (BATCH_MAX - BATCH_MIN + 1));
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
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/CoinSystem.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/CoinSystem.js tests/CoinSystem.test.js
git commit -m "feat: CoinSystem — coin spawning, collection, 30-sec respawn"
```

---

## Task 8: TeamManager

**Files:**
- Create: `server/TeamManager.js`
- Create: `tests/TeamManager.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/TeamManager.test.js`:
```javascript
const TeamManager = require('../server/TeamManager');
const PacMan = require('../server/PacMan');
const Arena = require('../server/Arena');

describe('TeamManager', () => {
  let arena, tm;

  beforeEach(() => {
    arena = new Arena();
    tm = new TeamManager(arena);
  });

  test('joinTeam assigns player to pink via rose', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
  });

  test('joinTeam assigns player to blue via tiktok gift', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'tiktok');
    expect(pm.team).toBe('blue');
    expect(pm.state).toBe('active');
  });

  test('already on team does not reassign', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    tm.joinTeam(pm, 'tiktok');
    expect(pm.team).toBe('pink'); // stays pink
  });

  test('getTeamScores returns both team totals', () => {
    arena.spawnInitialAI();
    const scores = tm.getTeamScores();
    expect(scores.blue).toBe(5000); // 10 AI * 500
    expect(scores.pink).toBe(5000);
  });

  test('getTeamPlayerCounts returns player counts', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    const counts = tm.getTeamPlayerCounts();
    expect(counts.pink).toBe(1);
    expect(counts.blue).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/TeamManager.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement TeamManager**

Create `server/TeamManager.js`:
```javascript
class TeamManager {
  constructor(arena) {
    this.arena = arena;
  }

  joinTeam(pacman, giftType) {
    // Already on a team — don't reassign
    if (pacman.team) return false;

    if (giftType === 'rose') {
      pacman.joinTeam('pink');
    } else {
      pacman.joinTeam('blue');
    }
    return true;
  }

  getTeamScores() {
    return {
      blue: this.arena.getTeamScore('blue'),
      pink: this.arena.getTeamScore('pink'),
    };
  }

  getTeamPlayerCounts() {
    return {
      blue: this.arena.getTeamPlayerCount('blue'),
      pink: this.arena.getTeamPlayerCount('pink'),
    };
  }
}

module.exports = TeamManager;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/TeamManager.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/TeamManager.js tests/TeamManager.test.js
git commit -m "feat: TeamManager — team join via gifts, scores, player counts"
```

---

## Task 9: RoundManager

**Files:**
- Create: `server/RoundManager.js`
- Create: `tests/RoundManager.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/RoundManager.test.js`:
```javascript
const RoundManager = require('../server/RoundManager');

describe('RoundManager', () => {
  let rm;

  beforeEach(() => {
    rm = new RoundManager();
  });

  test('starts at round 1 with 15 minutes', () => {
    expect(rm.roundNumber).toBe(1);
    expect(rm.remainingMs).toBe(15 * 60 * 1000);
  });

  test('update decrements timer', () => {
    rm.update(1000);
    expect(rm.remainingMs).toBe(15 * 60 * 1000 - 1000);
  });

  test('isRoundOver returns false during round', () => {
    expect(rm.isRoundOver()).toBe(false);
  });

  test('isRoundOver returns true when timer hits 0', () => {
    rm.update(15 * 60 * 1000);
    expect(rm.isRoundOver()).toBe(true);
  });

  test('nextRound resets timer and increments round', () => {
    rm.update(15 * 60 * 1000);
    rm.nextRound();
    expect(rm.roundNumber).toBe(2);
    expect(rm.remainingMs).toBe(15 * 60 * 1000);
    expect(rm.isRoundOver()).toBe(false);
    expect(rm.showingResults).toBe(false);
  });

  test('getRemainingSeconds returns seconds', () => {
    rm.update(5000);
    const secs = rm.getRemainingSeconds();
    expect(secs).toBe(Math.ceil((15 * 60 * 1000 - 5000) / 1000));
  });

  test('showResults sets flag and timer', () => {
    rm.showResults();
    expect(rm.showingResults).toBe(true);
    expect(rm.resultTimer).toBe(10000);
  });

  test('updateResults counts down and signals done', () => {
    rm.showResults();
    const done = rm.updateResults(10000);
    expect(done).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/RoundManager.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement RoundManager**

Create `server/RoundManager.js`:
```javascript
const ROUND_DURATION = 15 * 60 * 1000; // 15 minutes
const RESULT_DISPLAY_TIME = 10000; // 10 seconds

class RoundManager {
  constructor() {
    this.roundNumber = 1;
    this.remainingMs = ROUND_DURATION;
    this.showingResults = false;
    this.resultTimer = 0;
  }

  update(dt) {
    if (this.showingResults) return;
    this.remainingMs = Math.max(0, this.remainingMs - dt);
  }

  isRoundOver() {
    return this.remainingMs <= 0;
  }

  getRemainingSeconds() {
    return Math.ceil(this.remainingMs / 1000);
  }

  showResults() {
    this.showingResults = true;
    this.resultTimer = RESULT_DISPLAY_TIME;
  }

  updateResults(dt) {
    this.resultTimer -= dt;
    return this.resultTimer <= 0;
  }

  nextRound() {
    this.roundNumber++;
    this.remainingMs = ROUND_DURATION;
    this.showingResults = false;
    this.resultTimer = 0;
  }

  toJSON() {
    return {
      number: this.roundNumber,
      remainingSeconds: this.getRemainingSeconds(),
      totalSeconds: ROUND_DURATION / 1000,
      showingResults: this.showingResults,
    };
  }
}

module.exports = RoundManager;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/RoundManager.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/RoundManager.js tests/RoundManager.test.js
git commit -m "feat: RoundManager — 15-min timer, round end, result screen"
```

---

## Task 10: TikTok Bridge & Gift Mapper

**Files:**
- Create: `server/tiktok/TikTokBridge.js`
- Create: `server/tiktok/GiftMapper.js`
- Create: `tests/GiftMapper.test.js`

- [ ] **Step 1: Write failing tests for GiftMapper**

Create `tests/GiftMapper.test.js`:
```javascript
const GiftMapper = require('../server/tiktok/GiftMapper');

describe('GiftMapper', () => {
  test('maps Rose to rose gift type', () => {
    expect(GiftMapper.mapGift('Rose')).toBe('rose');
  });

  test('maps Donut to donut gift type', () => {
    expect(GiftMapper.mapGift('Donut')).toBe('donut');
  });

  test('maps Confetti to confetti gift type', () => {
    expect(GiftMapper.mapGift('Confetti')).toBe('confetti');
  });

  test('maps Money Gun to moneygun gift type', () => {
    expect(GiftMapper.mapGift('Money Gun')).toBe('moneygun');
  });

  test('maps Fire Truck to firetruck gift type', () => {
    expect(GiftMapper.mapGift('Fire Truck')).toBe('firetruck');
  });

  test('maps TikTok logo gift to tiktok (team join)', () => {
    expect(GiftMapper.mapGift('TikTok')).toBe('tiktok');
  });

  test('returns null for unknown gift', () => {
    expect(GiftMapper.mapGift('Unknown Gift')).toBeNull();
  });

  test('isTeamJoinGift identifies rose and tiktok', () => {
    expect(GiftMapper.isTeamJoinGift('rose')).toBe(true);
    expect(GiftMapper.isTeamJoinGift('tiktok')).toBe(true);
    expect(GiftMapper.isTeamJoinGift('donut')).toBe(false);
  });

  test('case insensitive matching', () => {
    expect(GiftMapper.mapGift('rose')).toBe('rose');
    expect(GiftMapper.mapGift('ROSE')).toBe('rose');
    expect(GiftMapper.mapGift('money gun')).toBe('moneygun');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/GiftMapper.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement GiftMapper**

Create `server/tiktok/GiftMapper.js`:
```javascript
// Map TikTok gift display names to game gift types.
// Gift names may vary by TikTok region — update this mapping as needed.
const GIFT_MAP = {
  'rose': 'rose',
  'donut': 'donut',
  'confetti': 'confetti',
  'money gun': 'moneygun',
  'fire truck': 'firetruck',
  'tiktok': 'tiktok', // TikTok logo gift = blue team join
};

const TEAM_JOIN_GIFTS = new Set(['rose', 'tiktok']);

class GiftMapper {
  static mapGift(giftName) {
    const normalized = giftName.toLowerCase().trim();
    return GIFT_MAP[normalized] || null;
  }

  static isTeamJoinGift(giftType) {
    return TEAM_JOIN_GIFTS.has(giftType);
  }
}

module.exports = GiftMapper;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/GiftMapper.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Implement TikTokBridge**

Create `server/tiktok/TikTokBridge.js`:
```javascript
const { WebcastPushConnection } = require('tiktok-live-connector');
const GiftMapper = require('./GiftMapper');

class TikTokBridge {
  constructor(username, eventQueue) {
    this.username = username;
    this.eventQueue = eventQueue;
    this.connection = null;
    this.connected = false;
  }

  async connect() {
    this.connection = new WebcastPushConnection(this.username);

    try {
      const state = await this.connection.connect();
      this.connected = true;
      console.log(`Connected to TikTok Live: ${this.username} (${state.roomId})`);
    } catch (err) {
      console.error('TikTok connection failed:', err.message);
      console.log('Running in offline mode (no TikTok events)');
      return;
    }

    // Chat / comment event — spawn as neutral
    this.connection.on('chat', (data) => {
      this.eventQueue.push({
        type: 'chat',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        comment: data.comment,
      });
    });

    // Like event — activate player
    this.connection.on('like', (data) => {
      this.eventQueue.push({
        type: 'like',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        likeCount: data.likeCount,
      });
    });

    // Gift event — team join or power-up
    this.connection.on('gift', (data) => {
      // Only process when gift streak ends (or non-streak gifts)
      if (data.giftType === 1 && !data.repeatEnd) return;

      const giftType = GiftMapper.mapGift(data.giftName);
      if (!giftType) {
        console.log(`Unknown gift: ${data.giftName}`);
        return;
      }

      this.eventQueue.push({
        type: 'gift',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        giftType,
        giftName: data.giftName,
        diamondCount: data.diamondCount,
      });
    });

    // Member join event — spawn as neutral
    this.connection.on('member', (data) => {
      this.eventQueue.push({
        type: 'join',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
      });
    });

    this.connection.on('disconnected', () => {
      this.connected = false;
      console.log('TikTok disconnected. Attempting reconnect in 5s...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connected = false;
    }
  }
}

module.exports = TikTokBridge;
```

- [ ] **Step 6: Commit**

```bash
git add server/tiktok/GiftMapper.js server/tiktok/TikTokBridge.js tests/GiftMapper.test.js
git commit -m "feat: TikTok bridge and gift mapper for live events"
```

---

## Task 11: Game Loop — Orchestrator

**Files:**
- Create: `server/Game.js`
- Create: `tests/Game.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/Game.test.js`:
```javascript
const Game = require('../server/Game');

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.start();
  });

  afterEach(() => {
    game.stop();
  });

  test('starts with 20 AI', () => {
    expect(game.arena.getAICount()).toBe(20);
  });

  test('starts with coins', () => {
    expect(game.coinSystem.getAll().length).toBeGreaterThanOrEqual(20);
  });

  test('tick updates game state', () => {
    const state = game.tick(33);
    expect(state.type).toBe('gameState');
    expect(state.entities).toBeDefined();
    expect(state.teams).toBeDefined();
    expect(state.round).toBeDefined();
    expect(state.coins).toBeDefined();
  });

  test('processJoin creates neutral player', () => {
    game.processEvent({
      type: 'join',
      username: 'testUser',
      nickname: 'Test',
      avatarUrl: 'https://example.com/pic.jpg',
    });
    const pm = game.arena.getByUsername('testUser');
    expect(pm).not.toBeNull();
    expect(pm.state).toBe('neutral');
    expect(pm.team).toBeNull();
  });

  test('processGift rose joins pink team', () => {
    game.processEvent({ type: 'join', username: 'user1', nickname: 'U1', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user1', giftType: 'rose' });
    const pm = game.arena.getByUsername('user1');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
  });

  test('processGift tiktok joins blue team', () => {
    game.processEvent({ type: 'join', username: 'user2', nickname: 'U2', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user2', giftType: 'tiktok' });
    const pm = game.arena.getByUsername('user2');
    expect(pm.team).toBe('blue');
  });

  test('processLike activates inactive player', () => {
    game.processEvent({ type: 'join', username: 'user3', nickname: 'U3', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user3', giftType: 'rose' });
    const pm = game.arena.getByUsername('user3');
    pm.state = 'inactive';
    game.processEvent({ type: 'like', username: 'user3' });
    expect(pm.state).toBe('active');
  });

  test('reset clears and restarts', () => {
    game.processEvent({ type: 'join', username: 'user4', nickname: 'U4', avatarUrl: '' });
    game.reset();
    expect(game.arena.getByUsername('user4')).toBeNull();
    expect(game.arena.getAICount()).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/Game.test.js --verbose
```
Expected: FAIL

- [ ] **Step 3: Implement Game**

Create `server/Game.js`:
```javascript
const Arena = require('./Arena');
const CombatSystem = require('./CombatSystem');
const GiftSystem = require('./GiftSystem');
const CoinSystem = require('./CoinSystem');
const TeamManager = require('./TeamManager');
const RoundManager = require('./RoundManager');
const GrowthSystem = require('./GrowthSystem');
const PacMan = require('./PacMan');
const GiftMapper = require('./tiktok/GiftMapper');

const TICK_RATE = 33; // ~30fps

class Game {
  constructor() {
    this.arena = new Arena();
    this.coinSystem = new CoinSystem();
    this.teamManager = new TeamManager(this.arena);
    this.roundManager = new RoundManager();
    this.eventQueue = [];
    this.visualEvents = []; // for client animations
    this.frozenUntil = 0; // timestamp when freeze ends
    this.running = false;
    this.intervalId = null;
  }

  start() {
    this.arena.spawnInitialAI();
    this.coinSystem.spawnBatch();
    this.running = true;
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  startLoop(broadcastFn) {
    this.start();
    this.intervalId = setInterval(() => {
      const state = this.tick(TICK_RATE);
      broadcastFn(state);
    }, TICK_RATE);
  }

  tick(dt) {
    const now = Date.now();

    // 1. Process event queue
    while (this.eventQueue.length > 0) {
      this.processEvent(this.eventQueue.shift());
    }

    // 2. Check if showing results
    if (this.roundManager.showingResults) {
      const done = this.roundManager.updateResults(dt);
      if (done) {
        this.reset();
        this.roundManager.nextRound();
      }
      return this._buildState();
    }

    // 3. Update round timer
    this.roundManager.update(dt);
    if (this.roundManager.isRoundOver()) {
      this.roundManager.showResults();
      return this._buildRoundEndState();
    }

    // 4. Update entities
    const entities = this.arena.getAll();
    const isFrozen = now < this.frozenUntil;

    for (const pm of entities) {
      // Update gift timers
      pm.updateGiftTimer(dt);

      // Movement (skip if frozen, except money gun user)
      if (isFrozen && !(pm.activeGift && pm.activeGift.type === 'moneygun')) {
        // Frozen — no movement
      } else {
        pm.updateMovement(dt);
        pm.updateAI(dt);
      }

      // Check inactivity
      pm.checkInactivity(now);

      // Growth recalc
      GrowthSystem.updateEntity(pm);
    }

    // 5. Combat
    if (!isFrozen) {
      CombatSystem.processAllCollisions(entities, now);
    }

    // 6. Coin collection
    for (const pm of entities) {
      const collected = this.coinSystem.checkCollection(pm);
      for (const coin of collected) {
        pm.addPoints(coin.value);
        this.visualEvents.push({
          type: 'coinCollect',
          x: coin.x,
          y: coin.y,
          value: coin.value,
          collector: pm.id,
        });
      }
    }
    this.coinSystem.update(dt);

    // 7. Check eliminations and respawn
    for (const pm of entities) {
      if (pm.isEliminated()) {
        if (pm.type === 'ai') {
          this.arena.removeEntity(pm.id);
        } else {
          // Player resets to neutral
          pm.points = 500;
          pm.state = 'neutral';
          pm.team = null;
          pm.activeGift = null;
          GrowthSystem.updateEntity(pm);
        }
      }
    }
    this.arena.respawnAI();

    // 8. Update king
    this._updateKing();

    // 9. Clean old visual events
    this.visualEvents = this.visualEvents.slice(-20);

    return this._buildState();
  }

  processEvent(event) {
    switch (event.type) {
      case 'join':
      case 'chat': {
        // Spawn as neutral if not already in arena
        if (!this.arena.getByUsername(event.username)) {
          const pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }
        break;
      }

      case 'like': {
        // Spawn if not exists, then activate
        let pm = this.arena.getByUsername(event.username);
        if (!pm) {
          pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }
        if (pm.team) {
          pm.activate();
        }
        break;
      }

      case 'gift': {
        // Spawn if not exists
        let pm = this.arena.getByUsername(event.username);
        if (!pm) {
          pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }

        const giftType = event.giftType;

        // Team join (if not on a team yet)
        if (!pm.team && GiftMapper.isTeamJoinGift(giftType)) {
          this.teamManager.joinTeam(pm, giftType);
        }

        // Apply gift effect (if on a team)
        if (pm.team) {
          if (giftType === 'moneygun') {
            const result = GiftSystem.applyMoneyGun(pm, this.arena);
            this.frozenUntil = Date.now() + 3000;
            this.visualEvents.push({
              type: 'moneygun',
              userId: pm.id,
              frozen: result.frozen,
              totalStolen: result.totalStolen,
            });
          } else if (giftType !== 'tiktok') {
            // tiktok gift is only for team join, no power-up
            GiftSystem.applyGift(pm, giftType);
            if (giftType === 'firetruck') {
              this.visualEvents.push({
                type: 'firetruck',
                userId: pm.id,
              });
            }
          }
        }
        break;
      }
    }
  }

  _updateKing() {
    const entities = this.arena.getAll();
    for (const pm of entities) pm.isKing = false;
    const king = this.arena.getKing();
    if (king) king.isKing = true;
  }

  _buildState() {
    const scores = this.teamManager.getTeamScores();
    const counts = this.teamManager.getTeamPlayerCounts();
    const top3 = this.arena.getTop3().map(p => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
    }));
    const king = this.arena.getKing();

    return {
      type: 'gameState',
      entities: this.arena.getAll().map(p => p.toJSON()),
      teams: {
        blue: { score: scores.blue, playerCount: counts.blue },
        pink: { score: scores.pink, playerCount: counts.pink },
      },
      top3,
      king: king ? { username: king.username, points: king.points, avatarUrl: king.avatarUrl } : null,
      round: this.roundManager.toJSON(),
      coins: this.coinSystem.toJSON(),
      events: this.visualEvents,
    };
  }

  _buildRoundEndState() {
    const scores = this.teamManager.getTeamScores();
    const top3 = this.arena.getTop3().map((p, i) => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
      trophy: ['gold', 'silver', 'bronze'][i],
    }));
    const king = this.arena.getKing();

    return {
      type: 'roundEnd',
      winningTeam: scores.blue > scores.pink ? 'blue' : 'pink',
      teamScores: scores,
      top3,
      king: king ? { username: king.username, points: king.points, avatarUrl: king.avatarUrl } : null,
      round: this.roundManager.toJSON(),
    };
  }

  reset() {
    this.arena.clear();
    this.arena.spawnInitialAI();
    this.coinSystem.reset();
    this.visualEvents = [];
    this.frozenUntil = 0;
  }
}

module.exports = Game;
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/Game.test.js --verbose
```
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/Game.js tests/Game.test.js
git commit -m "feat: Game loop orchestrator — ties all server systems together"
```

---

## Task 12: Wire Server Entry Point

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Update server/index.js to use Game and TikTok**

Replace `server/index.js` with:
```javascript
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const Game = require('./Game');
const TikTokBridge = require('./tiktok/TikTokBridge');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve client files
app.use(express.static(path.join(__dirname, '..', 'client')));

// Game instance
const game = new Game();

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

function broadcast(state) {
  const json = JSON.stringify(state);
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(json);
    }
  }
}

// Start game loop
game.startLoop(broadcast);

// TikTok connection
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'playandwin2026';
const tiktok = new TikTokBridge(TIKTOK_USERNAME, game.eventQueue);
tiktok.connect().catch(err => {
  console.error('TikTok bridge error:', err.message);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PAC BATTLE ARENA running on http://localhost:${PORT}`);
  console.log(`TikTok: ${TIKTOK_USERNAME}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  game.stop();
  tiktok.disconnect();
  server.close();
  process.exit(0);
});

module.exports = { app, server, wss, game };
```

- [ ] **Step 2: Run all server tests**

```bash
npx jest --verbose
```
Expected: All tests pass

- [ ] **Step 3: Start server and verify WebSocket broadcasts**

```bash
npm start
```
Expected: Server starts, logs `PAC BATTLE ARENA running on http://localhost:3000`. Opens browser — should see black canvas (no rendering yet, but WebSocket data flows).

- [ ] **Step 4: Commit**

```bash
git add server/index.js
git commit -m "feat: wire server entry point with Game loop and TikTok bridge"
```

---

## Task 13: Client — Arena Renderer (Background)

**Files:**
- Create: `client/renderers/ArenaRenderer.js`
- Modify: `client/app.js`

- [ ] **Step 1: Create ArenaRenderer**

Create `client/renderers/ArenaRenderer.js`:
```javascript
class ArenaRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.bgSprite = null;
  }

  async init() {
    const texture = await PIXI.Assets.load('assets/bg.jpeg');
    this.bgSprite = new PIXI.Sprite(texture);
    this.bgSprite.width = 1080;
    this.bgSprite.height = 1080;
    this.container.addChild(this.bgSprite);
  }

  update(gameState) {
    // Background is static — nothing to update per frame
  }
}
```

- [ ] **Step 2: Update app.js to use ArenaRenderer**

Replace `client/app.js` with:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

// Load renderers via script tags (no bundler)
// They are loaded before app.js in index.html

let gameState = null;
let roundEndState = null;

// Renderers
let arenaRenderer = null;

async function init() {
  arenaRenderer = new ArenaRenderer(app);
  await arenaRenderer.init();

  // Connect WebSocket
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
      gameState = data;
      roundEndState = null;
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  // Render loop
  app.ticker.add(() => {
    if (roundEndState) {
      // Win screen will handle this
      return;
    }
    if (!gameState) return;
    arenaRenderer.update(gameState);
  });
}

init();
```

- [ ] **Step 3: Update index.html to load renderer scripts**

Replace `client/index.html`:
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAC BATTLE ARENA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="https://pixijs.download/release/pixi.min.js"></script>
  <script src="renderers/ArenaRenderer.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Test — start server and verify background renders**

```bash
npm start
```
Open http://localhost:3000 — should see the neon maze background image filling the 1080x1080 canvas.

- [ ] **Step 5: Commit**

```bash
git add client/
git commit -m "feat: ArenaRenderer — background image rendering with PixiJS"
```

---

## Task 14: Client — PacMan Renderer

**Files:**
- Create: `client/renderers/PacManRenderer.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create PacManRenderer**

Create `client/renderers/PacManRenderer.js`:
```javascript
class PacManRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.sprites = new Map(); // entity id -> sprite group
    this.avatarTextures = new Map(); // url -> texture
  }

  update(gameState) {
    const entities = gameState.entities;
    const currentIds = new Set(entities.map(e => e.id));

    // Remove sprites for entities that no longer exist
    for (const [id, group] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(group);
        group.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    // Update or create sprites
    for (const entity of entities) {
      let group = this.sprites.get(entity.id);
      if (!group) {
        group = this._createPacManGroup(entity);
        this.sprites.set(entity.id, group);
        this.container.addChild(group);
      }
      this._updatePacManGroup(group, entity);
    }
  }

  _getColor(entity) {
    // Gift color takes priority during effect
    if (entity.activeGift) {
      const colors = {
        '#ff69b4': 0xff69b4,
        '#ffff00': 0xffff00,
        '#ff00ff': 0xff00ff,
        '#ffd700': 0xffd700,
        '#ff4400': 0xff4400,
      };
      return colors[entity.activeGift.color] || 0xffffff;
    }
    if (!entity.team) return 0xff0000; // neutral = red
    return entity.team === 'blue' ? 0x4488ff : 0xff69b4;
  }

  _createPacManGroup(entity) {
    const group = new PIXI.Container();
    group.entityId = entity.id;

    // Glow circle (behind pacman)
    const glow = new PIXI.Graphics();
    group.addChild(glow);
    group.glow = glow;

    // Pac-Man body
    const body = new PIXI.Graphics();
    group.addChild(body);
    group.body = body;

    // Avatar (profile picture) — loaded async
    const avatarContainer = new PIXI.Container();
    group.addChild(avatarContainer);
    group.avatarContainer = avatarContainer;

    if (entity.avatarUrl) {
      this._loadAvatar(entity.avatarUrl, avatarContainer, entity.size);
    }

    // Eye
    const eye = new PIXI.Graphics();
    group.addChild(eye);
    group.eye = eye;

    // Label (username + points or "Wähle ein Team")
    const label = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xffffff,
      align: 'center',
      strokeThickness: 2,
      stroke: 0x000000,
    });
    label.anchor.set(0.5, 1);
    group.addChild(label);
    group.label = label;

    // Crown (if king)
    const crown = new PIXI.Text('👑', { fontSize: 16 });
    crown.anchor.set(0.5, 1);
    crown.visible = false;
    group.addChild(crown);
    group.crown = crown;

    return group;
  }

  async _loadAvatar(url, container, size) {
    if (!url) return;
    try {
      let texture = this.avatarTextures.get(url);
      if (!texture) {
        texture = await PIXI.Assets.load(url);
        this.avatarTextures.set(url, texture);
      }
      const avatar = new PIXI.Sprite(texture);
      avatar.anchor.set(0.5);
      avatar.width = size * 0.6;
      avatar.height = size * 0.6;
      // Circular mask
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawCircle(0, 0, size * 0.3);
      mask.endFill();
      container.addChild(mask);
      avatar.mask = mask;
      container.addChild(avatar);
      container.avatar = avatar;
      container.mask = mask;
    } catch (e) {
      // Avatar load failed — silently skip
    }
  }

  _updatePacManGroup(group, entity) {
    const color = this._getColor(entity);
    const size = entity.size;
    const halfSize = size / 2;

    // Position
    group.x = entity.x;
    group.y = entity.y;

    // Glow
    group.glow.clear();
    const glowAlpha = entity.activeGift ? 0.3 : 0.15;
    group.glow.beginFill(color, glowAlpha);
    group.glow.drawCircle(0, 0, halfSize + 8);
    group.glow.endFill();

    // Body — Pac-Man shape with mouth
    const mouthAngle = (entity.mouthAngle || 0) * (Math.PI / 180);
    const startAngle = entity.angle + mouthAngle;
    const endAngle = entity.angle + (Math.PI * 2) - mouthAngle;

    group.body.clear();
    group.body.beginFill(color, 0.3);
    group.body.lineStyle(2.5, color, 1);
    group.body.moveTo(0, 0);
    group.body.arc(0, 0, halfSize, startAngle, endAngle);
    group.body.closePath();
    group.body.endFill();

    // Avatar size update
    if (group.avatarContainer.avatar) {
      group.avatarContainer.avatar.width = size * 0.6;
      group.avatarContainer.avatar.height = size * 0.6;
      if (group.avatarContainer.mask) {
        group.avatarContainer.mask.clear();
        group.avatarContainer.mask.beginFill(0xffffff);
        group.avatarContainer.mask.drawCircle(0, 0, size * 0.3);
        group.avatarContainer.mask.endFill();
      }
    }

    // Eye
    const eyeOffsetX = Math.cos(entity.angle - 0.5) * halfSize * 0.5;
    const eyeOffsetY = Math.sin(entity.angle - 0.5) * halfSize * 0.5;
    group.eye.clear();
    group.eye.beginFill(0xffffff);
    group.eye.drawCircle(eyeOffsetX, eyeOffsetY - halfSize * 0.2, size * 0.08);
    group.eye.endFill();
    group.eye.beginFill(0x000000);
    group.eye.drawCircle(eyeOffsetX, eyeOffsetY - halfSize * 0.2, size * 0.04);
    group.eye.endFill();

    // Label
    if (!entity.team) {
      group.label.text = 'Wähle ein Team';
      group.label.style.fill = 0xff6666;
    } else {
      group.label.text = `${entity.username}\n${entity.points}`;
      group.label.style.fill = 0xffffff;
    }
    group.label.y = -halfSize - 10;

    // Crown
    group.crown.visible = entity.isKing;
    group.crown.y = -halfSize - 28;

    // Dim inactive
    const isInactive = entity.state === 'inactive';
    group.alpha = isInactive ? 0.6 : 1;
  }
}
```

- [ ] **Step 2: Update app.js to use PacManRenderer**

Add to `client/app.js` — after arenaRenderer init, before WebSocket:
```javascript
// Add after arenaRenderer init:
let pacmanRenderer = null;

// Inside init(), after arenaRenderer.init():
pacmanRenderer = new PacManRenderer(app);

// Inside render loop, after arenaRenderer.update():
pacmanRenderer.update(gameState);
```

Full updated `client/app.js`:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

let gameState = null;
let roundEndState = null;
let arenaRenderer = null;
let pacmanRenderer = null;

async function init() {
  arenaRenderer = new ArenaRenderer(app);
  await arenaRenderer.init();
  pacmanRenderer = new PacManRenderer(app);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
      gameState = data;
      roundEndState = null;
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  app.ticker.add(() => {
    if (roundEndState) return;
    if (!gameState) return;
    arenaRenderer.update(gameState);
    pacmanRenderer.update(gameState);
  });
}

init();
```

- [ ] **Step 3: Update index.html to load PacManRenderer**

Add before `app.js` in `client/index.html`:
```html
<script src="renderers/PacManRenderer.js"></script>
```

- [ ] **Step 4: Test — verify Pac-Mans render on screen**

```bash
npm start
```
Open http://localhost:3000 — should see 20 AI Pac-Mans moving around on the neon background with team colors and labels.

- [ ] **Step 5: Commit**

```bash
git add client/
git commit -m "feat: PacManRenderer — Pac-Man shapes, colors, avatars, labels, king crown"
```

---

## Task 15: Client — HUD Renderer

**Files:**
- Create: `client/renderers/HUDRenderer.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create HUDRenderer**

Create `client/renderers/HUDRenderer.js`:
```javascript
class HUDRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._createElements();
  }

  _createElements() {
    // Top bar background
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x000000, 0.5);
    topBar.drawRoundedRect(10, 8, 1060, 50, 10);
    topBar.endFill();
    this.container.addChild(topBar);

    // Pink team score (left)
    this.pinkScore = new PIXI.Text('🌹 PINK: 0', {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xff69b4,
    });
    this.pinkScore.x = 30;
    this.pinkScore.y = 18;
    this.container.addChild(this.pinkScore);

    // Round + Timer (center)
    this.roundText = new PIXI.Text('RUNDE 1 — 15:00', {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    this.roundText.anchor.set(0.5, 0);
    this.roundText.x = 540;
    this.roundText.y = 18;
    this.container.addChild(this.roundText);

    // Blue team score (right)
    this.blueScore = new PIXI.Text('🎵 BLUE: 0', {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x4488ff,
    });
    this.blueScore.anchor.set(1, 0);
    this.blueScore.x = 1050;
    this.blueScore.y = 18;
    this.container.addChild(this.blueScore);

    // King display (top-left below bar)
    this.kingText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffd700,
      strokeThickness: 2,
      stroke: 0x000000,
    });
    this.kingText.x = 20;
    this.kingText.y = 68;
    this.container.addChild(this.kingText);

    // Top 3 (bottom-right)
    this.top3Container = new PIXI.Container();
    this.top3Container.x = 880;
    this.top3Container.y = 990;
    this.container.addChild(this.top3Container);

    this.top3Texts = [];
    const trophies = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x000000, 0.5);
      bg.drawRoundedRect(0, i * 26, 190, 24, 6);
      bg.endFill();
      this.top3Container.addChild(bg);

      const text = new PIXI.Text(`${trophies[i]} ---`, {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: 0xffffff,
      });
      text.x = 8;
      text.y = i * 26 + 3;
      this.top3Container.addChild(text);
      this.top3Texts.push(text);
    }
  }

  update(gameState) {
    const { teams, round, king, top3 } = gameState;

    // Team scores
    this.pinkScore.text = `🌹 PINK: ${teams.pink.score.toLocaleString('de-DE')}`;
    this.blueScore.text = `🎵 BLUE: ${teams.blue.score.toLocaleString('de-DE')}`;

    // Round timer
    const mins = Math.floor(round.remainingSeconds / 60);
    const secs = round.remainingSeconds % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    this.roundText.text = `RUNDE ${round.number} — ${timeStr}`;

    // King
    if (king) {
      this.kingText.text = `👑 König: ${king.username} (${king.points.toLocaleString('de-DE')})`;
    } else {
      this.kingText.text = '';
    }

    // Top 3
    const trophies = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
      if (top3[i]) {
        this.top3Texts[i].text = `${trophies[i]} ${top3[i].username}: ${top3[i].points.toLocaleString('de-DE')}`;
      } else {
        this.top3Texts[i].text = `${trophies[i]} ---`;
      }
    }
  }
}
```

- [ ] **Step 2: Update app.js and index.html**

Add to `client/app.js`:
```javascript
let hudRenderer = null;
// In init():
hudRenderer = new HUDRenderer(app);
// In render loop:
hudRenderer.update(gameState);
```

Add to `client/index.html` before app.js:
```html
<script src="renderers/HUDRenderer.js"></script>
```

Full updated `client/app.js`:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

let gameState = null;
let roundEndState = null;
let arenaRenderer = null;
let pacmanRenderer = null;
let hudRenderer = null;

async function init() {
  arenaRenderer = new ArenaRenderer(app);
  await arenaRenderer.init();
  pacmanRenderer = new PacManRenderer(app);
  hudRenderer = new HUDRenderer(app);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
      gameState = data;
      roundEndState = null;
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  app.ticker.add(() => {
    if (roundEndState) return;
    if (!gameState) return;
    arenaRenderer.update(gameState);
    pacmanRenderer.update(gameState);
    hudRenderer.update(gameState);
  });
}

init();
```

- [ ] **Step 3: Test — verify HUD shows on screen**

```bash
npm start
```
Open http://localhost:3000 — should see team scores at top, timer in center, king display, and top 3 leaderboard. All in German.

- [ ] **Step 4: Commit**

```bash
git add client/
git commit -m "feat: HUDRenderer — team scores, timer, king, top 3 in German"
```

---

## Task 16: Client — Coin Renderer

**Files:**
- Create: `client/renderers/CoinRenderer.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create CoinRenderer**

Create `client/renderers/CoinRenderer.js`:
```javascript
class CoinRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.coinSprites = new Map();
    this.sparkles = [];
  }

  update(gameState) {
    const coins = gameState.coins || [];
    const currentIds = new Set(coins.map(c => c.id));

    // Remove old coins (with sparkle effect)
    for (const [id, sprite] of this.coinSprites) {
      if (!currentIds.has(id)) {
        this._addSparkle(sprite.x, sprite.y);
        this.container.removeChild(sprite);
        sprite.destroy();
        this.coinSprites.delete(id);
      }
    }

    // Add/update coins
    for (const coin of coins) {
      let sprite = this.coinSprites.get(coin.id);
      if (!sprite) {
        sprite = this._createCoinSprite(coin);
        this.coinSprites.set(coin.id, sprite);
        this.container.addChild(sprite);
      }
      // Gentle float animation
      sprite.y = coin.y + Math.sin(Date.now() / 500 + coin.x) * 2;
    }

    // Update sparkles
    this._updateSparkles();

    // Check for coin collect events
    if (gameState.events) {
      for (const evt of gameState.events) {
        if (evt.type === 'coinCollect') {
          this._addSparkle(evt.x, evt.y);
        }
      }
    }
  }

  _createCoinSprite(coin) {
    const g = new PIXI.Graphics();
    const isBig = coin.type === 'big';
    const radius = isBig ? 8 : 5;
    const color = isBig ? 0xffd700 : 0xffffaa;
    const glowColor = isBig ? 0xffd700 : 0xffff88;

    // Glow
    g.beginFill(glowColor, 0.2);
    g.drawCircle(0, 0, radius + 6);
    g.endFill();

    // Coin
    g.beginFill(color);
    g.drawCircle(0, 0, radius);
    g.endFill();

    g.x = coin.x;
    g.y = coin.y;
    return g;
  }

  _addSparkle(x, y) {
    for (let i = 0; i < 6; i++) {
      const sparkle = new PIXI.Graphics();
      sparkle.beginFill(0xffd700);
      sparkle.drawCircle(0, 0, 2);
      sparkle.endFill();
      sparkle.x = x;
      sparkle.y = y;
      sparkle.vx = (Math.random() - 0.5) * 4;
      sparkle.vy = (Math.random() - 0.5) * 4;
      sparkle.life = 20;
      this.container.addChild(sparkle);
      this.sparkles.push(sparkle);
    }
  }

  _updateSparkles() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha = s.life / 20;
      s.life--;
      if (s.life <= 0) {
        this.container.removeChild(s);
        s.destroy();
        this.sparkles.splice(i, 1);
      }
    }
  }
}
```

- [ ] **Step 2: Update app.js and index.html**

Add `coinRenderer` following the same pattern. Insert between pacmanRenderer and hudRenderer so coins render below HUD but above background.

Full updated `client/app.js`:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

let gameState = null;
let roundEndState = null;
let arenaRenderer = null;
let coinRenderer = null;
let pacmanRenderer = null;
let hudRenderer = null;

async function init() {
  arenaRenderer = new ArenaRenderer(app);
  await arenaRenderer.init();
  coinRenderer = new CoinRenderer(app);
  pacmanRenderer = new PacManRenderer(app);
  hudRenderer = new HUDRenderer(app);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
      gameState = data;
      roundEndState = null;
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  app.ticker.add(() => {
    if (roundEndState) return;
    if (!gameState) return;
    arenaRenderer.update(gameState);
    coinRenderer.update(gameState);
    pacmanRenderer.update(gameState);
    hudRenderer.update(gameState);
  });
}

init();
```

Add to `client/index.html`:
```html
<script src="renderers/CoinRenderer.js"></script>
```

- [ ] **Step 3: Test — coins visible on arena**

```bash
npm start
```
Expected: Glowing coins scattered on arena. Small white coins and occasional big golden coins.

- [ ] **Step 4: Commit**

```bash
git add client/
git commit -m "feat: CoinRenderer — glowing coins with sparkle pickup effect"
```

---

## Task 17: Client — Effect Renderer (Gift Visuals)

**Files:**
- Create: `client/renderers/EffectRenderer.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create EffectRenderer**

Create `client/renderers/EffectRenderer.js`:
```javascript
class EffectRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.particles = [];
    this.freezeOverlay = null;
    this.processedEvents = new Set();
  }

  update(gameState) {
    const events = gameState.events || [];

    for (const evt of events) {
      const key = `${evt.type}-${evt.userId || ''}-${evt.x || 0}`;
      if (this.processedEvents.has(key)) continue;
      this.processedEvents.add(key);

      if (evt.type === 'moneygun') {
        this._showFreezeEffect();
        this._showCoinFlyEffect(evt, gameState.entities);
      } else if (evt.type === 'firetruck') {
        this._showExplosionEffect(evt, gameState.entities);
      }
    }

    // Limit processed events cache
    if (this.processedEvents.size > 100) {
      this.processedEvents.clear();
    }

    // Update freeze overlay
    this._updateFreezeOverlay();

    // Update particles
    this._updateParticles();

    // Fire truck active effect — fire particles around user
    for (const entity of gameState.entities) {
      if (entity.activeGift && entity.activeGift.type === 'firetruck') {
        this._addFireParticles(entity.x, entity.y, entity.size);
      }
    }
  }

  _showFreezeEffect() {
    if (this.freezeOverlay) {
      this.container.removeChild(this.freezeOverlay);
      this.freezeOverlay.destroy();
    }
    this.freezeOverlay = new PIXI.Graphics();
    this.freezeOverlay.beginFill(0x88ccff, 0.15);
    this.freezeOverlay.drawRect(0, 0, 1080, 1080);
    this.freezeOverlay.endFill();
    this.freezeOverlay.life = 90; // ~3 seconds at 30fps
    this.container.addChild(this.freezeOverlay);
  }

  _updateFreezeOverlay() {
    if (!this.freezeOverlay) return;
    this.freezeOverlay.life--;
    this.freezeOverlay.alpha = this.freezeOverlay.life / 90;
    if (this.freezeOverlay.life <= 0) {
      this.container.removeChild(this.freezeOverlay);
      this.freezeOverlay.destroy();
      this.freezeOverlay = null;
    }
  }

  _showCoinFlyEffect(evt, entities) {
    const user = entities.find(e => e.id === evt.userId);
    if (!user) return;
    for (const entity of entities) {
      if (entity.id === evt.userId) continue;
      // Create coins flying from each player to the money gun user
      for (let i = 0; i < 3; i++) {
        const coin = new PIXI.Graphics();
        coin.beginFill(0xffd700);
        coin.drawCircle(0, 0, 4);
        coin.endFill();
        coin.x = entity.x;
        coin.y = entity.y;
        coin.targetX = user.x;
        coin.targetY = user.y;
        coin.progress = 0;
        coin.speed = 0.02 + Math.random() * 0.02;
        coin.delay = i * 5;
        coin.type = 'coinfly';
        this.container.addChild(coin);
        this.particles.push(coin);
      }
    }
  }

  _showExplosionEffect(evt, entities) {
    const user = entities.find(e => e.id === evt.userId);
    if (!user) return;
    // Burst of fire particles
    for (let i = 0; i < 30; i++) {
      const p = new PIXI.Graphics();
      const color = Math.random() > 0.5 ? 0xff4400 : 0xffa500;
      p.beginFill(color);
      p.drawCircle(0, 0, 3 + Math.random() * 4);
      p.endFill();
      p.x = user.x;
      p.y = user.y;
      p.vx = (Math.random() - 0.5) * 12;
      p.vy = (Math.random() - 0.5) * 12;
      p.life = 30 + Math.random() * 20;
      p.type = 'explosion';
      this.container.addChild(p);
      this.particles.push(p);
    }
  }

  _addFireParticles(x, y, size) {
    if (Math.random() > 0.3) return; // throttle
    const p = new PIXI.Graphics();
    const color = Math.random() > 0.5 ? 0xff4400 : 0xff6600;
    p.beginFill(color, 0.7);
    p.drawCircle(0, 0, 2 + Math.random() * 3);
    p.endFill();
    p.x = x + (Math.random() - 0.5) * size;
    p.y = y + (Math.random() - 0.5) * size;
    p.vy = -1 - Math.random() * 2;
    p.vx = (Math.random() - 0.5) * 1;
    p.life = 15 + Math.random() * 10;
    p.type = 'fire';
    this.container.addChild(p);
    this.particles.push(p);
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'coinfly') {
        if (p.delay > 0) { p.delay--; continue; }
        p.progress += p.speed;
        p.x += (p.targetX - p.x) * p.speed * 3;
        p.y += (p.targetY - p.y) * p.speed * 3;
        p.alpha = 1 - p.progress;
        if (p.progress >= 1) {
          this.container.removeChild(p);
          p.destroy();
          this.particles.splice(i, 1);
        }
      } else {
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        p.life--;
        p.alpha = Math.max(0, p.life / 30);
        if (p.life <= 0) {
          this.container.removeChild(p);
          p.destroy();
          this.particles.splice(i, 1);
        }
      }
    }
  }
}
```

- [ ] **Step 2: Update app.js and index.html**

Add `effectRenderer` between pacmanRenderer and hudRenderer. Update app.js:

```javascript
let effectRenderer = null;
// In init():
effectRenderer = new EffectRenderer(app);
// In render loop:
effectRenderer.update(gameState);
```

Full render order in app.js ticker:
```javascript
arenaRenderer.update(gameState);
coinRenderer.update(gameState);
pacmanRenderer.update(gameState);
effectRenderer.update(gameState);
hudRenderer.update(gameState);
```

Add to index.html:
```html
<script src="renderers/EffectRenderer.js"></script>
```

- [ ] **Step 3: Test — verify effects work**

Test by modifying `Game.js` temporarily to auto-apply a gift to an AI, or wait for TikTok events. Money Gun should show freeze overlay + flying coins. Fire Truck should show explosion + fire particles.

- [ ] **Step 4: Commit**

```bash
git add client/
git commit -m "feat: EffectRenderer — freeze, coin fly, explosion, fire particles"
```

---

## Task 18: Client — Win Screen

**Files:**
- Create: `client/renderers/WinScreen.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create WinScreen**

Create `client/renderers/WinScreen.js`:
```javascript
class WinScreen {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);
    this.confettiParticles = [];
    this.built = false;
  }

  show(roundEndData) {
    this.container.visible = true;
    this._build(roundEndData);
    this._startConfetti();
  }

  hide() {
    this.container.visible = false;
    this._clearConfetti();
    // Remove all children
    while (this.container.children.length > 0) {
      this.container.removeChildAt(0);
    }
    this.built = false;
  }

  update() {
    if (!this.container.visible) return;
    this._updateConfetti();
  }

  _build(data) {
    // Dark overlay
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.75);
    overlay.drawRect(0, 0, 1080, 1080);
    overlay.endFill();
    this.container.addChild(overlay);

    // Title
    const title = new PIXI.Text('RUNDE BEENDET!', {
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffd700,
      align: 'center',
    });
    title.anchor.set(0.5);
    title.x = 540;
    title.y = 150;
    this.container.addChild(title);

    // Winning team
    const winColor = data.winningTeam === 'blue' ? 0x4488ff : 0xff69b4;
    const winName = data.winningTeam === 'blue' ? 'TEAM BLUE' : 'TEAM PINK';
    const winText = new PIXI.Text(`🏆 ${winName} GEWINNT! 🏆`, {
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: winColor,
      align: 'center',
    });
    winText.anchor.set(0.5);
    winText.x = 540;
    winText.y = 250;
    this.container.addChild(winText);

    // Team scores
    const scoreText = new PIXI.Text(
      `PINK: ${data.teamScores.pink.toLocaleString('de-DE')}  |  BLUE: ${data.teamScores.blue.toLocaleString('de-DE')}`,
      {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: 0xffffff,
        align: 'center',
      }
    );
    scoreText.anchor.set(0.5);
    scoreText.x = 540;
    scoreText.y = 320;
    this.container.addChild(scoreText);

    // Top 3
    const trophyEmojis = ['🥇', '🥈', '🥉'];
    const trophyColors = [0xffd700, 0xc0c0c0, 0xcd7f32];
    for (let i = 0; i < data.top3.length; i++) {
      const p = data.top3[i];
      const y = 420 + i * 80;

      const bg = new PIXI.Graphics();
      bg.beginFill(trophyColors[i], 0.2);
      bg.drawRoundedRect(290, y - 10, 500, 60, 12);
      bg.endFill();
      bg.lineStyle(2, trophyColors[i], 0.5);
      bg.drawRoundedRect(290, y - 10, 500, 60, 12);
      this.container.addChild(bg);

      const text = new PIXI.Text(
        `${trophyEmojis[i]}  ${p.username}  —  ${p.points.toLocaleString('de-DE')} Punkte`,
        {
          fontFamily: 'Arial',
          fontSize: 24,
          fontWeight: 'bold',
          fill: trophyColors[i],
          align: 'center',
        }
      );
      text.anchor.set(0.5);
      text.x = 540;
      text.y = y + 20;
      this.container.addChild(text);
    }

    // King
    if (data.king) {
      const kingText = new PIXI.Text(
        `👑 König: ${data.king.username} (${data.king.points.toLocaleString('de-DE')})`,
        {
          fontFamily: 'Arial',
          fontSize: 20,
          fill: 0xffd700,
          align: 'center',
        }
      );
      kingText.anchor.set(0.5);
      kingText.x = 540;
      kingText.y = 700;
      this.container.addChild(kingText);
    }

    // Next round text
    const nextText = new PIXI.Text('Nächste Runde startet gleich...', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xaaaaaa,
      align: 'center',
    });
    nextText.anchor.set(0.5);
    nextText.x = 540;
    nextText.y = 800;
    this.container.addChild(nextText);
  }

  _startConfetti() {
    for (let i = 0; i < 100; i++) {
      const p = new PIXI.Graphics();
      const colors = [0xff69b4, 0x4488ff, 0xffd700, 0xff4400, 0x00ff88];
      p.beginFill(colors[Math.floor(Math.random() * colors.length)]);
      p.drawRect(0, 0, 6, 12);
      p.endFill();
      p.x = Math.random() * 1080;
      p.y = -20 - Math.random() * 200;
      p.vy = 1 + Math.random() * 3;
      p.vx = (Math.random() - 0.5) * 2;
      p.rotation = Math.random() * Math.PI;
      p.vr = (Math.random() - 0.5) * 0.1;
      this.container.addChild(p);
      this.confettiParticles.push(p);
    }
  }

  _updateConfetti() {
    for (const p of this.confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      if (p.y > 1100) {
        p.y = -20;
        p.x = Math.random() * 1080;
      }
    }
  }

  _clearConfetti() {
    for (const p of this.confettiParticles) {
      this.container.removeChild(p);
      p.destroy();
    }
    this.confettiParticles = [];
  }
}
```

- [ ] **Step 2: Update app.js to handle round end**

Full final `client/app.js`:
```javascript
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

let gameState = null;
let roundEndState = null;
let arenaRenderer = null;
let coinRenderer = null;
let pacmanRenderer = null;
let effectRenderer = null;
let hudRenderer = null;
let winScreen = null;
let showingWinScreen = false;

async function init() {
  arenaRenderer = new ArenaRenderer(app);
  await arenaRenderer.init();
  coinRenderer = new CoinRenderer(app);
  pacmanRenderer = new PacManRenderer(app);
  effectRenderer = new EffectRenderer(app);
  hudRenderer = new HUDRenderer(app);
  winScreen = new WinScreen(app);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'gameState') {
      gameState = data;
      if (showingWinScreen && !data.round.showingResults) {
        winScreen.hide();
        showingWinScreen = false;
      }
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
      if (!showingWinScreen) {
        winScreen.show(data);
        showingWinScreen = true;
      }
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  app.ticker.add(() => {
    if (showingWinScreen) {
      winScreen.update();
      return;
    }
    if (!gameState) return;
    arenaRenderer.update(gameState);
    coinRenderer.update(gameState);
    pacmanRenderer.update(gameState);
    effectRenderer.update(gameState);
    hudRenderer.update(gameState);
  });
}

init();
```

- [ ] **Step 3: Update index.html**

Final `client/index.html`:
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAC BATTLE ARENA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="https://pixijs.download/release/pixi.min.js"></script>
  <script src="renderers/ArenaRenderer.js"></script>
  <script src="renderers/CoinRenderer.js"></script>
  <script src="renderers/PacManRenderer.js"></script>
  <script src="renderers/EffectRenderer.js"></script>
  <script src="renderers/HUDRenderer.js"></script>
  <script src="renderers/WinScreen.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Test — full game visual**

```bash
npm start
```
Open http://localhost:3000 — should see complete game with background, Pac-Mans, coins, HUD. After 15 minutes (or set timer to 10 seconds for testing), the win screen should appear with confetti.

- [ ] **Step 5: Commit**

```bash
git add client/
git commit -m "feat: WinScreen — round end celebration with confetti, trophies, German text"
```

---

## Task 19: Client — Sound Manager

**Files:**
- Create: `client/SoundManager.js`
- Modify: `client/app.js`
- Modify: `client/index.html`

- [ ] **Step 1: Create SoundManager**

Create `client/SoundManager.js`:
```javascript
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
  }

  _getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  }

  _playTone(freq, duration, type = 'sine', vol = this.volume) {
    if (!this.enabled) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context not ready — ignore
    }
  }

  coinCollect() {
    this._playTone(800, 0.1, 'sine', 0.15);
  }

  hit() {
    this._playTone(200, 0.08, 'square', 0.1);
  }

  giftRose() {
    this._playTone(600, 0.15, 'sine', 0.2);
  }

  giftDonut() {
    this._playTone(700, 0.2, 'sine', 0.25);
    setTimeout(() => this._playTone(900, 0.15, 'sine', 0.2), 100);
  }

  giftConfetti() {
    this._playTone(800, 0.2, 'sine', 0.25);
    setTimeout(() => this._playTone(1000, 0.15, 'sine', 0.2), 80);
    setTimeout(() => this._playTone(1200, 0.15, 'sine', 0.2), 160);
  }

  giftMoneyGun() {
    // Cash register sound
    this._playTone(1200, 0.05, 'square', 0.2);
    setTimeout(() => this._playTone(1500, 0.05, 'square', 0.2), 50);
    setTimeout(() => this._playTone(1800, 0.1, 'sine', 0.25), 100);
  }

  giftFireTruck() {
    // Explosion boom
    this._playTone(80, 0.4, 'sawtooth', 0.3);
    this._playTone(60, 0.5, 'sine', 0.2);
    setTimeout(() => this._playTone(120, 0.3, 'square', 0.15), 200);
  }

  freeze() {
    // Ice crystal
    this._playTone(2000, 0.3, 'sine', 0.15);
    setTimeout(() => this._playTone(2500, 0.2, 'sine', 0.1), 150);
  }

  roundEnd() {
    // Victory fanfare
    this._playTone(523, 0.15, 'sine', 0.25);
    setTimeout(() => this._playTone(659, 0.15, 'sine', 0.25), 150);
    setTimeout(() => this._playTone(784, 0.3, 'sine', 0.3), 300);
  }

  kingTransfer() {
    this._playTone(523, 0.1, 'sine', 0.15);
    setTimeout(() => this._playTone(784, 0.2, 'sine', 0.2), 100);
  }
}
```

- [ ] **Step 2: Integrate SoundManager into app.js**

Add sound manager and trigger sounds based on game events. Add to `app.js`:

```javascript
const soundManager = new SoundManager();
```

In the WebSocket onmessage handler, check for events:
```javascript
// Inside ws.onmessage, after setting gameState:
if (data.type === 'gameState' && data.events) {
  for (const evt of data.events) {
    if (evt.type === 'coinCollect') soundManager.coinCollect();
    if (evt.type === 'moneygun') { soundManager.giftMoneyGun(); soundManager.freeze(); }
    if (evt.type === 'firetruck') soundManager.giftFireTruck();
  }
}
if (data.type === 'roundEnd') {
  soundManager.roundEnd();
}
```

- [ ] **Step 3: Update index.html**

Add before app.js:
```html
<script src="SoundManager.js"></script>
```

- [ ] **Step 4: Test — verify sounds play**

```bash
npm start
```
Open in browser — coin collection should make a soft ping. Gift events should trigger appropriate sounds.

- [ ] **Step 5: Commit**

```bash
git add client/
git commit -m "feat: SoundManager — Web Audio API sounds for gifts, coins, events"
```

---

## Task 20: Integration Test & Polish

**Files:**
- Modify: various files for bug fixes

- [ ] **Step 1: Run all tests**

```bash
npx jest --verbose
```
Expected: All tests pass

- [ ] **Step 2: Start full game and visual check**

```bash
npm start
```

Checklist:
- [ ] Background image loads correctly
- [ ] 20 AI Pac-Mans visible, moving, team-colored
- [ ] Active AI have mouth animation, inactive don't
- [ ] Coins visible on arena
- [ ] HUD shows team scores, timer, top 3
- [ ] Timer counts down from 15:00
- [ ] German text visible ("Wähle ein Team")
- [ ] Pac-Mans bounce off edges

- [ ] **Step 3: Test TikTok integration (if live is active)**

Start with TikTok username:
```bash
TIKTOK_USERNAME=playandwin2026 npm start
```

Or test offline by manually pushing events:
```javascript
// In browser console or a test script, push events to game.eventQueue
game.eventQueue.push({ type: 'join', username: 'TestUser', avatarUrl: '' });
game.eventQueue.push({ type: 'gift', username: 'TestUser', giftType: 'rose' });
```

- [ ] **Step 4: Fix any visual issues found**

Common fixes:
- Adjust PacMan sizes if too big/small
- Adjust speeds if too fast/slow
- Adjust HUD positioning
- Fix any z-ordering issues

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: integration polish — visual fixes and final adjustments"
git push origin main
```

---

## Task Summary

| Task | Description | Est. Time |
|---|---|---|
| 1 | Project setup & dependencies | 5 min |
| 2 | PacMan entity | 10 min |
| 3 | Arena entity management | 8 min |
| 4 | GrowthSystem | 5 min |
| 5 | CombatSystem | 10 min |
| 6 | GiftSystem | 8 min |
| 7 | CoinSystem | 8 min |
| 8 | TeamManager | 5 min |
| 9 | RoundManager | 5 min |
| 10 | TikTok Bridge & Gift Mapper | 10 min |
| 11 | Game Loop orchestrator | 15 min |
| 12 | Wire server entry point | 5 min |
| 13 | Arena Renderer (background) | 5 min |
| 14 | PacMan Renderer | 15 min |
| 15 | HUD Renderer | 10 min |
| 16 | Coin Renderer | 8 min |
| 17 | Effect Renderer (gifts) | 12 min |
| 18 | Win Screen | 10 min |
| 19 | Sound Manager | 8 min |
| 20 | Integration test & polish | 15 min |
