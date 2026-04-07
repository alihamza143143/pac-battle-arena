const GrowthSystem = require('../server/GrowthSystem');

describe('GrowthSystem', () => {
  test('calcSize returns base size for 0 points', () => {
    expect(GrowthSystem.calcSize(0)).toBe(25);
  });

  test('calcSize grows with points (diminishing returns)', () => {
    const s500 = GrowthSystem.calcSize(500);
    const s1000 = GrowthSystem.calcSize(1000);
    const s2000 = GrowthSystem.calcSize(2000);
    const s5000 = GrowthSystem.calcSize(5000);
    expect(s500).toBeGreaterThan(25);
    expect(s1000).toBeGreaterThan(s500);
    expect(s2000).toBeGreaterThan(s1000);
    expect(s5000).toBeGreaterThan(s2000);
  });

  test('calcSize never exceeds practical max (~90px)', () => {
    expect(GrowthSystem.calcSize(50000)).toBeLessThanOrEqual(91);
  });

  test('calcSize at 500 points is reasonable', () => {
    const size = GrowthSystem.calcSize(500);
    expect(size).toBeGreaterThan(30);
    expect(size).toBeLessThan(55);
  });

  test('calcSpeed increases with size', () => {
    const small = GrowthSystem.calcSpeed(25);
    const big = GrowthSystem.calcSpeed(80);
    expect(big).toBeGreaterThan(small);
  });

  test('calcMouthSpeed is 0 for inactive', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'inactive')).toBe(0);
  });

  test('calcMouthSpeed is 0 for neutral', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'neutral')).toBe(0);
  });

  test('calcMouthSpeed is positive for active', () => {
    expect(GrowthSystem.calcMouthSpeed(50, 'active')).toBeGreaterThan(0);
  });

  test('updateEntity recalculates size and speed', () => {
    const pm = { points: 2000, size: 0, speed: 0, mouthSpeed: 0, state: 'active' };
    GrowthSystem.updateEntity(pm);
    expect(pm.size).toBeGreaterThan(50);
    expect(pm.size).toBeLessThan(80);
    expect(pm.speed).toBeGreaterThan(0);
  });
});
