class ArenaRenderer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.bgSprite = null;
  }

  async init() {
    const texture = await PIXI.Assets.load('assets/bg.jpeg');
    this.bgSprite = new PIXI.Sprite(texture);
    this.bgSprite.width = 1080;
    this.bgSprite.height = 1080;
    this.container.addChild(this.bgSprite);
  }

  update(gameState) {}
}
