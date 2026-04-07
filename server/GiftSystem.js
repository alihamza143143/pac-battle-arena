const GIFT_CONFIG = {
  rose: { color: '#ff69b4', duration: 3000, tier: 1 },
  donut: { color: '#ffff00', duration: 3000, tier: 2 },
  confetti: { color: '#ff00ff', duration: 3000, tier: 3 },
  moneygun: { color: '#ffd700', duration: 3000, tier: 4 },
  firetruck: { color: '#ff4400', duration: 5000, tier: 5 },
};

class GiftSystem {
  static applyGift(pacman, giftType) {
    const config = GIFT_CONFIG[giftType];
    if (!config) return false;
    pacman.activate();
    return pacman.applyGift(giftType, config.color, config.duration);
  }

  static applyMoneyGun(user, arena) {
    const config = GIFT_CONFIG.moneygun;
    user.applyGift('moneygun', config.color, config.duration);
    user.activate();

    const allOthers = arena.getAll().filter(p => p.id !== user.id);
    const frozen = [];
    let totalStolen = 0;

    for (const other of allOthers) {
      const steal = Math.min(50, other.points);
      other.takeDamage(steal);
      totalStolen += steal;
      frozen.push(other.id);
    }

    user.addPoints(totalStolen);
    return { frozen, totalStolen };
  }

  static getConfig(giftType) {
    return GIFT_CONFIG[giftType] || null;
  }
}

module.exports = GiftSystem;
