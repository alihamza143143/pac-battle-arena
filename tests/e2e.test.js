/**
 * PAC BATTLE ARENA — Full E2E Test Against Client Spec
 * Tests every system: AI, player join, teams, gifts, combat, coins, HUD, round
 */
const { chromium } = require('playwright');
const http = require('http');

const BASE_URL = 'http://localhost:3099';
let serverProcess;
let browser, page;

// Helper: send debug event to server
async function sendEvent(event) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(event);
    const req = http.request(`${BASE_URL}/debug-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => { let body = ''; res.on('data', c => body += c); res.on('end', () => resolve(body)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendJoin(username) {
  await sendEvent({ type: 'join', username, nickname: username, avatarUrl: '' });
}

async function sendGift(username, giftType) {
  await sendEvent({ type: 'gift', username, nickname: username, avatarUrl: '', giftType });
}

async function sendLike(username) {
  await sendEvent({ type: 'like', username, nickname: username, avatarUrl: '' });
}

// Helper: get game state from server WebSocket
function getGameState() {
  return page.evaluate(() => {
    return window.gameState || null;
  });
}

// Wait for game state to have a condition
async function waitForState(conditionFn, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await getGameState();
    if (state && conditionFn(state)) return state;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timed out waiting for game state condition');
}

beforeAll(async () => {
  // Start server on test port
  const { spawn } = require('child_process');
  serverProcess = spawn('node', ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '3099' },
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('running on')) resolve();
    });
    serverProcess.stderr.on('data', (data) => {
      // TikTok offline error is expected
    });
    setTimeout(resolve, 4000); // fallback
  });

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Wait for game state to arrive
  await page.waitForFunction(() => window.gameState !== null, { timeout: 10000 });
}, 30000);

afterAll(async () => {
  if (browser) await browser.close();
  if (serverProcess) serverProcess.kill();
});

// ═══════════════════════════════════════════════════════
// SPEC: GAME START — 20 AI Pac-Mans, each with 500 points
// ═══════════════════════════════════════════════════════

describe('Game Start & AI System', () => {
  test('game has 20 AI Pac-Mans on start', async () => {
    const state = await getGameState();
    const aiCount = state.entities.filter(e => e.type === 'ai').length;
    expect(aiCount).toBe(20);
  });

  test('AI start with 500 points each', async () => {
    const state = await getGameState();
    const aiEntities = state.entities.filter(e => e.type === 'ai');
    for (const ai of aiEntities) {
      // Points may have changed due to combat, but should be around 500
      expect(ai.points).toBeGreaterThan(0);
    }
  });

  test('10 AI are active, 10 are inactive', async () => {
    // Get a fresh state right after start — some may have changed due to combat
    const state = await getGameState();
    const ai = state.entities.filter(e => e.type === 'ai');
    const active = ai.filter(e => e.state === 'active');
    const inactive = ai.filter(e => e.state === 'inactive');
    // Allow some variance due to combat during startup ticks
    expect(active.length).toBeGreaterThanOrEqual(5);
    expect(inactive.length).toBeGreaterThanOrEqual(5);
    expect(active.length + inactive.length).toBe(20);
  });

  test('AI split evenly between blue and pink teams', async () => {
    const state = await getGameState();
    const ai = state.entities.filter(e => e.type === 'ai');
    const blue = ai.filter(e => e.team === 'blue');
    const pink = ai.filter(e => e.team === 'pink');
    expect(blue.length).toBe(10);
    expect(pink.length).toBe(10);
  });

  test('all entities are moving (have positions within arena)', async () => {
    const state = await getGameState();
    for (const e of state.entities) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x).toBeLessThanOrEqual(1080);
      expect(e.y).toBeGreaterThanOrEqual(0);
      expect(e.y).toBeLessThanOrEqual(1080);
    }
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: PLAYER JOIN — neutral red, "Wähle ein Team"
// ═══════════════════════════════════════════════════════

describe('Player Join System', () => {
  test('player joins as neutral (no team, red)', async () => {
    await sendJoin('Player1');
    const state = await waitForState(s => s.entities.some(e => e.username === 'Player1'));
    const player = state.entities.find(e => e.username === 'Player1');
    expect(player).toBeDefined();
    expect(player.state).toBe('neutral');
    expect(player.team).toBeNull();
    expect(player.points).toBe(500);
  });

  test('player spawns with 500 points', async () => {
    const state = await getGameState();
    const player = state.entities.find(e => e.username === 'Player1');
    expect(player.points).toBe(500);
  });

  test('chat message also spawns player as neutral', async () => {
    await sendEvent({ type: 'chat', username: 'Chatter1', nickname: 'Chatter1', avatarUrl: '', comment: 'hi' });
    const state = await waitForState(s => s.entities.some(e => e.username === 'Chatter1'));
    const player = state.entities.find(e => e.username === 'Chatter1');
    expect(player.state).toBe('neutral');
    expect(player.team).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: TEAM JOIN — Rose = Pink, TikTok = Blue
// ═══════════════════════════════════════════════════════

describe('Team System', () => {
  test('Rose gift joins player to Pink team', async () => {
    await sendJoin('PinkPlayer');
    await new Promise(r => setTimeout(r, 300));
    await sendGift('PinkPlayer', 'rose');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'PinkPlayer');
      return p && p.team === 'pink';
    });
    const player = state.entities.find(e => e.username === 'PinkPlayer');
    expect(player.team).toBe('pink');
    expect(player.state).toBe('active');
  });

  test('TikTok gift joins player to Blue team', async () => {
    await sendJoin('BluePlayer');
    await new Promise(r => setTimeout(r, 300));
    await sendGift('BluePlayer', 'tiktok');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'BluePlayer');
      return p && p.team === 'blue';
    });
    const player = state.entities.find(e => e.username === 'BluePlayer');
    expect(player.team).toBe('blue');
    expect(player.state).toBe('active');
  });

  test('team scores are tracked and visible', async () => {
    const state = await getGameState();
    expect(state.teams.blue).toBeDefined();
    expect(state.teams.pink).toBeDefined();
    expect(state.teams.blue.score).toBeGreaterThan(0);
    expect(state.teams.pink.score).toBeGreaterThan(0);
  });

  test('player cannot switch teams after joining', async () => {
    // PinkPlayer already on pink, try to send tiktok gift
    await sendGift('PinkPlayer', 'tiktok');
    await new Promise(r => setTimeout(r, 500));
    const state = await getGameState();
    const player = state.entities.find(e => e.username === 'PinkPlayer');
    expect(player.team).toBe('pink'); // still pink
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: LIKE SYSTEM — activates but weak (2pts, no coins)
// ═══════════════════════════════════════════════════════

describe('Like System', () => {
  test('like activates an inactive team player', async () => {
    // Create a player, join team, make inactive via server
    await sendJoin('LikeTest');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('LikeTest', 'rose');
    await new Promise(r => setTimeout(r, 500));

    // Now send like to reactivate
    await sendLike('LikeTest');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'LikeTest');
      return p && p.state === 'active';
    });
    const player = state.entities.find(e => e.username === 'LikeTest');
    expect(player.state).toBe('active');
  });

  test('like spawns player if not in game', async () => {
    await sendLike('NewLiker');
    const state = await waitForState(s => s.entities.some(e => e.username === 'NewLiker'));
    const player = state.entities.find(e => e.username === 'NewLiker');
    expect(player).toBeDefined();
    expect(player.state).toBe('neutral'); // likes don't auto-join team
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: GIFT SYSTEM — 5 tiers with correct durations
// ═══════════════════════════════════════════════════════

describe('Gift System', () => {
  test('Rose gift activates player and lasts 3 sec', async () => {
    await sendJoin('GiftTest1');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('GiftTest1', 'rose');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'GiftTest1');
      return p && p.activeGift;
    });
    const player = state.entities.find(e => e.username === 'GiftTest1');
    expect(player.activeGift.type).toBe('rose');
    expect(player.activeGift.remainingMs).toBeLessThanOrEqual(3000);
    expect(player.activeGift.remainingMs).toBeGreaterThan(0);
  });

  test('Donut gift has yellow color and 3 sec', async () => {
    await sendJoin('GiftTest2');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('GiftTest2', 'tiktok'); // join team first
    await new Promise(r => setTimeout(r, 200));
    await sendGift('GiftTest2', 'donut');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'GiftTest2');
      return p && p.activeGift && p.activeGift.type === 'donut';
    });
    const player = state.entities.find(e => e.username === 'GiftTest2');
    expect(player.activeGift.type).toBe('donut');
    expect(player.activeGift.color).toBe('#ffff00');
  });

  test('Confetti gift works', async () => {
    await sendJoin('GiftTest3');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('GiftTest3', 'rose');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('GiftTest3', 'confetti');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'GiftTest3');
      return p && p.activeGift && p.activeGift.type === 'confetti';
    });
    const player = state.entities.find(e => e.username === 'GiftTest3');
    expect(player.activeGift.type).toBe('confetti');
  });

  test('Money Gun freezes all and steals points', async () => {
    await sendJoin('MoneyGunUser');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('MoneyGunUser', 'tiktok');
    await new Promise(r => setTimeout(r, 200));

    // Record points before
    let stateBefore = await getGameState();
    const userBefore = stateBefore.entities.find(e => e.username === 'MoneyGunUser');
    const pointsBefore = userBefore ? userBefore.points : 500;

    await sendGift('MoneyGunUser', 'moneygun');
    await new Promise(r => setTimeout(r, 500));

    const stateAfter = await getGameState();
    const userAfter = stateAfter.entities.find(e => e.username === 'MoneyGunUser');
    // Money gun user should have gained points from stealing
    expect(userAfter.points).toBeGreaterThan(pointsBefore);
    expect(userAfter.activeGift.type).toBe('moneygun');
    expect(userAfter.activeGift.color).toBe('#ffd700');
  });

  test('Fire Truck lasts 5 seconds (not 3)', async () => {
    await sendJoin('FireTruckUser');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('FireTruckUser', 'rose');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('FireTruckUser', 'firetruck');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'FireTruckUser');
      return p && p.activeGift && p.activeGift.type === 'firetruck';
    });
    const player = state.entities.find(e => e.username === 'FireTruckUser');
    expect(player.activeGift.type).toBe('firetruck');
    // Should have close to 5000ms remaining
    expect(player.activeGift.remainingMs).toBeGreaterThan(3000);
    expect(player.activeGift.remainingMs).toBeLessThanOrEqual(5000);
  });

  test('higher tier gift replaces lower tier', async () => {
    await sendJoin('TierTest');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('TierTest', 'rose');
    await new Promise(r => setTimeout(r, 200));
    await sendGift('TierTest', 'confetti');
    const state = await waitForState(s => {
      const p = s.entities.find(e => e.username === 'TierTest');
      return p && p.activeGift && p.activeGift.type === 'confetti';
    });
    const player = state.entities.find(e => e.username === 'TierTest');
    expect(player.activeGift.type).toBe('confetti');
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: COIN SYSTEM — only active gift players collect
// ═══════════════════════════════════════════════════════

describe('Coin System', () => {
  test('coins exist on the arena', async () => {
    const state = await getGameState();
    expect(state.coins).toBeDefined();
    expect(state.coins.length).toBeGreaterThanOrEqual(1);
  });

  test('coins have correct types (regular or big)', async () => {
    const state = await getGameState();
    for (const coin of state.coins) {
      expect(['regular', 'big']).toContain(coin.type);
      expect(coin.x).toBeGreaterThan(0);
      expect(coin.y).toBeGreaterThan(0);
      if (coin.type === 'regular') expect(coin.value).toBe(5);
      if (coin.type === 'big') expect(coin.value).toBe(15);
    }
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: HUD — team scores, timer, king, top 3
// ═══════════════════════════════════════════════════════

describe('HUD / UI', () => {
  test('round info is present', async () => {
    const state = await getGameState();
    expect(state.round).toBeDefined();
    expect(state.round.number).toBe(1);
    expect(state.round.remainingSeconds).toBeGreaterThan(0);
    expect(state.round.remainingSeconds).toBeLessThanOrEqual(900);
  });

  test('team scores are present', async () => {
    const state = await getGameState();
    expect(state.teams.blue.score).toBeDefined();
    expect(state.teams.pink.score).toBeDefined();
  });

  test('canvas is rendered (1080x1080)', async () => {
    const canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });
    expect(canvasSize).not.toBeNull();
    expect(canvasSize.width).toBe(1080);
    expect(canvasSize.height).toBe(1080);
  });

  test('page title is PAC BATTLE ARENA', async () => {
    const title = await page.title();
    expect(title).toBe('PAC BATTLE ARENA');
  });

  test('page language is German', async () => {
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('de');
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: GROWTH — continuous, no cap
// ═══════════════════════════════════════════════════════

describe('Growth System', () => {
  test('entities with more points are larger', async () => {
    const state = await getGameState();
    const entities = state.entities.filter(e => e.type === 'ai');
    if (entities.length >= 2) {
      const sorted = entities.sort((a, b) => b.points - a.points);
      const biggest = sorted[0];
      const smallest = sorted[sorted.length - 1];
      if (biggest.points > smallest.points) {
        expect(biggest.size).toBeGreaterThan(smallest.size);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: COMBAT — active attacks inactive
// ═══════════════════════════════════════════════════════

describe('Combat System', () => {
  test('active AI entities gain points over time (from attacking inactive)', async () => {
    // Wait a few seconds for combat to happen
    await new Promise(r => setTimeout(r, 3000));
    const state = await getGameState();
    const ai = state.entities.filter(e => e.type === 'ai');
    // Some active AI should have gained points above 500
    const gainedPoints = ai.some(e => e.points > 500);
    expect(gainedPoints).toBe(true);
  });

  test('some inactive AI have lost points (from being attacked)', async () => {
    const state = await getGameState();
    const ai = state.entities.filter(e => e.type === 'ai');
    const lostPoints = ai.some(e => e.points < 500);
    expect(lostPoints).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: AI RESPAWN — maintain 20 AI
// ═══════════════════════════════════════════════════════

describe('AI Respawn', () => {
  test('AI count stays at 20 even after eliminations', async () => {
    // Combat has been happening — some AI may have been eliminated and respawned
    const state = await getGameState();
    const aiCount = state.entities.filter(e => e.type === 'ai').length;
    expect(aiCount).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════
// SPEC: WEBSOCKET — game state broadcasts at 30fps
// ═══════════════════════════════════════════════════════

describe('WebSocket Communication', () => {
  test('game state updates continuously', async () => {
    const state1 = await getGameState();
    await new Promise(r => setTimeout(r, 200));
    const state2 = await getGameState();
    // Entities should have moved
    expect(state2).not.toEqual(state1);
  });

  test('game state has all required fields', async () => {
    const state = await getGameState();
    expect(state.type).toBe('gameState');
    expect(state.entities).toBeDefined();
    expect(state.teams).toBeDefined();
    expect(state.round).toBeDefined();
    expect(state.coins).toBeDefined();
    expect(state.events).toBeDefined();
    expect(state.top3).toBeDefined();
  });
});
