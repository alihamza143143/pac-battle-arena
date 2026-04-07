const PacMan = require('../server/PacMan');

describe('PacMan', () => {
  test('creates AI pacman with defaults', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    expect(pm.type).toBe('ai');
    expect(pm.team).toBe('blue');
    expect(pm.state).toBe('inactive');
    expect(pm.points).toBe(500);
    expect(pm.x).toBeGreaterThanOrEqual(0);
    expect(pm.y).toBeGreaterThanOrEqual(0);
    expect(pm.username).toMatch(/^Bot-/);
  });

  test('creates player pacman as neutral', () => {
    const pm = new PacMan({
      type: 'player',
      username: 'testUser',
      avatarUrl: 'https://example.com/pic.jpg',
    });
    expect(pm.type).toBe('player');
    expect(pm.state).toBe('neutral');
    expect(pm.team).toBeNull();
    expect(pm.points).toBe(500);
    expect(pm.username).toBe('testUser');
  });

  test('joinTeam changes state and team', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('pink');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
    expect(pm.activatedByGift).toBe(true);
  });

  test('activate sets state to active', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.state = 'inactive';
    pm.activate();
    expect(pm.state).toBe('active');
  });

  test('activateByLike does not set activatedByGift', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.state = 'inactive';
    pm.activatedByGift = false;
    pm.activateByLike();
    expect(pm.state).toBe('active');
    expect(pm.activatedByGift).toBe(false);
  });

  test('like-only player deals 2 damage', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.activatedByGift = false;
    pm.activeGift = null;
    expect(pm.getDamagePerHit()).toBe(2);
  });

  test('gift-activated player deals 5 damage without active gift', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.activatedByGift = true;
    pm.activeGift = null;
    expect(pm.getDamagePerHit()).toBe(5);
  });

  test('like-only player cannot collect coins', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.activatedByGift = false;
    expect(pm.canCollectCoins()).toBe(false);
  });

  test('gift-activated player can collect coins', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.activatedByGift = true;
    expect(pm.canCollectCoins()).toBe(true);
  });

  test('takeDamage reduces points', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.takeDamage(50);
    expect(pm.points).toBe(450);
  });

  test('takeDamage does not go below 0', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.takeDamage(600);
    expect(pm.points).toBe(0);
    expect(pm.isEliminated()).toBe(true);
  });

  test('addPoints increases points', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    pm.addPoints(100);
    expect(pm.points).toBe(600);
  });

  test('canAttack returns true for active, false for inactive/neutral', () => {
    const active = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const inactive = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const neutral = new PacMan({ type: 'player', username: 'test' });
    expect(active.canAttack()).toBe(true);
    expect(inactive.canAttack()).toBe(false);
    expect(neutral.canAttack()).toBe(false);
  });

  test('canBeAttacked returns true for inactive/neutral', () => {
    const active = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const inactive = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const neutral = new PacMan({ type: 'player', username: 'test' });
    expect(active.canBeAttacked()).toBe(false);
    expect(inactive.canBeAttacked()).toBe(true);
    expect(neutral.canBeAttacked()).toBe(true);
  });

  test('applyGift sets gift and activatedByGift', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.applyGift('donut', '#ffff00', 3000);
    expect(pm.activeGift.type).toBe('donut');
    expect(pm.activatedByGift).toBe(true);
  });

  test('higher tier gift replaces lower', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.applyGift('rose', '#ff69b4', 3000);
    pm.applyGift('donut', '#ffff00', 3000);
    expect(pm.activeGift.type).toBe('donut');
  });

  test('lower tier gift does not replace higher', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    pm.applyGift('confetti', '#ff00ff', 3000);
    const result = pm.applyGift('rose', '#ff69b4', 3000);
    expect(result).toBe(false);
    expect(pm.activeGift.type).toBe('confetti');
  });

  test('toJSON serializes entity', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    const json = pm.toJSON();
    expect(json.id).toBeDefined();
    expect(json.type).toBe('ai');
    expect(json.team).toBe('blue');
    expect(json.points).toBe(500);
    expect(json.x).toBeDefined();
    expect(json.y).toBeDefined();
    expect(json.activatedByGift).toBeDefined();
  });
});
