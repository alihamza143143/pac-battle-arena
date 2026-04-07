const Game = require('../server/Game');

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.start();
  });

  afterEach(() => {
    game.stop();
  });

  test('starts with 20 AI', () => {
    expect(game.arena.getAICount()).toBe(20);
  });

  test('starts with coins', () => {
    expect(game.coinSystem.getAll().length).toBeGreaterThanOrEqual(20);
  });

  test('tick updates game state', () => {
    const state = game.tick(33);
    expect(state.type).toBe('gameState');
    expect(state.entities).toBeDefined();
    expect(state.teams).toBeDefined();
    expect(state.round).toBeDefined();
    expect(state.coins).toBeDefined();
  });

  test('processJoin creates neutral player', () => {
    game.processEvent({
      type: 'join',
      username: 'testUser',
      nickname: 'Test',
      avatarUrl: 'https://example.com/pic.jpg',
    });
    const pm = game.arena.getByUsername('testUser');
    expect(pm).not.toBeNull();
    expect(pm.state).toBe('neutral');
    expect(pm.team).toBeNull();
  });

  test('processGift rose joins pink team', () => {
    game.processEvent({ type: 'join', username: 'user1', nickname: 'U1', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user1', giftType: 'rose' });
    const pm = game.arena.getByUsername('user1');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
    expect(pm.activatedByGift).toBe(true);
  });

  test('processGift tiktok joins blue team', () => {
    game.processEvent({ type: 'join', username: 'user2', nickname: 'U2', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user2', giftType: 'tiktok' });
    const pm = game.arena.getByUsername('user2');
    expect(pm.team).toBe('blue');
  });

  test('processLike activates inactive player but keeps activatedByGift false', () => {
    game.processEvent({ type: 'join', username: 'user3', nickname: 'U3', avatarUrl: '' });
    game.processEvent({ type: 'gift', username: 'user3', giftType: 'tiktok' });
    const pm = game.arena.getByUsername('user3');
    pm.state = 'inactive';
    pm.activatedByGift = false;
    game.processEvent({ type: 'like', username: 'user3' });
    expect(pm.state).toBe('active');
    expect(pm.activatedByGift).toBe(false);
  });

  test('reset clears and restarts', () => {
    game.processEvent({ type: 'join', username: 'user4', nickname: 'U4', avatarUrl: '' });
    game.reset();
    expect(game.arena.getByUsername('user4')).toBeNull();
    expect(game.arena.getAICount()).toBe(20);
  });
});
