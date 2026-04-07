const ROUND_DURATION = 15 * 60 * 1000;
const RESULT_DISPLAY_TIME = 10000;

class RoundManager {
  constructor() {
    this.roundNumber = 1;
    this.remainingMs = ROUND_DURATION;
    this.showingResults = false;
    this.resultTimer = 0;
  }

  update(dt) {
    if (this.showingResults) return;
    this.remainingMs = Math.max(0, this.remainingMs - dt);
  }

  isRoundOver() {
    return this.remainingMs <= 0;
  }

  getRemainingSeconds() {
    return Math.ceil(this.remainingMs / 1000);
  }

  showResults() {
    this.showingResults = true;
    this.resultTimer = RESULT_DISPLAY_TIME;
  }

  updateResults(dt) {
    this.resultTimer -= dt;
    return this.resultTimer <= 0;
  }

  nextRound() {
    this.roundNumber++;
    this.remainingMs = ROUND_DURATION;
    this.showingResults = false;
    this.resultTimer = 0;
  }

  toJSON() {
    return {
      number: this.roundNumber,
      remainingSeconds: this.getRemainingSeconds(),
      totalSeconds: ROUND_DURATION / 1000,
      showingResults: this.showingResults,
    };
  }
}

module.exports = RoundManager;
