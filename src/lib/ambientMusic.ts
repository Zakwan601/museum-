import { MUSIC } from '../config';

const MUSIC_LEVEL = .045, SOFT_LEVEL = .018;

export class AmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfos: OscillatorNode[] = [];
  private _isPlaying = false;
  private softened = false;
  private audio: HTMLAudioElement | null = null;
  private request = 0;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  private init() {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    if (MUSIC.url) {
      this.audio = new Audio(MUSIC.url);
      this.audio.preload = 'none';
      this.audio.loop = true;
      this.ctx.createMediaElementSource(this.audio).connect(this.masterGain);
      return;
    }

    const delay = this.ctx.createDelay(2);
    delay.delayTime.value = 0.6;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.35;
    const delayMix = this.ctx.createGain();
    delayMix.gain.value = 0.4;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(this.masterGain);

    const notes = [130.81, 196.0, 261.63, 329.63, 392.0];

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;

      const gain = this.ctx!.createGain();
      gain.gain.value = 0.07 / (i * 0.25 + 1);

      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + i * 0.03;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      gain.connect(delay);

      osc.start();
      lfo.start();
      this.oscillators.push(osc);
      this.lfos.push(lfo);
    });
  }

  async play() {
    const request = ++this.request;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this._isPlaying) return;
    // Start both operations within the original tap for mobile autoplay rules.
    await Promise.all([
      this.ctx.state === 'suspended' ? this.ctx.resume() : Promise.resolve(),
      this.audio ? this.audio.play() : Promise.resolve(),
    ]);
    if (request !== this.request) return;
    this._isPlaying = true;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.softened ? SOFT_LEVEL : MUSIC_LEVEL, now + 3);
  }

  pause() {
    if (!this.ctx || !this.masterGain || !this._isPlaying) return;
    this._isPlaying = false;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
  }

  soften(softened: boolean) {
    this.softened = softened;
    if (!this.ctx || !this.masterGain || !this._isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(softened ? SOFT_LEVEL : MUSIC_LEVEL, now + 3);
  }

  async toggle() {
    if (this._isPlaying) this.pause();
    else await this.play();
  }

  dispose() {
    this.request++;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    this.oscillators.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    this.lfos.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    this.oscillators = [];
    this.lfos = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this._isPlaying = false;
  }
}
