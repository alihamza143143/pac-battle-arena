const GiftSystem = require('../server/GiftSystem');
const PacMan = require('../server/PacMan');
const Arena = require('../server/Arena');

describe('GiftSystem', () => {
  test('applyRose activates player with minimal boost', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('pink');
    pm.state = 'inactive';
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.state).toBe('active');
    expect(pm.activeGift.type).toBe('rose');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyDonut sets yellow color and 3 sec', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'donut');
    expect(pm.activeGift.type).toBe('donut');
    expect(pm.activeGift.color).toBe('#ffff00');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyConfetti sets 3 sec', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'confetti');
    expect(pm.activeGift.type).toBe('confetti');
    expect(pm.activeGift.remainingMs).toBe(3000);
  });

  test('applyFiretruck sets 5 sec duration', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'firetruck');
    expect(pm.activeGift.type).toBe('firetruck');
    expect(pm.activeGift.remainingMs).toBe(5000);
  });

  test('applyMoneyGun freezes all others and steals 50 from each', () => {
    const arena = new Arena();
    const user = new PacMan({ type: 'player', username: 'rich' });
    user.joinTeam('blue');
    arena.addEntity(user);

    const other1 = new PacMan({ type: 'ai', team: 'pink', state: 'active' });
    const other2 = new PacMan({ type: 'ai', team: 'blue', state: 'inactive' });
    arena.addEntity(other1);
    arena.addEntity(other2);

    const result = GiftSystem.applyMoneyGun(user, arena);
    expect(result.frozen.length).toBe(2);
    expect(other1.points).toBe(450);
    expect(other2.points).toBe(450);
    expect(user.points).toBe(600);
  });

  test('higher tier gift replaces lower tier', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.activeGift.type).toBe('rose');
    GiftSystem.applyGift(pm, 'donut');
    expect(pm.activeGift.type).toBe('donut');
  });

  test('lower tier gift does not replace higher tier', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    pm.joinTeam('blue');
    GiftSystem.applyGift(pm, 'confetti');
    GiftSystem.applyGift(pm, 'rose');
    expect(pm.activeGift.type).toBe('confetti');
  });
});
