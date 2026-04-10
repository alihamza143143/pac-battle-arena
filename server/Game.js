const Arena = require('./Arena');
const CombatSystem = require('./CombatSystem');
const GiftSystem = require('./GiftSystem');
const CoinSystem = require('./CoinSystem');
const RoundManager = require('./RoundManager');
const GrowthSystem = require('./GrowthSystem');
const PacMan = require('./PacMan');

const TICK_RATE = 33;

class Game {
  constructor() {
    this.arena = new Arena();
    this.coinSystem = new CoinSystem();
    this.roundManager = new RoundManager();
    this.eventQueue = [];
    this.visualEvents = [];
    this.frozenUntil = 0;
    this.running = false;
    this.intervalId = null;
  }

  start() {
    this.arena.spawnInitialAI();
    this.coinSystem.spawnAll();
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

    while (this.eventQueue.length > 0) {
      this.processEvent(this.eventQueue.shift());
    }

    if (this.roundManager.showingResults) {
      const done = this.roundManager.updateResults(dt);
      if (done) {
        this.reset();
        this.roundManager.nextRound();
      }
      return this._buildState();
    }

    this.roundManager.update(dt);
    if (this.roundManager.isRoundOver()) {
      this.roundManager.showResults();
      return this._buildRoundEndState();
    }

    const entities = this.arena.getAll();
    const isFrozen = now < this.frozenUntil;

    for (const pm of entities) {
      pm.updateGiftTimer(dt);

      if (isFrozen && !(pm.activeGift && pm.activeGift.type === 'moneygun')) {
        // frozen
      } else {
        pm.updateMovement(dt);
        pm.updateAI(dt);
      }

      pm.checkInactivity(now);
      GrowthSystem.updateEntity(pm);
    }

    if (!isFrozen) {
      CombatSystem.processAllCollisions(entities, now);
    }

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

    for (const pm of entities) {
      if (pm.isEliminated()) {
        if (pm.type === 'ai') {
          this.arena.removeEntity(pm.id);
        } else {
          pm.points = 500;
          pm.state = 'inactive';
          pm.activeGift = null;
          GrowthSystem.updateEntity(pm);
        }
      }
    }
    this.arena.respawnAI();

    this._updateKing();

    const state = this._buildState();
    this.visualEvents = [];
    return state;
  }

  // Auto-join: create player if not exists
  _ensurePlayer(event) {
    let pm = this.arena.getByUsername(event.username);
    if (!pm) {
      pm = new PacMan({
        type: 'player',
        username: event.username,
        avatarUrl: event.avatarUrl || null,
      });
      this.arena.addEntity(pm);
    }
    return pm;
  }

  processEvent(event) {
    switch (event.type) {
      case 'join': {
        this._ensurePlayer(event);
        break;
      }

      case 'chat': {
        this._ensurePlayer(event);
        break;
      }

      case 'like': {
        const pm = this._ensurePlayer(event);
        // Like = real-time movement. Active while liking, stops when likes stop.
        pm.activateByLike();
        break;
      }

      case 'gift': {
        const pm = this._ensurePlayer(event);
        const giftType = event.giftType;

        if (giftType === 'moneygun') {
          const result = GiftSystem.applyMoneyGun(pm, this.arena);
          this.frozenUntil = Date.now() + 4000;
          this.visualEvents.push({
            type: 'moneygun',
            userId: pm.id,
            frozen: result.frozen,
            totalStolen: result.totalStolen,
          });
        } else if (giftType === 'firetruck') {
          const result = GiftSystem.applyFireTruck(pm, this.arena);
          this.visualEvents.push({
            type: 'firetruck',
            userId: pm.id,
            totalStolen: result.totalStolen,
          });
        } else {
          // Apply gift — REFRESHES timer (not stack)
          GiftSystem.applyGift(pm, giftType);
          this.visualEvents.push({
            type: 'gift',
            giftType: giftType,
            userId: pm.id,
          });
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
    const playerCount = this.arena.getAll().filter(p => p.type === 'player').length;
    const top3 = this.arena.getTop3().map(p => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
    }));
    const king = this.arena.getKing();

    return {
      type: 'gameState',
      entities: this.arena.getAll().map(p => p.toJSON()),
      playerCount,
      top3,
      king: king ? { username: king.username, points: king.points, avatarUrl: king.avatarUrl } : null,
      round: this.roundManager.toJSON(),
      coins: this.coinSystem.toJSON(),
      events: this.visualEvents,
    };
  }

  _buildRoundEndState() {
    const top3 = this.arena.getTop3().map((p, i) => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
      trophy: ['gold', 'silver', 'bronze'][i],
    }));
    const king = this.arena.getKing();

    return {
      type: 'roundEnd',
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
