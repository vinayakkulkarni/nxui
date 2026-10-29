import type { RecorderClick, RecorderClicker } from './types';

/**
 * Tactile clicks synthesised with Web Audio. The context is made on the first
 * click, which always comes from a press, so the browser lets it start.
 */
export function createClicker(enabled: () => boolean): RecorderClicker {
  let ctx: AudioContext | undefined;
  let noiseBuf: AudioBuffer | undefined;

  function click(kind: RecorderClick = 'down', gain = 1): void {
    if (!enabled() || typeof AudioContext === 'undefined') return;
    try {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
    } catch {
      return;
    }
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * 0.03),
        ctx.sampleRate,
      );
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = kind === 'down' ? 2200 : kind === 'tick' ? 5200 : 3400;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.value =
      (kind === 'down' ? 0.45 : kind === 'tick' ? 0.08 : 0.24) * gain;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
    if (kind === 'down') {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.05);
      og.gain.setValueAtTime(0.12 * gain, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(og).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.07);
    }
  }

  function dispose(): void {
    void ctx?.close().catch(() => undefined);
    ctx = undefined;
  }

  return { click, dispose };
}
