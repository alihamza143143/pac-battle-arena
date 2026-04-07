const GIFT_MAP = {
  'rose': 'rose',
  'donut': 'donut',
  'confetti': 'confetti',
  'money gun': 'moneygun',
  'fire truck': 'firetruck',
  'tiktok': 'tiktok',
};

const TEAM_JOIN_GIFTS = new Set(['rose', 'tiktok']);

class GiftMapper {
  static mapGift(giftName) {
    const normalized = giftName.toLowerCase().trim();
    return GIFT_MAP[normalized] || null;
  }

  static isTeamJoinGift(giftType) {
    return TEAM_JOIN_GIFTS.has(giftType);
  }
}

module.exports = GiftMapper;
