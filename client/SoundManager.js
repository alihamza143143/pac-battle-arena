class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._userGestured = false;
    this._giftTimeouts = [];
    this._initOnGesture();
  }

  _initOnGesture() {
    const activate = () => {
      this._userGestured = true;
      this._getCtx();
    };
    document.addEventListener('click', activate, { once: true });
    document.addEventListener('touchstart', activate, { once: true });
    document.addEventListener('keydown', activate, { once: true });
  }

  _getCtx() {
    if (!this.ctx) {
      if (!this._userGestured) return null;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Short clean note — always fades out fully, never lingers
  _note(freq, dur = 0.15, vol = 0.07, delay = 0) {
    if (!this.enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      // Clean envelope: quick attack, sustain, smooth release
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    } catch (e) {}
  }

  _giftDelay(fn, ms) {
    const id = setTimeout(fn, ms);
    this._giftTimeouts.push(id);
  }

  // Stop gift — just cancel pending notes. Already-playing notes fade out on their own.
  stopGiftSound() {
    for (const id of this._giftTimeouts) clearTimeout(id);
    this._giftTimeouts = [];
  }

  stopAll() { this.stopGiftSound(); }
  stopAllLoops() { this.stopGiftSound(); }

  // ═══════════════════════════
  //  UI SOUNDS (always play)
  // ═══════════════════════════

  coinCollect() {
    this._note(1200, 0.08, 0.05);
    this._note(1600, 0.06, 0.03, 0.04);
  }

  hit() {
    this._note(180, 0.06, 0.04);
  }

  roundEnd() {
    this._note(523, 0.2, 0.06);
    this._note(659, 0.2, 0.06, 0.15);
    this._note(784, 0.25, 0.07, 0.3);
    this._note(1047, 0.35, 0.06, 0.5);
  }

  kingTransfer() {
    this._note(523, 0.12, 0.05);
    this._note(784, 0.15, 0.05, 0.1);
  }

  freeze() {
    this._note(1568, 0.2, 0.04);
    this._note(2093, 0.15, 0.03, 0.2);
    this._note(1568, 0.15, 0.03, 0.8);
    this._note(2093, 0.15, 0.03, 1.3);
  }

  // ═══════════════════════════
  //  GIFT SOUNDS (exclusive)
  // ═══════════════════════════

  // Rose: 1s — soft ascending chime
  giftRose() {
    this.stopGiftSound();
    this._note(523, 0.18, 0.06);
    this._giftDelay(() => this._note(659, 0.18, 0.06), 220);
    this._giftDelay(() => this._note(784, 0.25, 0.06), 480);
    this._giftDelay(() => this._note(880, 0.2, 0.05), 740);
  }

  // Donut: 3s — bouncy playful melody
  giftDonut() {
    this.stopGiftSound();
    const melody = [392, 440, 523, 440, 523, 587, 523, 659, 587, 523];
    for (let i = 0; i < melody.length; i++) {
      const f = melody[i];
      this._giftDelay(() => this._note(f, 0.18, 0.06), i * 280);
    }
  }

  // Confetti: 3s — rising sparkly arpeggios
  giftConfetti() {
    this.stopGiftSound();
    const arp = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568, 1319];
    for (let i = 0; i < arp.length; i++) {
      const f = arp[i];
      this._giftDelay(() => this._note(f, 0.15, 0.05), i * 260);
    }
  }

  // Money Gun: 4s — rhythmic cash register chimes
  giftMoneyGun() {
    this.stopGiftSound();
    const pattern = [
      [784, 0], [1047, 180], [784, 450], [1047, 630],
      [880, 1000], [1175, 1180], [880, 1450], [1175, 1630],
      [988, 2000], [1319, 2180], [988, 2450], [1319, 2630],
      [1047, 3000], [1397, 3180], [1568, 3500], [1760, 3700],
    ];
    for (const [freq, ms] of pattern) {
      if (ms === 0) { this._note(freq, 0.14, 0.05); }
      else { const f = freq; this._giftDelay(() => this._note(f, 0.14, 0.05), ms); }
    }
  }

  // Fire Truck: 5s — epic power progression
  giftFireTruck() {
    this.stopGiftSound();
    const chords = [
      // Each group plays as a quick chord burst
      [[165, 220, 330], 0],
      [[196, 262, 392], 800],
      [[220, 277, 440], 1600],
      [[262, 330, 523], 2400],
      [[294, 370, 587], 3200],
      [[330, 440, 659], 4000],
    ];
    for (const [notes, ms] of chords) {
      if (ms === 0) {
        for (const f of notes) this._note(f, 0.35, 0.04);
      } else {
        const ns = notes;
        this._giftDelay(() => { for (const f of ns) this._note(f, 0.35, 0.04); }, ms);
      }
    }
    // Low rumble hits
    this._note(55, 0.3, 0.05);
    this._giftDelay(() => this._note(55, 0.3, 0.05), 1200);
    this._giftDelay(() => this._note(55, 0.3, 0.05), 2800);
    this._giftDelay(() => this._note(55, 0.3, 0.05), 4400);
  }
}
