class SoundManager {
  constructor() { this.ctx = null; this.enabled = false; this.volume = 0.3; }

  _getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  _playTone(freq, duration, type = 'sine', vol = this.volume) {
    if (!this.enabled) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  coinCollect() { this._playTone(800, 0.1, 'sine', 0.15); }
  hit() { this._playTone(200, 0.08, 'square', 0.1); }
  giftRose() { this._playTone(600, 0.15, 'sine', 0.2); }
  giftDonut() { this._playTone(700, 0.2, 'sine', 0.25); setTimeout(() => this._playTone(900, 0.15, 'sine', 0.2), 100); }
  giftConfetti() { this._playTone(800, 0.2, 'sine', 0.25); setTimeout(() => this._playTone(1000, 0.15, 'sine', 0.2), 80); setTimeout(() => this._playTone(1200, 0.15, 'sine', 0.2), 160); }
  giftMoneyGun() { this._playTone(1200, 0.05, 'square', 0.2); setTimeout(() => this._playTone(1500, 0.05, 'square', 0.2), 50); setTimeout(() => this._playTone(1800, 0.1, 'sine', 0.25), 100); }
  giftFireTruck() { this._playTone(80, 0.4, 'sawtooth', 0.3); this._playTone(60, 0.5, 'sine', 0.2); setTimeout(() => this._playTone(120, 0.3, 'square', 0.15), 200); }
  freeze() { this._playTone(2000, 0.3, 'sine', 0.15); setTimeout(() => this._playTone(2500, 0.2, 'sine', 0.1), 150); }
  roundEnd() { this._playTone(523, 0.15, 'sine', 0.25); setTimeout(() => this._playTone(659, 0.15, 'sine', 0.25), 150); setTimeout(() => this._playTone(784, 0.3, 'sine', 0.3), 300); }
  kingTransfer() { this._playTone(523, 0.1, 'sine', 0.15); setTimeout(() => this._playTone(784, 0.2, 'sine', 0.2), 100); }
}
