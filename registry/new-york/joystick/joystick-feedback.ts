import type {
  JoystickAudioGraph,
  JoystickHaptics,
  JoystickHitOptions,
  JoystickSfx,
  JoystickToneOptions,
} from './types';

const VOLUME = 0.22;

/** Sound, synthesised with Web Audio, no files. Browser-only: call after mount. */
export function createSfx(startMuted: boolean): JoystickSfx {
  let ctx: AudioContext | null = null;
  let bus: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = startMuted;
  let closed = false;

  /*
   * Building the engine costs the main thread a noticeable slice, and built
   * inside the first grab it would stall that grab's first frames. So it is
   * built in idle time once the stick is on screen — suspended, if the page
   * has not seen a gesture yet — and the grab only has to resume it.
   */
  function build(): void {
    if (ctx || closed || typeof AudioContext === 'undefined') return;
    ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    bus = ctx.createGain();
    bus.gain.value = muted ? 0 : VOLUME;
    bus.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function unlock(): void {
    if (!ctx) build();
    if (ctx?.state === 'suspended') void ctx.resume();
  }

  function live(): JoystickAudioGraph | null {
    if (muted || !ctx || !bus || !noise || ctx.state !== 'running') return null;
    return { ctx, bus, noise };
  }

  function tone(
    g: JoystickAudioGraph,
    {
      type = 'square',
      freq,
      to,
      t,
      dur,
      gain,
      release = 0.03,
    }: JoystickToneOptions,
  ): OscillatorNode {
    const o = g.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const env = g.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.003);
    env.gain.setValueAtTime(gain, Math.max(t + 0.004, t + dur - release));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env).connect(g.bus);
    o.start(t);
    o.stop(t + dur + 0.02);
    return o;
  }

  function hit(
    g: JoystickAudioGraph,
    {
      t,
      dur,
      gain,
      type = 'highpass',
      freq = 6000,
      q = 0.8,
    }: JoystickHitOptions,
  ): void {
    const src = g.ctx.createBufferSource();
    src.buffer = g.noise;
    const f = g.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const env = g.ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(env).connect(g.bus);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  return {
    unlock,
    warm: build,
    setMuted(value) {
      muted = value;
      if (ctx && bus)
        bus.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.02);
    },
    /* microswitch: a crisp click on make, a softer one on break */
    click(make) {
      const g = live();
      if (!g) return;
      const t = g.ctx.currentTime;
      hit(g, {
        t,
        dur: make ? 0.016 : 0.01,
        gain: make ? 0.5 : 0.22,
        freq: make ? 4200 : 6000,
      });
      tone(g, {
        freq: make ? 2400 : 3200,
        to: make ? 1700 : 2500,
        t,
        dur: 0.012,
        gain: make ? 0.06 : 0.03,
        release: 0.008,
      });
    },
    /* the shaft bottoming out on the gate */
    thock() {
      const g = live();
      if (!g) return;
      const t = g.ctx.currentTime;
      tone(g, { freq: 130, to: 60, t, dur: 0.06, gain: 0.14 });
      hit(g, { t, dur: 0.045, gain: 0.3, type: 'lowpass', freq: 900 });
    },
    /* the return spring's twang on release */
    boing(strength = 1) {
      const g = live();
      if (!g || strength < 0.2) return;
      const t = g.ctx.currentTime;
      const o = tone(g, {
        type: 'triangle',
        freq: 300,
        to: 150,
        t,
        dur: 0.24,
        gain: 0.12 * strength,
        release: 0.18,
      });
      const lfo = g.ctx.createOscillator();
      const depth = g.ctx.createGain();
      lfo.frequency.value = 22;
      depth.gain.setValueAtTime(40, t);
      depth.gain.exponentialRampToValueAtTime(1, t + 0.24);
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + 0.28);
    },
    /* a soft tick as the ball is grabbed */
    tick() {
      const g = live();
      if (!g) return;
      hit(g, {
        t: g.ctx.currentTime,
        dur: 0.02,
        gain: 0.18,
        type: 'bandpass',
        freq: 2500,
        q: 2,
      });
    },
    close() {
      closed = true;
      void ctx?.close().catch(() => {});
      ctx = null;
    },
  };
}

/**
 * Haptics, best effort: vibrate on Android, the switch-input tap on iOS 18+,
 * rumble on gamepads. Browser-only: call after mount.
 */
export function createHaptics(): JoystickHaptics {
  const ua = navigator.userAgent;
  const isIOS =
    /iP(?:hone|ad|od)/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const canVibrate = typeof navigator.vibrate === 'function';
  let iosLabel: HTMLLabelElement | null = null;
  if (isIOS) {
    iosLabel = document.createElement('label');
    iosLabel.setAttribute('aria-hidden', 'true');
    iosLabel.style.cssText =
      'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    iosLabel.append(input);
    document.body.append(iosLabel);
  }
  /* browsers ignore vibration until there has been a gesture */
  let unlocked = false;

  return {
    unlock() {
      unlocked = true;
    },
    pulse(ms = 10, power = 0.5) {
      if (!unlocked) return;
      try {
        if (canVibrate) navigator.vibrate(ms);
        else iosLabel?.click();
      } catch {
        /* unsupported — nothing to feel */
      }
      for (const pad of navigator.getGamepads?.() ?? []) {
        pad?.vibrationActuator
          ?.playEffect('dual-rumble', {
            duration: Math.max(ms, 20),
            strongMagnitude: power * 0.6,
            weakMagnitude: power,
          })
          .catch(() => {});
      }
    },
    dispose() {
      iosLabel?.remove();
      iosLabel = null;
    },
  };
}
