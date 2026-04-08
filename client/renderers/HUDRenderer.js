class HUDRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._tiktokTexture = this._createTikTokIcon(40);
    this._createElements();
  }

  // Draw a TikTok-style music note icon (the 3D colored note)
  _createTikTokIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const s = size / 28;

    const drawNote = (offsetX, offsetY, color) => {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(9 * s, 20 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(12.5 * s, 4 * s, 2.5 * s, 17 * s);
      ctx.beginPath();
      ctx.moveTo(15 * s, 4 * s);
      ctx.quadraticCurveTo(21 * s, 5 * s, 20 * s, 10 * s);
      ctx.lineTo(17.5 * s, 9 * s);
      ctx.quadraticCurveTo(18 * s, 6 * s, 15 * s, 5.5 * s);
      ctx.fill();
      ctx.restore();
    };

    drawNote(-1.5, 0, '#25f4ee');
    drawNote(1.5, 0, '#fe2c55');
    drawNote(0, 0, '#ffffff');

    return PIXI.Texture.from(canvas);
  }

  _createElements() {
    // ── Top Bar — bigger with visible border ──
    const topBar = new PIXI.Graphics();
    topBar.lineStyle(2, 0x4488ff, 0.6);
    topBar.beginFill(0x000000, 0.65);
    topBar.drawRoundedRect(10, 6, 1060, 65, 12);
    topBar.endFill();
    this.container.addChild(topBar);

    // ── Girls (Pink) — Rose emoji + text ──
    this.pinkScore = new PIXI.Text('🌹 Girls: 0', {
      fontFamily: 'Arial', fontSize: 26, fontWeight: 'bold', fill: 0xff69b4,
      strokeThickness: 3, stroke: 0x000000,
    });
    this.pinkScore.x = 25; this.pinkScore.y = 20;
    this.container.addChild(this.pinkScore);

    // ── Round info (center) ──
    this.roundText = new PIXI.Text('RUNDE 1 — 15:00', {
      fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff,
      strokeThickness: 2, stroke: 0x000000,
    });
    this.roundText.anchor.set(0.5, 0);
    this.roundText.x = 540; this.roundText.y = 22;
    this.container.addChild(this.roundText);

    // ── Boys (Blue) — text + TikTok icon ──
    this.blueScore = new PIXI.Text('Boys: 0', {
      fontFamily: 'Arial', fontSize: 26, fontWeight: 'bold', fill: 0x4488ff,
      strokeThickness: 3, stroke: 0x000000,
    });
    this.blueScore.anchor.set(1, 0);
    this.blueScore.x = 1010; this.blueScore.y = 20;
    this.container.addChild(this.blueScore);

    // TikTok icon sprite next to Boys text
    this.tiktokIcon = new PIXI.Sprite(this._tiktokTexture);
    this.tiktokIcon.width = 30; this.tiktokIcon.height = 30;
    this.tiktokIcon.x = 1018; this.tiktokIcon.y = 22;
    this.container.addChild(this.tiktokIcon);

    // ── King — bigger ──
    this.kingText = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffd700,
      strokeThickness: 3, stroke: 0x000000,
    });
    this.kingText.x = 20; this.kingText.y = 80;
    this.container.addChild(this.kingText);

    // ── Top 3 Leaderboard — bigger ──
    this.top3Container = new PIXI.Container();
    this.top3Container.x = 850; this.top3Container.y = 980;
    this.container.addChild(this.top3Container);

    this.top3Texts = [];
    const trophies = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
      const bg = new PIXI.Graphics();
      bg.lineStyle(1, 0xffffff, 0.2);
      bg.beginFill(0x000000, 0.6);
      bg.drawRoundedRect(0, i * 30, 220, 28, 6);
      bg.endFill();
      this.top3Container.addChild(bg);
      const text = new PIXI.Text(`${trophies[i]} ---`, {
        fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: 0xffffff,
        strokeThickness: 2, stroke: 0x000000,
      });
      text.x = 8; text.y = i * 30 + 4;
      this.top3Container.addChild(text);
      this.top3Texts.push(text);
    }
  }

  update(gameState) {
    const { teams, round, king, top3 } = gameState;
    this.pinkScore.text = `🌹 Girls: ${teams.pink.score.toLocaleString('de-DE')}`;
    this.blueScore.text = `Boys: ${teams.blue.score.toLocaleString('de-DE')}`;

    const mins = Math.floor(round.remainingSeconds / 60);
    const secs = round.remainingSeconds % 60;
    this.roundText.text = `RUNDE ${round.number} — ${mins}:${secs.toString().padStart(2, '0')}`;

    if (king) {
      this.kingText.text = `👑 König: ${king.username} (${king.points.toLocaleString('de-DE')})`;
    } else {
      this.kingText.text = '';
    }

    const trophies = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
      if (top3[i]) {
        this.top3Texts[i].text = `${trophies[i]} ${top3[i].username}: ${top3[i].points.toLocaleString('de-DE')}`;
      } else {
        this.top3Texts[i].text = `${trophies[i]} ---`;
      }
    }
  }
}
