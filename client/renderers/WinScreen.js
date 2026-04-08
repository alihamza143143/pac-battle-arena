class WinScreen {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.visible = false;
    this.app.stage.addChild(this.container);
    this.confettiParticles = [];
  }

  show(data) {
    this.container.visible = true;
    this._build(data);
    this._startConfetti();
  }

  hide() {
    this.container.visible = false;
    this._clearConfetti();
    while (this.container.children.length > 0) this.container.removeChildAt(0);
  }

  update() {
    if (!this.container.visible) return;
    this._updateConfetti();
  }

  _build(data) {
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.75); overlay.drawRect(0, 0, 1080, 1080); overlay.endFill();
    this.container.addChild(overlay);

    const title = new PIXI.Text('RUNDE BEENDET!', {
      fontFamily: 'Arial', fontSize: 48, fontWeight: 'bold', fill: 0xffd700, align: 'center',
    });
    title.anchor.set(0.5); title.x = 540; title.y = 150;
    this.container.addChild(title);

    const winColor = data.winningTeam === 'blue' ? 0x4488ff : 0xff69b4;
    const winName = data.winningTeam === 'blue' ? 'BOYS' : 'GIRLS';
    const winText = new PIXI.Text(`🏆 ${winName} GEWINNT! 🏆`, {
      fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold', fill: winColor, align: 'center',
    });
    winText.anchor.set(0.5); winText.x = 540; winText.y = 250;
    this.container.addChild(winText);

    const scoreText = new PIXI.Text(
      `Girls: ${data.teamScores.pink.toLocaleString('de-DE')}  |  Boys: ${data.teamScores.blue.toLocaleString('de-DE')}`,
      { fontFamily: 'Arial', fontSize: 22, fill: 0xffffff, align: 'center' }
    );
    scoreText.anchor.set(0.5); scoreText.x = 540; scoreText.y = 320;
    this.container.addChild(scoreText);

    const trophyEmojis = ['🥇', '🥈', '🥉'];
    const trophyColors = [0xffd700, 0xc0c0c0, 0xcd7f32];
    for (let i = 0; i < data.top3.length; i++) {
      const p = data.top3[i];
      const y = 420 + i * 90;
      const bg = new PIXI.Graphics();
      bg.beginFill(trophyColors[i], 0.2); bg.drawRoundedRect(250, y - 10, 580, 70, 12); bg.endFill();
      bg.lineStyle(2, trophyColors[i], 0.5); bg.drawRoundedRect(250, y - 10, 580, 70, 12);
      this.container.addChild(bg);

      // Profile picture (circular)
      if (p.avatarUrl) {
        try {
          const avatarSprite = PIXI.Sprite.from(p.avatarUrl);
          avatarSprite.anchor.set(0.5);
          avatarSprite.width = 50; avatarSprite.height = 50;
          avatarSprite.x = 295; avatarSprite.y = y + 25;
          const mask = new PIXI.Graphics();
          mask.beginFill(0xffffff); mask.drawCircle(295, y + 25, 24); mask.endFill();
          this.container.addChild(mask);
          avatarSprite.mask = mask;
          this.container.addChild(avatarSprite);
          // Border around avatar
          const ring = new PIXI.Graphics();
          ring.lineStyle(3, trophyColors[i]); ring.drawCircle(295, y + 25, 26);
          this.container.addChild(ring);
        } catch (e) {}
      }

      const text = new PIXI.Text(
        `${trophyEmojis[i]}  ${p.username}  —  ${p.points.toLocaleString('de-DE')} Punkte`,
        { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: trophyColors[i], align: 'center' }
      );
      text.anchor.set(0.5); text.x = 570; text.y = y + 25;
      this.container.addChild(text);
    }

    if (data.king) {
      const kingText = new PIXI.Text(
        `👑 König: ${data.king.username} (${data.king.points.toLocaleString('de-DE')})`,
        { fontFamily: 'Arial', fontSize: 20, fill: 0xffd700, align: 'center' }
      );
      kingText.anchor.set(0.5); kingText.x = 540; kingText.y = 700;
      this.container.addChild(kingText);
    }

    const nextText = new PIXI.Text('Nächste Runde startet gleich...', {
      fontFamily: 'Arial', fontSize: 18, fill: 0xaaaaaa, align: 'center',
    });
    nextText.anchor.set(0.5); nextText.x = 540; nextText.y = 800;
    this.container.addChild(nextText);
  }

  _startConfetti() {
    for (let i = 0; i < 100; i++) {
      const p = new PIXI.Graphics();
      const colors = [0xff69b4, 0x4488ff, 0xffd700, 0xff4400, 0x00ff88];
      p.beginFill(colors[Math.floor(Math.random() * colors.length)]);
      p.drawRect(0, 0, 6, 12); p.endFill();
      p.x = Math.random() * 1080; p.y = -20 - Math.random() * 200;
      p.vy = 1 + Math.random() * 3; p.vx = (Math.random() - 0.5) * 2;
      p.rotation = Math.random() * Math.PI; p.vr = (Math.random() - 0.5) * 0.1;
      this.container.addChild(p);
      this.confettiParticles.push(p);
    }
  }

  _updateConfetti() {
    for (const p of this.confettiParticles) {
      p.x += p.vx; p.y += p.vy; p.rotation += p.vr;
      if (p.y > 1100) { p.y = -20; p.x = Math.random() * 1080; }
    }
  }

  _clearConfetti() {
    for (const p of this.confettiParticles) { this.container.removeChild(p); p.destroy(); }
    this.confettiParticles = [];
  }
}
