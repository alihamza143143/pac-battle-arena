class PacManRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.sprites = new Map();
    this.avatarImages = new Map(); // url -> HTMLImageElement
    this.time = 0;
  }

  update(gameState) {
    this.time += 0.016;
    const entities = gameState.entities;
    const currentIds = new Set(entities.map(e => e.id));

    for (const [id, group] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(group.sprite);
        group.sprite.destroy(true);
        this.sprites.delete(id);
      }
    }

    for (const entity of entities) {
      let group = this.sprites.get(entity.id);
      if (!group) {
        group = this._createGroup(entity);
        this.sprites.set(entity.id, group);
        this.container.addChild(group.sprite);
      }
      this._updateGroup(group, entity);
    }
  }

  _getTeamColor(entity) {
    if (!entity.team) return { r: 255, g: 0, b: 0, hex: '#ff0000' };
    if (entity.team === 'blue') return { r: 68, g: 136, b: 255, hex: '#4488ff' };
    return { r: 255, g: 77, b: 166, hex: '#ff4da6' };
  }

  _getBoostConfig(entity) {
    if (!entity.activeGift) return null;
    const configs = {
      rose:      { hex: '#ff4da6', thickness: 5,  speed: 0.008, segments: 4, glowSize: 15 },
      donut:     { hex: '#ffdd00', thickness: 8,  speed: 0.018, segments: 4, glowSize: 20 },
      confetti:  { hex: '#00cc66', thickness: 11, speed: 0.03,  segments: 4, glowSize: 22 },
      moneygun:  { hex: '#ff9f1a', thickness: 14, speed: 0.045, segments: 4, glowSize: 25 },
      firetruck: { hex: '#ff2200', thickness: 18, speed: 0.065, segments: 4, glowSize: 30 },
    };
    return configs[entity.activeGift.type] || null;
  }

  _createGroup(entity) {
    // Offscreen canvas for Canvas 2D rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    sprite.anchor.set(0.5);

    // Label
    const label = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 11, fill: 0xffffff,
      align: 'center', strokeThickness: 3, stroke: 0x000000, fontWeight: 'bold',
    });
    label.anchor.set(0.5, 1);
    this.container.addChild(label);

    // Crown
    const crown = new PIXI.Text('👑', { fontSize: 18 });
    crown.anchor.set(0.5, 1);
    crown.visible = false;
    this.container.addChild(crown);

    // Load avatar image for Canvas 2D
    if (entity.avatarUrl && !this.avatarImages.has(entity.avatarUrl)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = entity.avatarUrl;
      this.avatarImages.set(entity.avatarUrl, img);
    }

    return { canvas, ctx, sprite, label, crown, boostRotation: 0, lastAvatarUrl: entity.avatarUrl };
  }

  _updateGroup(group, entity) {
    const teamColor = this._getTeamColor(entity);
    const boostConfig = this._getBoostConfig(entity);
    const r = entity.size / 2;
    const borderW = Math.max(5, r * 0.16);

    // Calculate canvas size needed (pac-man + border + boost + glow margin)
    const boostExtra = boostConfig ? boostConfig.thickness + boostConfig.glowSize + 10 : 0;
    const totalR = r + borderW + boostExtra + 30; // 30px margin for glow bleed
    const canvasSize = Math.ceil(totalR * 2) + 4;
    const cx = canvasSize / 2; // center x
    const cy = canvasSize / 2; // center y

    const { canvas, ctx, sprite, label, crown } = group;

    // Resize canvas if needed
    if (canvas.width !== canvasSize || canvas.height !== canvasSize) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const mouthRad = (entity.mouthAngle || 0) * (Math.PI / 180);
    const mouthOpen = Math.max(0.02, mouthRad);
    const dir = entity.angle || 0; // movement direction

    // ── Boost Ring (rotating segmented — exactly like client reference) ──
    if (boostConfig) {
      group.boostRotation += boostConfig.speed;
      const boostR = r + borderW + 6;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(group.boostRotation);

      ctx.lineWidth = boostConfig.thickness;
      ctx.strokeStyle = boostConfig.hex;
      ctx.shadowBlur = boostConfig.glowSize;
      ctx.shadowColor = boostConfig.hex;

      const segCount = boostConfig.segments;
      for (let i = 0; i < segCount; i++) {
        const start = i * (Math.PI / 2) + 0.18;
        const end = start + (Math.PI / 2) - 0.36;
        ctx.beginPath();
        ctx.arc(0, 0, boostR, start, end);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Rotate entire pac-man to face movement direction ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(dir);

    // ── Team Border (thick glowing ring — exactly like client reference) ──
    ctx.lineWidth = borderW;
    ctx.strokeStyle = teamColor.hex;
    ctx.shadowBlur = 20;
    ctx.shadowColor = teamColor.hex;

    ctx.beginPath();
    ctx.arc(0, 0, r, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();

    // Double stroke for stronger glow
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, r, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // ── Dark Body (#222 — client reference) ──
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - borderW * 0.4, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.closePath();
    ctx.fill();

    // ── Avatar (profile pic clipped inside mouth — client reference) ──
    const avatarImg = entity.avatarUrl ? this.avatarImages.get(entity.avatarUrl) : null;
    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - borderW * 0.8, mouthOpen, Math.PI * 2 - mouthOpen);
      ctx.closePath();
      ctx.clip();

      const imgSize = r * 1.8;
      // Counter-rotate the image so it stays upright
      ctx.rotate(-dir);
      ctx.drawImage(avatarImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
      ctx.restore();
    }

    // ── Inner subtle ring (thin white — client reference detail) ──
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, r - borderW * 0.7, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();

    ctx.restore(); // end rotation

    // ── Update PixiJS sprite from canvas ──
    sprite.texture.destroy(true);
    sprite.texture = PIXI.Texture.from(canvas);
    sprite.width = canvasSize;
    sprite.height = canvasSize;
    sprite.x = entity.x;
    sprite.y = entity.y;

    // ── Inactive dim ──
    sprite.alpha = entity.state === 'inactive' ? 0.35 : 1;

    // ── Label ──
    const labelOffset = r + boostExtra + 14;
    if (!entity.team) {
      label.text = 'Wähle ein Team';
      label.style.fill = 0xff6666;
      label.style.fontSize = 10;
    } else {
      label.text = `${entity.username}  ${entity.points}`;
      label.style.fill = 0xffffff;
      label.style.fontSize = 11;
    }
    label.x = entity.x;
    label.y = entity.y - labelOffset;

    // ── Crown ──
    crown.visible = entity.isKing;
    crown.x = entity.x;
    crown.y = label.y - 16;
  }
}
