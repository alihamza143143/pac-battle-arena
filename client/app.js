const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1080;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x000000,
  antialias: true,
});
document.body.appendChild(app.view);

const soundManager = new SoundManager();
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
