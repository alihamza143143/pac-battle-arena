class PacManRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.sprites = new Map();
    this.avatarTextures = new Map();
  }

  update(gameState) {
    const entities = gameState.entities;
    const currentIds = new Set(entities.map(e => e.id));

    for (const [id, group] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(group);
        group.destroy({ children: true });
        this.sprites.delete(id);
      }
    }

    for (const entity of entities) {
      let group = this.sprites.get(entity.id);
      if (!group) {
        group = this._createPacManGroup(entity);
        this.sprites.set(entity.id, group);
        this.container.addChild(group);
      }
      this._updatePacManGroup(group, entity);
    }
  }

  _getColor(entity) {
    if (entity.activeGift) {
      const colors = {
        '#ff69b4': 0xff69b4, '#ffff00': 0xffff00, '#ff00ff': 0xff00ff,
        '#ffd700': 0xffd700, '#ff4400': 0xff4400,
      };
      return colors[entity.activeGift.color] || 0xffffff;
    }
    if (!entity.team) return 0xff0000;
    return entity.team === 'blue' ? 0x4488ff : 0xff69b4;
  }

  _createPacManGroup(entity) {
    const group = new PIXI.Container();
    group.entityId = entity.id;

    const glow = new PIXI.Graphics();
    group.addChild(glow);
    group.glow = glow;

    const body = new PIXI.Graphics();
    group.addChild(body);
    group.body = body;

    const avatarContainer = new PIXI.Container();
    group.addChild(avatarContainer);
    group.avatarContainer = avatarContainer;

    if (entity.avatarUrl) {
      this._loadAvatar(entity.avatarUrl, avatarContainer, entity.size);
    }

    const eye = new PIXI.Graphics();
    group.addChild(eye);
    group.eye = eye;

    const label = new PIXI.Text('', {
      fontFamily: 'Arial', fontSize: 11, fill: 0xffffff,
      align: 'center', strokeThickness: 2, stroke: 0x000000,
    });
    label.anchor.set(0.5, 1);
    group.addChild(label);
    group.label = label;

    const crown = new PIXI.Text('👑', { fontSize: 16 });
    crown.anchor.set(0.5, 1);
    crown.visible = false;
    group.addChild(crown);
    group.crown = crown;

    return group;
  }

  async _loadAvatar(url, container, size) {
    if (!url) return;
    try {
      let texture = this.avatarTextures.get(url);
      if (!texture) {
        texture = await PIXI.Assets.load(url);
        this.avatarTextures.set(url, texture);
      }
      const avatar = new PIXI.Sprite(texture);
      avatar.anchor.set(0.5);
      avatar.width = size * 0.6;
      avatar.height = size * 0.6;
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawCircle(0, 0, size * 0.3);
      mask.endFill();
      container.addChild(mask);
      avatar.mask = mask;
      container.addChild(avatar);
      container.avatar = avatar;
      container.avatarMask = mask;
    } catch (e) {}
  }

  _updatePacManGroup(group, entity) {
    const color = this._getColor(entity);
    const size = entity.size;
    const halfSize = size / 2;

    group.x = entity.x;
    group.y = entity.y;

    group.glow.clear();
    const glowAlpha = entity.activeGift ? 0.3 : 0.15;
    group.glow.beginFill(color, glowAlpha);
    group.glow.drawCircle(0, 0, halfSize + 8);
    group.glow.endFill();

    const mouthAngle = (entity.mouthAngle || 0) * (Math.PI / 180);
    const startAngle = entity.angle + mouthAngle;
    const endAngle = entity.angle + (Math.PI * 2) - mouthAngle;

    group.body.clear();
    group.body.beginFill(color, 0.3);
    group.body.lineStyle(2.5, color, 1);
    group.body.moveTo(0, 0);
    group.body.arc(0, 0, halfSize, startAngle, endAngle);
    group.body.closePath();
    group.body.endFill();

    if (group.avatarContainer.avatar) {
      group.avatarContainer.avatar.width = size * 0.6;
      group.avatarContainer.avatar.height = size * 0.6;
      if (group.avatarContainer.avatarMask) {
        group.avatarContainer.avatarMask.clear();
        group.avatarContainer.avatarMask.beginFill(0xffffff);
        group.avatarContainer.avatarMask.drawCircle(0, 0, size * 0.3);
        group.avatarContainer.avatarMask.endFill();
      }
    }

    const eyeOffsetX = Math.cos(entity.angle - 0.5) * halfSize * 0.5;
    const eyeOffsetY = Math.sin(entity.angle - 0.5) * halfSize * 0.5;
    group.eye.clear();
    group.eye.beginFill(0xffffff);
    group.eye.drawCircle(eyeOffsetX, eyeOffsetY - halfSize * 0.2, size * 0.08);
    group.eye.endFill();
    group.eye.beginFill(0x000000);
    group.eye.drawCircle(eyeOffsetX, eyeOffsetY - halfSize * 0.2, size * 0.04);
    group.eye.endFill();

    if (!entity.team) {
      group.label.text = 'Wähle ein Team';
      group.label.style.fill = 0xff6666;
    } else {
      group.label.text = `${entity.username}\n${entity.points}`;
      group.label.style.fill = 0xffffff;
    }
    group.label.y = -halfSize - 10;

    group.crown.visible = entity.isKing;
    group.crown.y = -halfSize - 28;

    group.alpha = entity.state === 'inactive' ? 0.6 : 1;
  }
}
