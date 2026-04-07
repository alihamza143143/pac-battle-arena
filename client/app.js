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
