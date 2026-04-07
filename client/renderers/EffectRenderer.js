class EffectRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.particles = [];
    this.freezeOverlay = null;
    this.processedEvents = new Set();
  }

  update(gameState) {
    const events = gameState.events || [];
    for (const evt of events) {
      const key = `${evt.type}-${evt.userId || ''}-${Date.now() >> 10}`;
      if (this.processedEvents.has(key)) continue;
      this.processedEvents.add(key);
      if (evt.type === 'moneygun') {
        this._showFreezeEffect();
        this._showCoinFlyEffect(evt, gameState.entities);
      } else if (evt.type === 'firetruck') {
        this._showExplosionEffect(evt, gameState.entities);
      }
    }
    if (this.processedEvents.size > 100) this.processedEvents.clear();
    this._updateFreezeOverlay();
    this._updateParticles();
    for (const entity of gameState.entities) {
      if (entity.activeGift && entity.activeGift.type === 'firetruck') {
        this._addFireParticles(entity.x, entity.y, entity.size);
      }
    }
  }

  _showFreezeEffect() {
    if (this.freezeOverlay) { this.container.removeChild(this.freezeOverlay); this.freezeOverlay.destroy(); }
    this.freezeOverlay = new PIXI.Graphics();
    this.freezeOverlay.beginFill(0x88ccff, 0.15);
    this.freezeOverlay.drawRect(0, 0, 1080, 1080);
    this.freezeOverlay.endFill();
    this.freezeOverlay.life = 90;
    this.container.addChild(this.freezeOverlay);
  }

  _updateFreezeOverlay() {
    if (!this.freezeOverlay) return;
    this.freezeOverlay.life--;
    this.freezeOverlay.alpha = this.freezeOverlay.life / 90;
    if (this.freezeOverlay.life <= 0) {
      this.container.removeChild(this.freezeOverlay);
      this.freezeOverlay.destroy();
      this.freezeOverlay = null;
    }
  }

  _showCoinFlyEffect(evt, entities) {
    const user = entities.find(e => e.id === evt.userId);
    if (!user) return;
    for (const entity of entities) {
      if (entity.id === evt.userId) continue;
      for (let i = 0; i < 3; i++) {
        const coin = new PIXI.Graphics();
        coin.beginFill(0xffd700); coin.drawCircle(0, 0, 4); coin.endFill();
        coin.x = entity.x; coin.y = entity.y;
        coin.targetX = user.x; coin.targetY = user.y;
        coin.progress = 0; coin.speed = 0.02 + Math.random() * 0.02;
        coin.delay = i * 5; coin.type = 'coinfly';
        this.container.addChild(coin);
        this.particles.push(coin);
      }
    }
  }

  _showExplosionEffect(evt, entities) {
    const user = entities.find(e => e.id === evt.userId);
    if (!user) return;
    for (let i = 0; i < 30; i++) {
      const p = new PIXI.Graphics();
      const color = Math.random() > 0.5 ? 0xff4400 : 0xffa500;
      p.beginFill(color); p.drawCircle(0, 0, 3 + Math.random() * 4); p.endFill();
      p.x = user.x; p.y = user.y;
      p.vx = (Math.random() - 0.5) * 12; p.vy = (Math.random() - 0.5) * 12;
      p.life = 30 + Math.random() * 20; p.type = 'explosion';
      this.container.addChild(p);
      this.particles.push(p);
    }
  }

  _addFireParticles(x, y, size) {
    if (Math.random() > 0.3) return;
    const p = new PIXI.Graphics();
    const color = Math.random() > 0.5 ? 0xff4400 : 0xff6600;
    p.beginFill(color, 0.7); p.drawCircle(0, 0, 2 + Math.random() * 3); p.endFill();
    p.x = x + (Math.random() - 0.5) * size; p.y = y + (Math.random() - 0.5) * size;
    p.vy = -1 - Math.random() * 2; p.vx = (Math.random() - 0.5) * 1;
    p.life = 15 + Math.random() * 10; p.type = 'fire';
    this.container.addChild(p);
    this.particles.push(p);
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'coinfly') {
        if (p.delay > 0) { p.delay--; continue; }
        p.progress += p.speed;
        p.x += (p.targetX - p.x) * p.speed * 3;
        p.y += (p.targetY - p.y) * p.speed * 3;
        p.alpha = 1 - p.progress;
        if (p.progress >= 1) { this.container.removeChild(p); p.destroy(); this.particles.splice(i, 1); }
      } else {
        p.x += p.vx || 0; p.y += p.vy || 0;
        p.life--;
        p.alpha = Math.max(0, p.life / 30);
        if (p.life <= 0) { this.container.removeChild(p); p.destroy(); this.particles.splice(i, 1); }
      }
    }
  }
}
