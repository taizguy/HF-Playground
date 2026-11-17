// Lightweight Web Audio API sound effects (no external audio files required)

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.08,
    delay = 0
  ) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Ignore audio errors on locked browsers
    }
  }

  click() {
    this.playTone(520, 0.06, 'triangle', 0.06);
  }

  step() {
    this.playTone(340, 0.07, 'sine', 0.06);
  }

  turn() {
    this.playTone(420, 0.06, 'triangle', 0.05);
  }

  jump() {
    this.playTone(440, 0.08, 'sine', 0.06, 0);
    this.playTone(620, 0.1, 'sine', 0.06, 0.06);
  }

  water() {
    this.playTone(580, 0.08, 'sine', 0.06, 0);
    this.playTone(720, 0.12, 'sine', 0.06, 0.07);
  }

  collect() {
    this.playTone(660, 0.09, 'triangle', 0.08, 0);
    this.playTone(880, 0.14, 'triangle', 0.08, 0.08);
  }

  sensor() {
    this.playTone(760, 0.05, 'sine', 0.04);
  }

  error() {
    this.playTone(220, 0.14, 'sawtooth', 0.05, 0);
    this.playTone(170, 0.2, 'sawtooth', 0.05, 0.11);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'triangle', 0.08, idx * 0.09);
    });
  }
}

export const sound = new SoundEffects();
