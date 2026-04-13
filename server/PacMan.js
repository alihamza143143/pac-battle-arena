const crypto = require('crypto');

const ARENA_SIZE = 1080;
const ARENA_PADDING = 60;

class PacMan {
  constructor({ type, state = null, username = null, avatarUrl = null }) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.username = username || 'Player';
    this.avatarUrl = avatarUrl || null;

    if (state) {
      this.state = state;
    } else if (type === 'player') {
      this.state = 'inactive'; // starts inactive, activates on like/gift
    } else {
      this.state = 'inactive';
    }

    this.x = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.y = ARENA_PADDING + Math.random() * (ARENA_SIZE - ARENA_PADDING * 2);
    this.angle = Math.random() * Math.PI * 2;

    this.points = 500;
    this.size = 45;
    this.speed = 1.5;

    this.mouthAngle = 0;
    this.mouthOpening = true;
    this.mouthSpeed = 0;

    this.activeGift = null;
    this.isKing = false;
    this.lastActivityTime = Date.now();
    // Like system: player is active ONLY while likes are coming in real-time
    this.likeActiveUntil = 0;
    this.hitCooldowns = {};
    this.dirChangeTimer = 800 + Math.random() * 1500;
  }

  activate() {
    this.state = 'active';
    this.lastActivityTime = Date.now();
  }

  // Like = continuous movement. Each like refreshes the window.
  // If likes stop coming, player stops after 1 second.
  activateByLike() {
    this.lastActivityTime = Date.now();
    this.state = 'active';
    // Each like refreshes the active window to 1s from now
    // This creates continuous movement as long as likes keep coming
    this.likeActiveUntil = Date.now() + 1000;
  }

  addPoints(amount) {
    this.points += amount;
  }

  takeDamage(amount) {
    this.points = Math.max(0, this.points - amount);
  }

  isEliminated() {
    return this.points <= 0;
  }

  canAttack() {
    return this.state === 'active';
  }

  canBeAttacked() {
    return this.state === 'inactive';
  }

  canCollectCoins() {
    return this.state === 'active';
  }

  checkInactivity(now) {
    if (this.type === 'ai') return;

    // Like-only activation: expires when likes stop
    if (this.state === 'active' && !this.activeGift && this.likeActiveUntil > 0) {
      if (now > this.likeActiveUntil) {
        this.state = 'inactive';
        this.mouthAngle = 0;
        this.mouthSpeed = 0;
        this.likeActiveUntil = 0;
      }
    }
  }

  // Gift: REFRESH timer (not stack). Same gift resets to full duration.
  applyGift(giftType, color, durationMs) {
    const tiers = { rose: 1, donut: 2, confetti: 3, moneygun: 4, firetruck: 5 };
    if (this.activeGift) {
      // Same gift: REFRESH timer (reset to full duration, not add)
      if (this.activeGift.type === giftType) {
        this.activeGift.remainingMs = durationMs; // REFRESH, not stack
        this.lastActivityTime = Date.now();
        this.state = 'active';
        return true;
      }
      // Higher tier replaces lower
      if (tiers[this.activeGift.type] >= tiers[giftType]) {
        return false;
      }
    }
    this.activeGift = { type: giftType, remainingMs: durationMs, color };
    this.lastActivityTime = Date.now();
    this.state = 'active';
    this.likeActiveUntil = 0; // gift takes over from likes
    return true;
  }

  updateGiftTimer(dt) {
    if (!this.activeGift) return;
    this.activeGift.remainingMs -= dt;
    if (this.activeGift.remainingMs <= 0) {
      this.activeGift = null;
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
      rose: 1.2,
      donut: 1.5,
      confetti: 2.0,
      moneygun: 2.5,
      firetruck: 3.0,
    };
    return multipliers[this.activeGift.type] || 1;
  }

  getSizeMultiplier() {
    if (!this.activeGift) return 1;
    if (this.activeGift.type === 'firetruck') return 2.0;
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
    if (!this.activeGift) return 10;
    const damage = {
      rose: 20,
      donut: 40,
      confetti: 80,
      moneygun: 100,
      firetruck: 150,
    };
    return damage[this.activeGift.type] || 10;
  }

  // Everyone vs everyone — no team protection
  canHitTarget(target) {
    if (!this.canAttack()) return false;
    if (target.id === this.id) return false;
    // MoneyGun & FireTruck: hit everyone
    if (this.activeGift && (this.activeGift.type === 'firetruck' || this.activeGift.type === 'moneygun')) {
      return true;
    }
    // Normal: can only hit inactive players
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
    // Inactive players (and bots) move very slowly
    if (this.state === 'inactive') moveFactor = 0.2;

    this.x += Math.cos(this.angle) * actualSpeed * moveFactor * (dt / 16);
    this.y += Math.sin(this.angle) * actualSpeed * moveFactor * (dt / 16);

    const effectiveSize = this.size * this.getSizeMultiplier();
    const halfSize = effectiveSize / 2;
    if (this.x < halfSize) { this.x = halfSize; this.angle = Math.PI - this.angle; }
    if (this.x > ARENA_SIZE - halfSize) { this.x = ARENA_SIZE - halfSize; this.angle = Math.PI - this.angle; }
    if (this.y < halfSize) { this.y = halfSize; this.angle = -this.angle; }
    if (this.y > ARENA_SIZE - halfSize) { this.y = ARENA_SIZE - halfSize; this.angle = -this.angle; }

    if (this.state === 'active') {
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
    };
  }
}

module.exports = PacMan;
