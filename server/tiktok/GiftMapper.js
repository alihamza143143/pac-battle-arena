// Map real TikTok gift names to game gift types
// TikTok sends exact gift names — we need all variations
const GIFT_MAP = {
  // Rose (Girls team join)
  'rose': 'rose',
  'rosa': 'rose',

  // TikTok generic (Boys team join)
  'tiktok': 'tiktok',

  // Donut — TikTok sends "Doughnut" not "Donut"
  'donut': 'donut',
  'doughnut': 'donut',

  // Confetti
  'confetti': 'confetti',

  // Money Gun
  'money gun': 'moneygun',
  'moneygun': 'moneygun',

  // Fire Truck — TikTok may send "Fireworks", "Fire Truck", etc.
  'fire truck': 'firetruck',
  'firetruck': 'firetruck',
  'fireworks': 'firetruck',
  'firework': 'firetruck',
};

const TEAM_JOIN_GIFTS = new Set(['rose', 'tiktok']);

class GiftMapper {
  static mapGift(giftName) {
    const normalized = giftName.toLowerCase().trim();
    // Exact match first
    if (GIFT_MAP[normalized]) return GIFT_MAP[normalized];
    // Partial match — check if any key is contained in the gift name
    for (const [key, value] of Object.entries(GIFT_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value;
    }
    return null;
  }

  static isTeamJoinGift(giftType) {
    return TEAM_JOIN_GIFTS.has(giftType);
  }
}

module.exports = GiftMapper;
