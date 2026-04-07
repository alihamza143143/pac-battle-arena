const PacMan = require('./PacMan');

const TARGET_AI_COUNT = 20;

class Arena {
  constructor() {
    this.entities = new Map();
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
    // Spread AI across a 5x4 grid so they cover the whole arena
    const cols = 5;
    const rows = 4;
    const cellW = (1080 - 120) / cols; // arena minus padding
    const cellH = (1080 - 120) / rows;
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const team = idx % 2 === 0 ? 'blue' : 'pink';
        const state = idx < 10 ? 'active' : 'inactive';
        const pm = new PacMan({ type: 'ai', team, state });
        // Place in grid cell with small random offset
        pm.x = 60 + col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.6;
        pm.y = 60 + row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.6;
        this.addEntity(pm);
        idx++;
      }
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
