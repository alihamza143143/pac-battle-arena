const Arena = require('../server/Arena');
const PacMan = require('../server/PacMan');

describe('Arena', () => {
  let arena;

  beforeEach(() => {
    arena = new Arena();
  });

  test('starts empty', () => {
    expect(arena.getAll().length).toBe(0);
  });

  test('addEntity adds and getById retrieves', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    arena.addEntity(pm);
    expect(arena.getAll().length).toBe(1);
    expect(arena.getById(pm.id)).toBe(pm);
  });

  test('removeEntity removes', () => {
    const pm = new PacMan({ type: 'ai', team: 'blue' });
    arena.addEntity(pm);
    arena.removeEntity(pm.id);
    expect(arena.getAll().length).toBe(0);
  });

  test('spawnInitialAI creates 20 AI (10 active, 10 inactive)', () => {
    arena.spawnInitialAI();
    const all = arena.getAll();
    expect(all.length).toBe(20);
    const active = all.filter(p => p.state === 'active');
    const inactive = all.filter(p => p.state === 'inactive');
    expect(active.length).toBe(10);
    expect(inactive.length).toBe(10);
  });

  test('spawnInitialAI splits evenly between teams', () => {
    arena.spawnInitialAI();
    const blue = arena.getAll().filter(p => p.team === 'blue');
    const pink = arena.getAll().filter(p => p.team === 'pink');
    expect(blue.length).toBe(10);
    expect(pink.length).toBe(10);
  });

  test('respawnAI fills back to 20', () => {
    arena.spawnInitialAI();
    const first = arena.getAll()[0];
    arena.removeEntity(first.id);
    expect(arena.getAICount()).toBe(19);
    arena.respawnAI();
    expect(arena.getAICount()).toBe(20);
  });

  test('getByUsername finds player', () => {
    const pm = new PacMan({ type: 'player', username: 'Ali' });
    arena.addEntity(pm);
    expect(arena.getByUsername('Ali')).toBe(pm);
  });

  test('getTeamEntities filters by team', () => {
    arena.spawnInitialAI();
    const blue = arena.getTeamEntities('blue');
    expect(blue.length).toBe(10);
    blue.forEach(p => expect(p.team).toBe('blue'));
  });

  test('getTeamScore sums points for team', () => {
    arena.spawnInitialAI();
    const blueScore = arena.getTeamScore('blue');
    expect(blueScore).toBe(5000);
  });
});
