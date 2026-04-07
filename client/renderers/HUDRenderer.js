class HUDRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this._createElements();
  }

  _createElements() {
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x000000, 0.5);
    topBar.drawRoundedRect(10, 8, 1060, 50, 10);
    topBar.endFill();
    this.container.addChild(topBar);

    this.pinkScore = new PIXI.Text('🌹 PINK: 0', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xff69b4,
    });
    this.pinkScore.x = 30; this.pinkScore.y = 18;
    this.container.addChild(this.pinkScore);

    this.roundText = new PIXI.Text('RUNDE 1 — 15:00', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff,
    });
    this.roundText.anchor.set(0.5, 0);
    this.roundText.x = 540; this.roundText.y = 18;
    this.container.addChild(this.roundText);

    this.blueScore = new PIXI.Text('🎵 BLUE: 0', {
      fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0x4488ff,
    });
    this.blueScore.anchor.set(1, 0);
    this.blueScore.x = 1050; this.blueScore.y = 18;
    this.container.addChild(this.blueScore);

    this.kingText = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 14, fill: 0xffd700, strokeThickness: 2, stroke: 0x000000,
    });
    this.kingText.x = 20; this.kingText.y = 68;
    this.container.addChild(this.kingText);

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
    this.pinkScore.text = `🌹 PINK: ${teams.pink.score.toLocaleString('de-DE')}`;
    this.blueScore.text = `🎵 BLUE: ${teams.blue.score.toLocaleString('de-DE')}`;

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
