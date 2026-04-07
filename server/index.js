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
