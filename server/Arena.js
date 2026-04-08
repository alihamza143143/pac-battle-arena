const PacMan = require('./PacMan');

const BOTS_PER_TEAM = 15;
const ACTIVE_PER_TEAM = 6;
const AVATAR_COUNT = 15; // 15 images per gender folder

class Arena {
  constructor() {
    this.entities = new Map();
  }

  _getBotAvatar(team, index) {
    // pink = women (folder 5), blue = men (folder 4)
    const folder = team === 'pink' ? 'women' : 'men';
    const num = (index % AVATAR_COUNT) + 1;
    return `assets/avatars/${folder}/${num}.jpg`;
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

  getAIByTeam(team) {
    return this.getAll().filter(p => p.type === 'ai' && p.team === team);
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
    for (const team of ['pink', 'blue']) {
      for (let i = 0; i < BOTS_PER_TEAM; i++) {
        const state = i < ACTIVE_PER_TEAM ? 'active' : 'inactive';
        const pm = new PacMan({
          type: 'ai',
          team,
          state,
          avatarUrl: this._getBotAvatar(team, i),
        });
        pm.x = 60 + Math.random() * (1080 - 120);
        pm.y = 60 + Math.random() * (1080 - 120);
        this.addEntity(pm);
      }
    }
  }

  respawnAI() {
    for (const team of ['pink', 'blue']) {
      const teamAI = this.getAIByTeam(team);
      const needed = BOTS_PER_TEAM - teamAI.length;
      if (needed <= 0) continue;

      const activeCount = teamAI.filter(p => p.state === 'active').length;
      for (let i = 0; i < needed; i++) {
        const state = (activeCount + i) < ACTIVE_PER_TEAM ? 'active' : 'inactive';
        const avatarIndex = Math.floor(Math.random() * AVATAR_COUNT);
        this.addEntity(new PacMan({
          type: 'ai',
          team,
          state,
          avatarUrl: this._getBotAvatar(team, avatarIndex),
        }));
      }
    }
  }

  clear() {
    this.entities.clear();
  }
}

module.exports = Arena;
