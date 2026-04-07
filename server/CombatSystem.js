class CombatSystem {
  static checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const aRadius = (a.size * (a.getSizeMultiplier ? a.getSizeMultiplier() : 1)) / 2;
    const bRadius = (b.size * (b.getSizeMultiplier ? b.getSizeMultiplier() : 1)) / 2;
    return dist < (aRadius + bRadius);
  }

  static resolveCombat(attacker, target, now) {
    if (!attacker.canHitTarget(target)) {
      return { hit: false, damage: 0 };
    }
    if (attacker.isOnCooldown(target.id, now)) {
      return { hit: false, damage: 0 };
    }

    const damage = attacker.getDamagePerHit();
    target.takeDamage(damage);
    attacker.addPoints(damage);
    attacker.recordHit(target.id, now);
    target.applyKnockback(attacker.x, attacker.y);

    return { hit: true, damage };
  }

  static processAllCollisions(entities, now) {
    const results = [];
    const arr = entities;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (!CombatSystem.checkCollision(a, b)) continue;

        if (a.canHitTarget(b)) {
          const result = CombatSystem.resolveCombat(a, b, now);
          if (result.hit) results.push({ attacker: a.id, target: b.id, damage: result.damage });
        }
        if (b.canHitTarget(a)) {
          const result = CombatSystem.resolveCombat(b, a, now);
          if (result.hit) results.push({ attacker: b.id, target: a.id, damage: result.damage });
        }
      }
    }
    return results;
  }
}

module.exports = CombatSystem;
