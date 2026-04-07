const GiftMapper = require('../server/tiktok/GiftMapper');

describe('GiftMapper', () => {
  test('maps Rose to rose gift type', () => {
    expect(GiftMapper.mapGift('Rose')).toBe('rose');
  });

  test('maps Donut to donut gift type', () => {
    expect(GiftMapper.mapGift('Donut')).toBe('donut');
  });

  test('maps Confetti to confetti gift type', () => {
    expect(GiftMapper.mapGift('Confetti')).toBe('confetti');
  });

  test('maps Money Gun to moneygun gift type', () => {
    expect(GiftMapper.mapGift('Money Gun')).toBe('moneygun');
  });

  test('maps Fire Truck to firetruck gift type', () => {
    expect(GiftMapper.mapGift('Fire Truck')).toBe('firetruck');
  });

  test('maps TikTok logo gift to tiktok', () => {
    expect(GiftMapper.mapGift('TikTok')).toBe('tiktok');
  });

  test('returns null for unknown gift', () => {
    expect(GiftMapper.mapGift('Unknown Gift')).toBeNull();
  });

  test('isTeamJoinGift identifies rose and tiktok', () => {
    expect(GiftMapper.isTeamJoinGift('rose')).toBe(true);
    expect(GiftMapper.isTeamJoinGift('tiktok')).toBe(true);
    expect(GiftMapper.isTeamJoinGift('donut')).toBe(false);
  });

  test('case insensitive matching', () => {
    expect(GiftMapper.mapGift('rose')).toBe('rose');
    expect(GiftMapper.mapGift('ROSE')).toBe('rose');
    expect(GiftMapper.mapGift('money gun')).toBe('moneygun');
  });
});
