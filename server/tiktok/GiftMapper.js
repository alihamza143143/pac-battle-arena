// Map real TikTok gift names to game gift types
// TikTok sends exact gift names — we need all variations
const GIFT_MAP = {
  // Rose
  'rose': 'rose',
  'rosa': 'rose',

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

class GiftMapper {
  static mapGift(giftName) {
    const normalized = giftName.toLowerCase().trim();
    if (GIFT_MAP[normalized]) return GIFT_MAP[normalized];
    for (const [key, value] of Object.entries(GIFT_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value;
    }
    return null;
  }
}

module.exports = GiftMapper;
