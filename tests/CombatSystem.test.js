const CombatSystem = require('../server/CombatSystem');
const PacMan = require('../server/PacMan');

describe('CombatSystem', () => {
  test('detects collision between two overlapping pacmans', () => {
    const a = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const b = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    a.x = 100; a.y = 100;
    b.x = 110; b.y = 100;
    expect(CombatSystem.checkCollision(a, b)).toBe(true);
  });

  test('no collision when far apart', () => {
    const a = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    const b = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    a.x = 100; a.y = 100;
    b.x = 500; b.y = 500;
    expect(CombatSystem.checkCollision(a, b)).toBe(false);
  });

  test('active hits inactive for 5 damage (no gift)', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    attacker.activatedByGift = true;
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(5);
    expect(target.points).toBe(495);
  });

  test('inactive cannot hit active', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'active' });
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(false);
  });

  test('donut hits unprotected player for 10', () => {
    const attacker = new PacMan({ type: 'player', username: 'test' });
    attacker.joinTeam('blue');
    attacker.applyGift('donut', '#ffff00', 3000);
    const target = new PacMan({ type: 'player', username: 'test2' });
    target.joinTeam('pink');
    target.state = 'active';
    target.activeGift = null;
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(10);
  });

  test('donut cannot hit gift-protected player', () => {
    const attacker = new PacMan({ type: 'player', username: 'a' });
    attacker.joinTeam('blue');
    attacker.applyGift('donut', '#ffff00', 3000);
    const target = new PacMan({ type: 'player', username: 'b' });
    target.joinTeam('pink');
    target.applyGift('rose', '#ff69b4', 3000);
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(false);
  });

  test('firetruck hits active players', () => {
    const attacker = new PacMan({ type: 'player', username: 'a' });
    attacker.joinTeam('blue');
    attacker.applyGift('firetruck', '#ff4400', 5000);
    const target = new PacMan({ type: 'player', username: 'b' });
    target.joinTeam('pink');
    target.state = 'active';
    const result = CombatSystem.resolveCombat(attacker, target, Date.now());
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(100);
  });

  test('hit cooldown prevents rapid hits', () => {
    const attacker = new PacMan({ type: 'ai', team: 'blue', state: 'active' });
    attacker.activatedByGift = true;
    const target = new PacMan({ type: 'ai', team: 'pink', state: 'inactive' });
    const now = Date.now();
    const result1 = CombatSystem.resolveCombat(attacker, target, now);
    expect(result1.hit).toBe(true);
    const result2 = CombatSystem.resolveCombat(attacker, target, now + 100);
    expect(result2.hit).toBe(false);
    const result3 = CombatSystem.resolveCombat(attacker, target, now + 600);
    expect(result3.hit).toBe(true);
  });
});
