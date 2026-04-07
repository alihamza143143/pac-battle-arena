const CoinSystem = require('../server/CoinSystem');

describe('CoinSystem', () => {
  let coins;

  beforeEach(() => {
    coins = new CoinSystem();
  });

  test('spawnBatch creates 20-30 coins', () => {
    coins.spawnBatch();
    const count = coins.getAll().length;
    expect(count).toBeGreaterThanOrEqual(20);
    expect(count).toBeLessThanOrEqual(30);
  });

  test('coins have position and value', () => {
    coins.spawnBatch();
    const coin = coins.getAll()[0];
    expect(coin.x).toBeGreaterThanOrEqual(0);
    expect(coin.y).toBeGreaterThanOrEqual(0);
    expect(coin.value).toBeGreaterThan(0);
    expect(coin.type).toBeDefined();
  });

  test('active gift player can collect coin', () => {
    coins.spawnBatch();
    const pm = { x: 0, y: 0, size: 50, canCollectCoins: () => true };
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    const collected = coins.checkCollection(pm);
    expect(collected.length).toBeGreaterThan(0);
    expect(collected[0].value).toBeGreaterThan(0);
  });

  test('inactive player cannot collect coin', () => {
    coins.spawnBatch();
    const pm = { x: 0, y: 0, size: 50, canCollectCoins: () => false };
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    const collected = coins.checkCollection(pm);
    expect(collected.length).toBe(0);
  });

  test('collected coin is removed', () => {
    coins.spawnBatch();
    const initialCount = coins.getAll().length;
    const pm = { x: 0, y: 0, size: 50, canCollectCoins: () => true };
    const coin = coins.getAll()[0];
    pm.x = coin.x;
    pm.y = coin.y;
    coins.checkCollection(pm);
    expect(coins.getAll().length).toBe(initialCount - 1);
  });

  test('respawn timer spawns new batch after 30 seconds', () => {
    coins.spawnBatch();
    const initialCount = coins.getAll().length;
    coins.update(30000);
    expect(coins.getAll().length).toBeGreaterThan(initialCount);
  });

  test('toJSON serializes coins', () => {
    coins.spawnBatch();
    const json = coins.toJSON();
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].x).toBeDefined();
    expect(json[0].y).toBeDefined();
    expect(json[0].value).toBeDefined();
    expect(json[0].type).toBeDefined();
  });
});
