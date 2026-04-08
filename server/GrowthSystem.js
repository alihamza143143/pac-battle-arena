const BASE_SIZE = 50;  // 2x bigger (was 25)
const MAX_SIZE = 160;  // 2x bigger (was 90)
const GROWTH_RATE = 0.0008;
const BASE_SPEED = 1.1; // slightly faster base
const SPEED_FACTOR = 0.012;
const BASE_MOUTH_SPEED = 0.8;
const MOUTH_SPEED_FACTOR = 0.012;

const GrowthSystem = {
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
