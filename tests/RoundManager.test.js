const RoundManager = require('../server/RoundManager');

describe('RoundManager', () => {
  let rm;

  beforeEach(() => {
    rm = new RoundManager();
  });

  test('starts at round 1 with 15 minutes', () => {
    expect(rm.roundNumber).toBe(1);
    expect(rm.remainingMs).toBe(15 * 60 * 1000);
  });

  test('update decrements timer', () => {
    rm.update(1000);
    expect(rm.remainingMs).toBe(15 * 60 * 1000 - 1000);
  });

  test('isRoundOver returns false during round', () => {
    expect(rm.isRoundOver()).toBe(false);
  });

  test('isRoundOver returns true when timer hits 0', () => {
    rm.update(15 * 60 * 1000);
    expect(rm.isRoundOver()).toBe(true);
  });

  test('nextRound resets timer and increments round', () => {
    rm.update(15 * 60 * 1000);
    rm.nextRound();
    expect(rm.roundNumber).toBe(2);
    expect(rm.remainingMs).toBe(15 * 60 * 1000);
    expect(rm.isRoundOver()).toBe(false);
    expect(rm.showingResults).toBe(false);
  });

  test('getRemainingSeconds returns seconds', () => {
    rm.update(5000);
    const secs = rm.getRemainingSeconds();
    expect(secs).toBe(Math.ceil((15 * 60 * 1000 - 5000) / 1000));
  });

  test('showResults sets flag and timer', () => {
    rm.showResults();
    expect(rm.showingResults).toBe(true);
    expect(rm.resultTimer).toBe(10000);
  });

  test('updateResults counts down and signals done', () => {
    rm.showResults();
    const done = rm.updateResults(10000);
    expect(done).toBe(true);
  });
});
