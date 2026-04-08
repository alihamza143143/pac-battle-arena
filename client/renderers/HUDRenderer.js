class HUDRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._tiktokTexture = this._createTikTokIcon();
    this._createElements();
  }

  // Draw a TikTok-style music note icon (the 3D colored note)
  _createTikTokIcon() {
    const size = 28;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2;
    const s = size / 28; // scale factor

    // TikTok note shape — stylized "d" with cyan + pink offset
    const drawNote = (offsetX, offsetY, color) => {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = color;
      // Note head (circle at bottom-left)
      ctx.beginPath();
      ctx.ellipse(9 * s, 20 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Stem (vertical bar)
      ctx.fillRect(12.5 * s, 4 * s, 2.5 * s, 17 * s);
      // Flag (curve at top-right)
      ctx.beginPath();
      ctx.moveTo(15 * s, 4 * s);
      ctx.quadraticCurveTo(21 * s, 5 * s, 20 * s, 10 * s);
      ctx.lineTo(17.5 * s, 9 * s);
      ctx.quadraticCurveTo(18 * s, 6 * s, 15 * s, 5.5 * s);
      ctx.fill();
      ctx.restore();
    };

    // Cyan layer (offset left)
    drawNote(-1.2, 0, '#25f4ee');
    // Pink layer (offset right)
    drawNote(1.2, 0, '#fe2c55');
    // White center layer
    drawNote(0, 0, '#ffffff');

    return PIXI.Texture.from(canvas);
  }

  _createElements() {
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x000000, 0.5);
    topBar.drawRoundedRect(10, 8, 1060, 50, 10);
    topBar.endFill();
    this.container.addChild(topBar);

    // ── Girls (Pink) — Rose emoji + text ──
    this.pinkScore = new PIXI.Text('🌹 Girls: 0', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xff69b4,
    });
    this.pinkScore.x = 30; this.pinkScore.y = 18;
    this.container.addChild(this.pinkScore);

    // ── Round info (center) ──
    this.roundText = new PIXI.Text('RUNDE 1 — 15:00', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff,
    });
    this.roundText.anchor.set(0.5, 0);
    this.roundText.x = 540; this.roundText.y = 18;
    this.container.addChild(this.roundText);

    // ── Boys (Blue) — TikTok icon + text ──
    this.blueScore = new PIXI.Text('Boys: 0', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0x4488ff,
    });
    this.blueScore.anchor.set(1, 0);
    this.blueScore.x = 1022; this.blueScore.y = 18;
    this.container.addChild(this.blueScore);

    // TikTok icon sprite next to Boys text
    this.tiktokIcon = new PIXI.Sprite(this._tiktokTexture);
    this.tiktokIcon.width = 22; this.tiktokIcon.height = 22;
    this.tiktokIcon.x = 1028; this.tiktokIcon.y = 20;
    this.container.addChild(this.tiktokIcon);

    // ── King ──
    this.kingText = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 14, fill: 0xffd700, strokeThickness: 2, stroke: 0x000000,
    });
    this.kingText.x = 20; this.kingText.y = 68;
    this.container.addChild(this.kingText);

    // ── Top 3 Leaderboard ──
    this.top3Container = new PIXI.Container();
    this.top3Container.x = 880; this.top3Container.y = 990;
    this.container.addChild(this.top3Container);

    this.top3Texts = [];
    const trophies = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < 3; i++) {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x000000, 0.5);
      bg.drawRoundedRect(0, i * 26, 190, 24, 6);
      bg.endFill();
      this.top3Container.addChild(bg);
      const text = new PIXI.Text(`${trophies[i]} ---`, {
        fontFamily: 'Arial', fontSize: 13, fill: 0xffffff,
      });
      text.x = 8; text.y = i * 26 + 3;
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
