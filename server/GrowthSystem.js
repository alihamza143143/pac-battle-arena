const BASE_SIZE = 25;
const MAX_SIZE = 90; // practical visual cap
const GROWTH_RATE = 0.0008; // diminishing returns curve
const BASE_SPEED = 0.5;
const SPEED_FACTOR = 0.015;
const BASE_MOUTH_SPEED = 0.8;
const MOUTH_SPEED_FACTOR = 0.015;

const GrowthSystem = {
  // Logarithmic growth: grows fast early, slows down at high points
  // 500 pts → ~38px, 1000 pts → ~50px, 2000 pts → ~63px, 5000 pts → ~78px, 10000 pts → ~86px
  calcSize(points) {
    return BASE_SIZE + (MAX_SIZE - BASE_SIZE) * (1 - Math.exp(-GROWTH_RATE * points));
  },

  calcSpeed(size) {
    return BASE_SPEED + size * SPEED_FACTOR;
  },

  calcMouthSpeed(size, state) {
    if (state === 'inactive' || state === 'neutral') return 0;
    return BASE_MOUTH_SPEED + size * MOUTH_SPEED_FACTOR;
  },

  updateEntity(pm) {
    pm.size = GrowthSystem.calcSize(pm.points);
    pm.speed = GrowthSystem.calcSpeed(pm.size);
    pm.mouthSpeed = GrowthSystem.calcMouthSpeed(pm.size, pm.state);
  },
};

module.exports = GrowthSystem;
