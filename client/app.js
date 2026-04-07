const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
  resolution: 1,
});
document.body.appendChild(app.view);

// Scale canvas to fit viewport
function resizeCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / GAME_WIDTH, vh / GAME_HEIGHT);
  app.view.style.width = (GAME_WIDTH * scale) + 'px';
  app.view.style.height = (GAME_HEIGHT * scale) + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const soundManager = new SoundManager();
window.gameState = null;
let gameState = null;
let roundEndState = null;
let arenaRenderer = null;
let coinRenderer = null;
let pacmanRenderer = null;
let effectRenderer = null;
let hudRenderer = null;
let winScreen = null;
let showingWinScreen = false;

// ── Debug Panel (press D to toggle) ──
function createDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position:fixed;bottom:10px;right:10px;width:260px;
    background:rgba(10,10,30,0.95);border:2px solid #4488ff;border-radius:10px;
    padding:10px;font-family:Arial;font-size:11px;color:#fff;z-index:9999;display:none;
    backdrop-filter:blur(5px);
  `;
  const btnStyle = 'padding:3px 7px;border:none;border-radius:3px;cursor:pointer;font-size:10px;';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="color:#ffd700;font-weight:bold;font-size:12px;">🎮 Debug</span>
      <span style="color:#666;font-size:9px;">D = close</span>
    </div>
    <input id="dbg-name" value="TestPlayer" placeholder="Username"
      style="width:100%;background:#0f3460;color:#fff;border:1px solid #444;padding:4px 6px;border-radius:3px;margin-bottom:6px;font-size:11px;">
    <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:5px;">
      <button onclick="dbgSend('join')" style="${btnStyle}background:#555;color:#fff;">Join</button>
      <button onclick="dbgSend('like')" style="${btnStyle}background:#00cc66;color:#fff;">❤️ Like</button>
      <button onclick="dbgGift('rose')" style="${btnStyle}background:#ff69b4;color:#fff;">🌹 Pink</button>
      <button onclick="dbgGift('tiktok')" style="${btnStyle}background:#4488ff;color:#fff;">🎵 Blue</button>
    </div>
    <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:5px;">
      <button onclick="dbgGift('rose')" style="${btnStyle}background:#ff69b4;color:#fff;">🌹</button>
      <button onclick="dbgGift('donut')" style="${btnStyle}background:#ffdd00;color:#000;">🍩</button>
      <button onclick="dbgGift('confetti')" style="${btnStyle}background:#9b59b6;color:#fff;">🎊</button>
      <button onclick="dbgGift('moneygun')" style="${btnStyle}background:#ffd700;color:#000;">💰</button>
      <button onclick="dbgGift('firetruck')" style="${btnStyle}background:#ff4400;color:#fff;">🚒</button>
      <button onclick="dbgChaos()" style="${btnStyle}background:#ff4400;color:#fff;">🔥 Chaos</button>
      <button onclick="dbgSpawnAll()" style="${btnStyle}background:#00cc66;color:#fff;">+6</button>
    </div>
    <div id="dbg-log" style="background:#0a0a1e;padding:4px;border-radius:3px;height:50px;overflow-y:auto;font-family:monospace;font-size:9px;color:#0f0;"></div>
  `;
  document.body.appendChild(panel);
  return panel;
}

const debugPanel = createDebugPanel();

window.dbgLog = function(msg) {
  const log = document.getElementById('dbg-log');
  if (!log) return;
  log.innerHTML += `<div>${msg}</div>`;
  log.scrollTop = log.scrollHeight;
};

window.dbgSend = function(type) {
  const name = document.getElementById('dbg-name').value || 'TestPlayer';
  const evt = { type, username: name, nickname: name, avatarUrl: '' };
  if (type === 'chat') evt.comment = 'Hello!';
  fetch('/debug-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evt) });
  dbgLog(`${type}: ${name}`);
};

window.dbgGift = function(giftType) {
  const name = document.getElementById('dbg-name').value || 'TestPlayer';
  // Auto-join first if needed
  fetch('/debug-event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'join', username: name, nickname: name, avatarUrl: '' }) });
  setTimeout(() => {
    fetch('/debug-event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'gift', username: name, nickname: name, avatarUrl: '', giftType }) });
    dbgLog(`gift: ${giftType} (${name})`);
  }, 100);
};

window.dbgSpawnAll = function() {
  const players = [['Sara','rose'],['Omar','tiktok'],['Mina','rose'],['Zain','tiktok'],['Hana','rose'],['Ali','tiktok']];
  players.forEach(([name, team], i) => {
    setTimeout(() => {
      fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({type:'join',username:name,nickname:name,avatarUrl:''})});
      setTimeout(() => {
        fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({type:'gift',username:name,nickname:name,avatarUrl:'',giftType:team})});
      }, 150);
    }, i * 300);
  });
  dbgLog('Spawned 6 players');
};

window.dbgSpamLikes = function() {
  const name = document.getElementById('dbg-name').value || 'TestPlayer';
  for (let i = 0; i < 10; i++) {
    setTimeout(() => fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'like',username:name,nickname:name,avatarUrl:''})}), i * 100);
  }
  dbgLog('Spammed 10 likes');
};

window.dbgChaos = function() {
  dbgSpawnAll();
  setTimeout(() => {
    fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'gift',username:'Sara',giftType:'confetti'})});
    fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'gift',username:'Omar',giftType:'donut'})});
    fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'gift',username:'Zain',giftType:'moneygun'})});
  }, 2500);
  setTimeout(() => {
    fetch('/debug-event', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'gift',username:'Hana',giftType:'firetruck'})});
  }, 6000);
  dbgLog('🔥 CHAOS MODE!');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
  }
});

// ── Main Init ──
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
      window.gameState = data;
      if (showingWinScreen && !data.round.showingResults) {
        winScreen.hide();
        showingWinScreen = false;
      }
      if (data.events) {
        for (const evt of data.events) {
          if (evt.type === 'coinCollect') soundManager.coinCollect();
          if (evt.type === 'moneygun') { soundManager.giftMoneyGun(); soundManager.freeze(); }
          if (evt.type === 'firetruck') soundManager.giftFireTruck();
        }
      }
    } else if (data.type === 'roundEnd') {
      roundEndState = data;
      if (!showingWinScreen) {
        winScreen.show(data);
        showingWinScreen = true;
        soundManager.roundEnd();
      }
    }
  };

  ws.onopen = () => console.log('Connected to server');
  ws.onclose = () => {
    console.log('Disconnected. Reconnecting in 2s...');
    setTimeout(() => window.location.reload(), 2000);
  };

  app.ticker.add(() => {
    if (showingWinScreen) { winScreen.update(); return; }
    if (!gameState) return;
    arenaRenderer.update(gameState);
    coinRenderer.update(gameState);
    pacmanRenderer.update(gameState);
    effectRenderer.update(gameState);
    hudRenderer.update(gameState);
  });
}

init();
