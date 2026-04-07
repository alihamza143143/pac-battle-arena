const TeamManager = require('../server/TeamManager');
const PacMan = require('../server/PacMan');
const Arena = require('../server/Arena');

describe('TeamManager', () => {
  let arena, tm;

  beforeEach(() => {
    arena = new Arena();
    tm = new TeamManager(arena);
  });

  test('joinTeam assigns player to pink via rose', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    expect(pm.team).toBe('pink');
    expect(pm.state).toBe('active');
  });

  test('joinTeam assigns player to blue via tiktok gift', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'tiktok');
    expect(pm.team).toBe('blue');
    expect(pm.state).toBe('active');
  });

  test('already on team does not reassign', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    tm.joinTeam(pm, 'tiktok');
    expect(pm.team).toBe('pink');
  });

  test('getTeamScores returns both team totals', () => {
    arena.spawnInitialAI();
    const scores = tm.getTeamScores();
    expect(scores.blue).toBe(5000);
    expect(scores.pink).toBe(5000);
  });

  test('getTeamPlayerCounts returns player counts', () => {
    const pm = new PacMan({ type: 'player', username: 'test' });
    arena.addEntity(pm);
    tm.joinTeam(pm, 'rose');
    const counts = tm.getTeamPlayerCounts();
    expect(counts.pink).toBe(1);
    expect(counts.blue).toBe(0);
  });
});
