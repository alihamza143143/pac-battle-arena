const GrowthSystem = require('../server/GrowthSystem');

describe('GrowthSystem', () => {
  test('calcSize returns base size for 0 points', () => {
    expect(GrowthSystem.calcSize(0)).toBe(25);
  });

  test('calcSize at 500 points', () => {
    expect(GrowthSystem.calcSize(500)).toBe(45);
  });

  test('calcSize at 2000 points', () => {
    expect(GrowthSystem.calcSize(2000)).toBe(105);
  });

  test('calcSize has no cap', () => {
    expect(GrowthSystem.calcSize(10000)).toBe(425);
  });

  test('calcSpeed increases with size', () => {
    const small = GrowthSystem.calcSpeed(25);
    const big = GrowthSystem.calcSpeed(100);
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
    expect(pm.size).toBe(105);
    expect(pm.speed).toBeGreaterThan(0);
  });
});
