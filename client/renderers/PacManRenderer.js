class PacManRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.sprites = new Map();
    this.avatarImages = new Map();
    this.giftImages = {};
    this.time = 0;
    this._loadGiftImages();
  }

  _loadGiftImages() {
    const gifts = {
      rose: 'assets/gift-rose.jpeg',
      donut: 'assets/gift-donut.jpeg',
      confetti: 'assets/gift-confetti.jpeg',
      moneygun: 'assets/gift-moneygun.jpeg',
      firetruck: 'assets/gift-firetruck.jpeg',
    };
    for (const [key, src] of Object.entries(gifts)) {
      const img = new Image();
      img.src = src;
      this.giftImages[key] = img;
    }
  }

  update(gameState) {
    this.time += 0.016;
    const entities = gameState.entities;
    const currentIds = new Set(entities.map(e => e.id));

    for (const [id, group] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(group.sprite);
        group.sprite.destroy(true);
        if (group.label) this.container.removeChild(group.label);
        if (group.crown) this.container.removeChild(group.crown);
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
    if (!entity.team) return { hex: '#ff0000', glow: '#ff0000' };
    if (entity.team === 'blue') return { hex: '#4488ff', glow: '#4488ff' };
    return { hex: '#ff4da6', glow: '#ff4da6' };
  }

  _getBoostConfig(entity) {
    if (!entity.activeGift) return null;
    const configs = {
      rose:      { iconCount: 4, orbitR: 1.6, speed: 0.025, iconSize: 0.4, glowHex: '#ff0000', glowSize: 25, ringHex: '#ff0000', ringWidth: 4 },
      donut:     { iconCount: 4, orbitR: 1.7, speed: 0.035, iconSize: 0.45, glowHex: '#ffdd00', glowSize: 28, ringHex: '#ffdd00', ringWidth: 4 },
      confetti:  { iconCount: 5, orbitR: 1.8, speed: 0.045, iconSize: 0.4, glowHex: '#00ff88', glowSize: 30, ringHex: '#00ff88', ringWidth: 5 },
      moneygun:  { iconCount: 5, orbitR: 1.9, speed: 0.05,  iconSize: 0.5, glowHex: '#ffd700', glowSize: 35, ringHex: '#ffd700', ringWidth: 5 },
      firetruck: { iconCount: 6, orbitR: 2.0, speed: 0.07,  iconSize: 0.55, glowHex: '#ff2200', glowSize: 40, ringHex: '#ff2200', ringWidth: 6 },
    };
    return configs[entity.activeGift.type] || null;
  }

  _createGroup(entity) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    sprite.anchor.set(0.5);

    const label = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 11, fill: 0xffffff,
      align: 'center', strokeThickness: 3, stroke: 0x000000, fontWeight: 'bold',
    });
    label.anchor.set(0.5, 1);
    this.container.addChild(label);

    const crown = new PIXI.Text('👑', { fontSize: 18 });
    crown.anchor.set(0.5, 1);
    crown.visible = false;
    this.container.addChild(crown);

    if (entity.avatarUrl && !this.avatarImages.has(entity.avatarUrl)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = entity.avatarUrl;
      this.avatarImages.set(entity.avatarUrl, img);
    }

    return { canvas, ctx, sprite, label, crown, boostRotation: 0 };
  }

  _updateGroup(group, entity) {
    const teamColor = this._getTeamColor(entity);
    const boostConfig = this._getBoostConfig(entity);
    const r = entity.size / 2;
    const borderW = Math.max(5, r * 0.16);

    const iconExtra = boostConfig ? r * boostConfig.orbitR + r * boostConfig.iconSize : 0;
    const totalR = r + borderW + iconExtra + 20;
    const canvasSize = Math.ceil(totalR * 2) + 4;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;

    const { canvas, ctx, sprite, label, crown } = group;

    if (canvas.width !== canvasSize || canvas.height !== canvasSize) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const mouthRad = (entity.mouthAngle || 0) * (Math.PI / 180);
    const mouthOpen = Math.max(0.02, mouthRad);
    const dir = entity.angle || 0;

    // ── Rotating Gift Icons (replaces old ring) ──
    if (boostConfig && entity.activeGift) {
      group.boostRotation += boostConfig.speed;
      const giftImg = this.giftImages[entity.activeGift.type];
      const orbitDist = r * boostConfig.orbitR;
      const iconPx = r * boostConfig.iconSize;

      // Strong visible glow ring behind icons
      if (boostConfig.ringHex) {
        ctx.save();
        ctx.strokeStyle = boostConfig.ringHex;
        ctx.lineWidth = boostConfig.ringWidth || 4;
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = boostConfig.glowSize;
        ctx.shadowColor = boostConfig.ringHex;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitDist, 0, Math.PI * 2);
        ctx.stroke();
        // Double stroke for extra brightness
        ctx.globalAlpha = 0.3;
        ctx.shadowBlur = boostConfig.glowSize * 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitDist, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Draw rotating icons (clipped to circles — no square backgrounds)
      if (giftImg && giftImg.complete && giftImg.naturalWidth > 0) {
        for (let i = 0; i < boostConfig.iconCount; i++) {
          const angle = group.boostRotation + (i * Math.PI * 2) / boostConfig.iconCount;
          const ix = cx + Math.cos(angle) * orbitDist;
          const iy = cy + Math.sin(angle) * orbitDist;
          const iconR = iconPx / 2;

          ctx.save();
          ctx.translate(ix, iy);
          // Clip to circle
          ctx.beginPath();
          ctx.arc(0, 0, iconR, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          // Glow behind icon
          ctx.shadowBlur = 8;
          ctx.shadowColor = boostConfig.glowHex;
          ctx.drawImage(giftImg, -iconR, -iconR, iconPx, iconPx);
          ctx.restore();
        }
      }

      // Fire Truck: fire particles (reduced count for performance)
      if (entity.activeGift.type === 'firetruck') {
        for (let i = 0; i < 4; i++) {
          const pa = group.boostRotation * 2 + i * 1.6;
          const pd = r * 1.2 + Math.sin(pa * 3) * r * 0.2;
          const px = cx + Math.cos(pa) * pd;
          const py = cy + Math.sin(pa) * pd;
          const pSize = 2 + Math.random() * 3;
          ctx.save();
          ctx.globalAlpha = 0.4 + Math.random() * 0.3;
          ctx.fillStyle = Math.random() > 0.5 ? '#ff4400' : '#ff8800';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ff4400';
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── Rotate pac-man body to face movement direction ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(dir);

    // ── Team Border (thick glowing ring) ──
    ctx.lineWidth = borderW;
    ctx.strokeStyle = teamColor.hex;
    ctx.shadowBlur = 20;
    ctx.shadowColor = teamColor.glow;
    ctx.beginPath();
    ctx.arc(0, 0, r, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();

    // Double stroke for stronger glow
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, r, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Dark Body ──
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - borderW * 0.4, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.closePath();
    ctx.fill();

    // ── Avatar (profile pic clipped inside mouth) ──
    const avatarImg = entity.avatarUrl ? this.avatarImages.get(entity.avatarUrl) : null;
    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - borderW * 0.8, mouthOpen, Math.PI * 2 - mouthOpen);
      ctx.closePath();
      ctx.clip();
      const imgSize = r * 1.8;
      ctx.rotate(-dir); // counter-rotate so avatar stays upright
      ctx.drawImage(avatarImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
      ctx.restore();
    }

    // ── Inner subtle ring ──
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, r - borderW * 0.7, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.stroke();

    ctx.restore(); // end pac-man rotation

    // ── Update PixiJS sprite from canvas ──
    sprite.texture.destroy(true);
    sprite.texture = PIXI.Texture.from(canvas);
    sprite.width = canvasSize;
    sprite.height = canvasSize;
    sprite.x = entity.x;
    sprite.y = entity.y;

    // ── Inactive dim (also check like-active for mouth) ──
    const isLiking = entity.lastLikeTime && (Date.now() - entity.lastLikeTime < 500);
    if (entity.state === 'inactive' && !isLiking) {
      sprite.alpha = 0.35;
    } else if (entity.state === 'inactive' && isLiking) {
      sprite.alpha = 0.6; // liking but inactive — slightly visible
    } else {
      sprite.alpha = 1;
    }

    // ── Label ──
    const labelOffset = totalR + 4;
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
