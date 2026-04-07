const BASE_SIZE = 25;
const SIZE_PER_POINT = 1 / 25;
const BASE_SPEED = 0.5;
const SPEED_FACTOR = 0.02;
const BASE_MOUTH_SPEED = 0.05;
const MOUTH_SPEED_FACTOR = 0.001;

const GrowthSystem = {
  calcSize(points) {
    return BASE_SIZE + points * SIZE_PER_POINT;
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
