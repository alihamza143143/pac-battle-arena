class HUDRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._createElements();
  }

  _createElements() {
    // ── Top Bar ──
    const topBar = new PIXI.Graphics();
    topBar.lineStyle(2, 0xffd700, 0.6);
    topBar.beginFill(0x000000, 0.65);
    topBar.drawRoundedRect(10, 6, 1060, 65, 12);
    topBar.endFill();
    this.container.addChild(topBar);

    // ── Player Count (left) ──
    this.playerCount = new PIXI.Text('👥 Players: 0', {
      fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff,
      strokeThickness: 3, stroke: 0x000000,
    });
    this.playerCount.x = 25; this.playerCount.y = 22;
    this.container.addChild(this.playerCount);

    // ── Round info (center) ──
    this.roundText = new PIXI.Text('RUNDE 1 — 15:00', {
      fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff,
      strokeThickness: 2, stroke: 0x000000,
    });
    this.roundText.anchor.set(0.5, 0);
    this.roundText.x = 540; this.roundText.y = 22;
    this.container.addChild(this.roundText);

    // ── How to play (right) ──
    this.howToPlay = new PIXI.Text('❤️ Like = Move  |  🎁 Gift = Power', {
      fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: 0xaaaaaa,
      strokeThickness: 2, stroke: 0x000000,
    });
    this.howToPlay.anchor.set(1, 0);
    this.howToPlay.x = 1050; this.howToPlay.y = 28;
    this.container.addChild(this.howToPlay);

    // ── King ──
    this.kingText = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffd700,
      strokeThickness: 3, stroke: 0x000000,
    });
    this.kingText.x = 20; this.kingText.y = 80;
    this.container.addChild(this.kingText);

    // ── Top 3 Leaderboard ──
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
    const { round, king, top3, playerCount } = gameState;
    this.playerCount.text = `👥 Players: ${playerCount || 0}`;

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
