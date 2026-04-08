const crypto = require('crypto');

const ARENA_SIZE = 1080;
const ARENA_PADDING = 60;
const BASE_SIZE = 25;
const SIZE_PER_POINT = 1 / 25;
const BASE_SPEED = 0.5;
const SPEED_FACTOR = 0.02;
const BASE_MOUTH_SPEED = 0.05;
const MOUTH_SPEED_FACTOR = 0.001;
const INACTIVE_TIMEOUT = 15000;

class PacMan {
  constructor({ type, team = null, state = null, username = null, avatarUrl = null }) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.team = type === 'player' ? null : team;
    this.username = username || `Player-${this.id.slice(0, 4)}`;
    this.avatarUrl = avatarUrl || null;

    if (state) {
      this.state = state;
    } else if (type === 'player') {
      this.state = 'neutral';
    } else {
      this.state = 'inactive';
    }

    this.x = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.y = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.angle = Math.random() * Math.PI * 2;

    this.points = 500;
    this.size = this._calcSize();
    this.speed = this._calcSpeed();

    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.mouthSpeed = this._calcMouthSpeed();

    this.activeGift = null;
    this.activatedByGift = false; // true if player used Rose or higher gift (not just likes)
    this.lastLikeTime = 0; // timestamp of last like
    this.isKing = false;
    this.lastActivityTime = Date.now();
    this.hitCooldowns = {};
    this.dirChangeTimer = 800 + Math.random() * 1500;
  }

  _calcSize() {
    return BASE_SIZE + this.points * SIZE_PER_POINT;
  }

  _calcSpeed() {
    const size = this._calcSize();
    return BASE_SPEED + size * SPEED_FACTOR;
  }

  _calcMouthSpeed() {
    if (this.state === 'inactive' || this.state === 'neutral') return 0;
    const size = this._calcSize();
    return BASE_MOUTH_SPEED + size * MOUTH_SPEED_FACTOR;
  }

  joinTeam(team) {
    this.team = team;
    this.state = 'active';
    this.lastActivityTime = Date.now();
    this.activatedByGift = true;
  }

  activate() {
    if (this.team) {
      this.state = 'active';
      this.lastActivityTime = Date.now();
    }
  }

  activateByLike() {
    if (this.team) {
      this.lastLikeTime = Date.now();
      // Likes only give mouth animation, not full activation
      // State stays whatever it is — likes don't make you 'active'
    }
  }

  addPoints(amount) {
    this.points += amount;
    this.size = this._calcSize();
    this.speed = this._calcSpeed();
    this.mouthSpeed = this._calcMouthSpeed();
  }

  takeDamage(amount) {
    this.points = Math.max(0, this.points - amount);
    this.size = this._calcSize();
    this.speed = this._calcSpeed();
    this.mouthSpeed = this._calcMouthSpeed();
  }

  isEliminated() {
    return this.points <= 0;
  }

  canAttack() {
    return this.state === 'active';
  }

  canBeAttacked() {
    return this.state === 'inactive' || this.state === 'neutral';
  }

  canCollectCoins() {
    // Only active players who have been activated by a gift (Rose or higher) can collect coins
    // Like-only players cannot collect coins
    return this.state === 'active' && this.activatedByGift;
  }

  checkInactivity(now) {
    if (this.type === 'ai') return;
    if (this.state === 'active' && this.team) {
      if (now - this.lastActivityTime > INACTIVE_TIMEOUT) {
        this.state = 'inactive';
        this.mouthSpeed = this._calcMouthSpeed();
      }
    }
  }

  applyGift(giftType, color, durationMs) {
    const tiers = { rose: 1, donut: 2, confetti: 3, moneygun: 4, firetruck: 5 };
    if (this.activeGift && tiers[this.activeGift.type] >= tiers[giftType]) {
      return false;
    }
    this.activeGift = { type: giftType, remainingMs: durationMs, color };
    this.lastActivityTime = Date.now();
    this.state = 'active';
    this.activatedByGift = true;
    return true;
  }

  updateGiftTimer(dt) {
    if (!this.activeGift) return;
    this.activeGift.remainingMs -= dt;
    if (this.activeGift.remainingMs <= 0) {
      this.activeGift = null;
      // CRITICAL: player becomes inactive immediately when gift ends
      if (this.type === 'player') {
        this.state = 'inactive';
        this.mouthAngle = 0;
        this.mouthSpeed = 0;
      }
    }
  }

  getSpeedMultiplier() {
    if (!this.activeGift) return 1;
    const multipliers = {
      rose: 1.1,
      donut: 1.5,
      confetti: 1.8,
      moneygun: 1.5,
      firetruck: 2.5,
    };
    if (this.activeGift.type === 'rose' && this.activeGift.remainingMs < 2000) {
      return 1;
    }
    return multipliers[this.activeGift.type] || 1;
  }

  getSizeMultiplier() {
    if (!this.activeGift) return 1;
    if (this.activeGift.type === 'firetruck') return 1.4;
    return 1;
  }

  getMouthSpeedMultiplier() {
    if (!this.activeGift) return 1;
    const multipliers = {
      rose: 1.2,
      donut: 1.8,
      confetti: 2.2,
      moneygun: 1.5,
      firetruck: 3.0,
    };
    return multipliers[this.activeGift.type] || 1;
  }

  getDamagePerHit() {
    // Like-only players deal only 2 damage
    if (!this.activeGift && !this.activatedByGift) return 2;
    if (!this.activeGift) return 5;
    const damage = {
      rose: 5,
      donut: 10,
      confetti: 20,
      moneygun: 0,
      firetruck: 100,
    };
    return damage[this.activeGift.type] || 5;
  }

  canHitTarget(target) {
    if (!this.canAttack()) return false;
    // Same team protection — teammates can't damage each other
    // Exception: Fire Truck hits everyone
    if (this.team && target.team && this.team === target.team) {
      if (!this.activeGift || this.activeGift.type !== 'firetruck') {
        return false;
      }
    }
    if (!this.activeGift || this.activeGift.type === 'rose' || this.activeGift.type === 'confetti') {
      return target.canBeAttacked();
    }
    if (this.activeGift.type === 'donut') {
      return !target.activeGift;
    }
    if (this.activeGift.type === 'firetruck') {
      return target.id !== this.id;
    }
    return target.canBeAttacked();
  }

  isOnCooldown(targetId, now) {
    const last = this.hitCooldowns[targetId];
    if (!last) return false;
    return (now - last) < 500;
  }

  recordHit(targetId, now) {
    this.hitCooldowns[targetId] = now;
  }

  updateMovement(dt) {
    const speedMult = this.getSpeedMultiplier();
    const actualSpeed = this.speed * speedMult;

    let moveFactor = 1;
    if (this.state === 'inactive') moveFactor = 0.3;
    if (this.state === 'neutral') moveFactor = 0.2;

    this.x += Math.cos(this.angle) * actualSpeed * moveFactor * (dt / 16);
    this.y += Math.sin(this.angle) * actualSpeed * moveFactor * (dt / 16);

    const effectiveSize = this.size * this.getSizeMultiplier();
    const halfSize = effectiveSize / 2;
    if (this.x < halfSize) { this.x = halfSize; this.angle = Math.PI - this.angle; }
    if (this.x > ARENA_SIZE - halfSize) { this.x = ARENA_SIZE - halfSize; this.angle = Math.PI - this.angle; }
    if (this.y < halfSize) { this.y = halfSize; this.angle = -this.angle; }
    if (this.y > ARENA_SIZE - halfSize) { this.y = ARENA_SIZE - halfSize; this.angle = -this.angle; }

    const isLiking = this.lastLikeTime && (Date.now() - this.lastLikeTime < 2000);
    if (this.state === 'active' || isLiking) {
      const mouthMult = this.getMouthSpeedMultiplier();
      if (this.mouthOpening) {
        this.mouthAngle += this.mouthSpeed * mouthMult * (dt / 16);
        if (this.mouthAngle >= 45) this.mouthOpening = false;
      } else {
        this.mouthAngle -= this.mouthSpeed * mouthMult * (dt / 16);
        if (this.mouthAngle <= 0) this.mouthOpening = true;
      }
    } else {
      this.mouthAngle = 0;
    }
  }

  updateAI(dt) {
    if (this.type !== 'ai') return;
    this.dirChangeTimer -= dt;
    if (this.dirChangeTimer <= 0) {
      this.angle = Math.random() * Math.PI * 2;
      this.dirChangeTimer = 800 + Math.random() * 1500;
    }
  }

  applyKnockback(fromX, fromY) {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / dist) * 15;
    this.y += (dy / dist) * 15;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      team: this.team,
      username: this.username,
      avatarUrl: this.avatarUrl,
      x: this.x,
      y: this.y,
      angle: this.angle,
      points: this.points,
      size: this.size * this.getSizeMultiplier(),
      speed: this.speed * this.getSpeedMultiplier(),
      mouthAngle: this.mouthAngle,
      mouthSpeed: this.mouthSpeed * this.getMouthSpeedMultiplier(),
      activeGift: this.activeGift ? { type: this.activeGift.type, color: this.activeGift.color, remainingMs: this.activeGift.remainingMs } : null,
      isKing: this.isKing,
      activatedByGift: this.activatedByGift,
      lastLikeTime: this.lastLikeTime,
    };
  }
}

module.exports = PacMan;
