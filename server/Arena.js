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
