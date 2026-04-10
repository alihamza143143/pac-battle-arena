const PacMan = require('./PacMan');

const BOT_COUNT = 5;
const AVATAR_COUNT = 15;

class Arena {
  constructor() {
    this.entities = new Map();
  }

  _getBotAvatar(index) {
    // Mix men and women avatars for bots
    const folder = index % 2 === 0 ? 'women' : 'men';
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

  getAI() {
    return this.getAll().filter(p => p.type === 'ai');
  }

  getTop3() {
    return this.getAll()
      .filter(p => p.type === 'player')
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }

  getKing() {
    const players = this.getAll().filter(p => p.type === 'player');
    if (players.length === 0) return null;
    return players.reduce((king, p) => p.points > king.points ? p : king, players[0]);
  }

  spawnInitialAI() {
    for (let i = 0; i < BOT_COUNT; i++) {
      const pm = new PacMan({
        type: 'ai',
        state: 'inactive',
        avatarUrl: this._getBotAvatar(i),
      });
      pm.x = 60 + Math.random() * (1080 - 120);
      pm.y = 60 + Math.random() * (1080 - 120);
      this.addEntity(pm);
    }
  }

  respawnAI() {
    const bots = this.getAI();
    const needed = BOT_COUNT - bots.length;
    for (let i = 0; i < needed; i++) {
      const avatarIndex = Math.floor(Math.random() * AVATAR_COUNT);
      this.addEntity(new PacMan({
        type: 'ai',
        state: 'inactive',
        avatarUrl: this._getBotAvatar(avatarIndex),
      }));
    }
  }

  clear() {
    this.entities.clear();
  }
}

module.exports = Arena;
