// Web Audio API procedural cute pastel sound synthesizer
// Only initializes and plays after the user's first interaction.

type SoundType =
  | 'click'
  | 'react'
  | 'jump'
  | 'levelup'
  | 'coin'
  | 'event'
  | 'eat'
  | 'sleep'
  | 'angry'
  | 'wash';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private bgmEnabled = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private unlocked = false;

  public unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    if (this.bgmEnabled && this.bgmTimer === null) {
      this.startBgmLoop();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (enabled && this.unlocked) {
      this.startBgmLoop();
    } else {
      this.stopBgmLoop();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    slideTo?: number
  ) {
    if (!this.ctx || !this.unlocked) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public play(sound: SoundType) {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;

    switch (sound) {
      case 'click':
        this.playTone(620, 0.06, 'sine', 0.09, 0, 760);
        break;
      case 'react':
        this.playTone(460, 0.08, 'triangle', 0.12, 0, 680);
        this.playTone(680, 0.1, 'sine', 0.1, 0.06, 820);
        break;
      case 'jump':
        this.playTone(320, 0.16, 'sine', 0.13, 0, 740);
        break;
      case 'coin':
        this.playTone(987.77, 0.09, 'sine', 0.11, 0);
        this.playTone(1318.51, 0.22, 'sine', 0.12, 0.07);
        break;
      case 'eat':
        this.playTone(280, 0.07, 'triangle', 0.12, 0, 200);
        this.playTone(340, 0.07, 'triangle', 0.12, 0.11, 240);
        this.playTone(420, 0.09, 'sine', 0.11, 0.22, 520);
        break;
      case 'sleep':
        this.playTone(392, 0.25, 'sine', 0.08, 0, 349.23);
        this.playTone(329.63, 0.35, 'sine', 0.07, 0.22, 261.63);
        break;
      case 'wash':
        this.playTone(520, 0.07, 'sine', 0.08, 0, 880);
        this.playTone(660, 0.08, 'sine', 0.08, 0.08, 1020);
        this.playTone(780, 0.1, 'sine', 0.08, 0.16, 1180);
        break;
      case 'angry':
        this.playTone(220, 0.12, 'sawtooth', 0.06, 0, 150);
        this.playTone(180, 0.14, 'sawtooth', 0.06, 0.1, 130);
        break;
      case 'event':
        this.playTone(440, 0.1, 'triangle', 0.11, 0);
        this.playTone(554.37, 0.1, 'triangle', 0.11, 0.09);
        this.playTone(659.25, 0.18, 'triangle', 0.12, 0.18);
        break;
      case 'levelup':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          this.playTone(freq, 0.22, 'triangle', 0.13, idx * 0.09);
        });
        break;
    }
  }

  private startBgmLoop() {
    if (this.bgmTimer !== null) return;
    // Cozy pastel pentatonic melody
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      587.33, 698.46, 880.0, 698.46,
      523.25, 659.25, 783.99, 1046.5,
      783.99, 659.25, 587.33, 523.25,
    ];
    this.bgmTimer = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || !this.unlocked) return;
      const note = melody[this.bgmStep % melody.length];
      this.playTone(note, 0.36, 'sine', 0.032, 0);
      if (this.bgmStep % 4 === 0) {
        this.playTone(note / 2, 0.55, 'triangle', 0.022, 0);
      }
      this.bgmStep++;
    }, 520);
  }

  private stopBgmLoop() {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
