const Arena = require('./Arena');
const CombatSystem = require('./CombatSystem');
const GiftSystem = require('./GiftSystem');
const CoinSystem = require('./CoinSystem');
const TeamManager = require('./TeamManager');
const RoundManager = require('./RoundManager');
const GrowthSystem = require('./GrowthSystem');
const PacMan = require('./PacMan');
const GiftMapper = require('./tiktok/GiftMapper');

const TICK_RATE = 33;

class Game {
  constructor() {
    this.arena = new Arena();
    this.coinSystem = new CoinSystem();
    this.teamManager = new TeamManager(this.arena);
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
          pm.state = 'neutral';
          pm.team = null;
          pm.activeGift = null;
          pm.activatedByGift = false;
          GrowthSystem.updateEntity(pm);
        }
      }
    }
    this.arena.respawnAI();

    this._updateKing();

    const state = this._buildState();
    // Clear events after building state — each event is only sent once
    this.visualEvents = [];
    return state;
  }

  processEvent(event) {
    switch (event.type) {
      case 'join':
      case 'chat': {
        if (!this.arena.getByUsername(event.username)) {
          const pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }
        break;
      }

      case 'like': {
        let pm = this.arena.getByUsername(event.username);
        if (!pm) {
          pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }
        if (pm.team) {
          pm.activateByLike();
        }
        break;
      }

      case 'gift': {
        let pm = this.arena.getByUsername(event.username);
        if (!pm) {
          pm = new PacMan({
            type: 'player',
            username: event.username,
            avatarUrl: event.avatarUrl || null,
          });
          this.arena.addEntity(pm);
        }

        const giftType = event.giftType;

        if (!pm.team && GiftMapper.isTeamJoinGift(giftType)) {
          this.teamManager.joinTeam(pm, giftType);
        }

        if (pm.team) {
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
          } else if (giftType !== 'tiktok') {
            const applied = GiftSystem.applyGift(pm, giftType);
            if (applied) {
              this.visualEvents.push({
                type: 'gift',
                giftType: giftType,
                userId: pm.id,
              });
            }
          }
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
    const scores = this.teamManager.getTeamScores();
    const counts = this.teamManager.getTeamPlayerCounts();
    const top3 = this.arena.getTop3().map(p => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
    }));
    const king = this.arena.getKing();

    return {
      type: 'gameState',
      entities: this.arena.getAll().map(p => p.toJSON()),
      teams: {
        blue: { score: scores.blue, playerCount: counts.blue },
        pink: { score: scores.pink, playerCount: counts.pink },
      },
      top3,
      king: king ? { username: king.username, points: king.points, avatarUrl: king.avatarUrl } : null,
      round: this.roundManager.toJSON(),
      coins: this.coinSystem.toJSON(),
      events: this.visualEvents,
    };
  }

  _buildRoundEndState() {
    const scores = this.teamManager.getTeamScores();
    const top3 = this.arena.getTop3().map((p, i) => ({
      username: p.username,
      points: p.points,
      avatarUrl: p.avatarUrl,
      trophy: ['gold', 'silver', 'bronze'][i],
    }));
    const king = this.arena.getKing();

    return {
      type: 'roundEnd',
      winningTeam: scores.blue > scores.pink ? 'blue' : 'pink',
      teamScores: scores,
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
