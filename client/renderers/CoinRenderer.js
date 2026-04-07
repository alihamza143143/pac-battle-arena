class CoinRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.coinSprites = new Map();
    this.sparkles = [];
  }

  update(gameState) {
    const coins = gameState.coins || [];
    const currentIds = new Set(coins.map(c => c.id));

    for (const [id, sprite] of this.coinSprites) {
      if (!currentIds.has(id)) {
        this._addSparkle(sprite.x, sprite.y);
        this.container.removeChild(sprite);
        sprite.destroy();
        this.coinSprites.delete(id);
      }
    }

    for (const coin of coins) {
      let sprite = this.coinSprites.get(coin.id);
      if (!sprite) {
        sprite = this._createCoinSprite(coin);
        this.coinSprites.set(coin.id, sprite);
        this.container.addChild(sprite);
      }
      sprite.y = coin.y + Math.sin(Date.now() / 500 + coin.x) * 2;
    }

    this._updateSparkles();
  }

  _createCoinSprite(coin) {
    const g = new PIXI.Graphics();
    const isBig = coin.type === 'big';
    const radius = isBig ? 8 : 5;
    const color = isBig ? 0xffd700 : 0xffffaa;
    const glowColor = isBig ? 0xffd700 : 0xffff88;
    g.beginFill(glowColor, 0.2);
    g.drawCircle(0, 0, radius + 6);
    g.endFill();
    g.beginFill(color);
    g.drawCircle(0, 0, radius);
    g.endFill();
    g.x = coin.x; g.y = coin.y;
    return g;
  }

  _addSparkle(x, y) {
    for (let i = 0; i < 6; i++) {
      const s = new PIXI.Graphics();
      s.beginFill(0xffd700);
      s.drawCircle(0, 0, 2);
      s.endFill();
      s.x = x; s.y = y;
      s.vx = (Math.random() - 0.5) * 4;
      s.vy = (Math.random() - 0.5) * 4;
      s.life = 20;
      this.container.addChild(s);
      this.sparkles.push(s);
    }
  }

  _updateSparkles() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx; s.y += s.vy;
      s.alpha = s.life / 20;
      s.life--;
      if (s.life <= 0) {
        this.container.removeChild(s);
        s.destroy();
        this.sparkles.splice(i, 1);
      }
    }
  }
}
